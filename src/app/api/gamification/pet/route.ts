import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { virtualPets, petEvolutionStages, achievements, familyFeed } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/gamification/pet - Get child's virtual pet
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    // Verify child belongs to family
    const [child] = await db
      .select()
      .from(require('@/server/db/schema').children)
      .where(and(
        eq(require('@/server/db/schema').children.id, childId),
        eq(require('@/server/db/schema').children.familyId, familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get or create virtual pet
    let [pet] = await db
      .select()
      .from(virtualPets)
      .where(eq(virtualPets.childId, childId));

    if (!pet) {
      // Create default pet for child
      const species = ['dragon', 'unicorn', 'phoenix'][Math.floor(Math.random() * 3)] as any;
      const defaultName = `${child.name}'s ${species.charAt(0).toUpperCase() + species.slice(1)}`;

      [pet] = await db.insert(virtualPets).values({
        childId,
        familyId,
        name: defaultName,
        species,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        hunger: 100,
        happiness: 100,
        emotion: 'happy',
        evolutionStage: 1,
        lastFed: new Date(),
      }).returning();
    }

    // Update pet status based on time
    const now = new Date();
    const lastFed = pet.lastFed ? new Date(pet.lastFed) : now;
    const hoursSinceFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);

    // Hunger decreases over time
    let newHunger = Math.max(0, pet.hunger - Math.floor(hoursSinceFed * 5));
    let newEmotion = pet.emotion;

    if (newHunger < 30) {
      newEmotion = 'hungry';
    } else if (newHunger > 80 && pet.happiness > 70) {
      newEmotion = 'happy';
    }

    // Update pet if status changed
    if (newHunger !== pet.hunger || newEmotion !== pet.emotion) {
      await db
        .update(virtualPets)
        .set({
          hunger: newHunger,
          emotion: newEmotion,
          updatedAt: now,
        })
        .where(eq(virtualPets.id, pet.id));

      pet.hunger = newHunger;
      pet.emotion = newEmotion;
    }

    // Get evolution stage info
    const [evolutionStage] = await db
      .select()
      .from(petEvolutionStages)
      .where(and(
        eq(petEvolutionStages.species, pet.species),
        eq(petEvolutionStages.stage, pet.evolutionStage)
      ));

    return NextResponse.json({
      pet: {
        ...pet,
        evolutionStage: evolutionStage || null,
      }
    });
  } catch (error) {
    console.error('Error fetching virtual pet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/gamification/pet - Update pet (feed, interact)
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const body = await request.json();
    const { childId, action, petName } = body;

    if (!childId || !action) {
      return NextResponse.json({ error: 'Child ID and action required' }, { status: 400 });
    }

    // Get pet
    const [pet] = await db
      .select()
      .from(virtualPets)
      .where(and(
        eq(virtualPets.childId, childId),
        eq(virtualPets.familyId, familyId)
      ));

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
    }

    const now = new Date();
    let updates: any = { updatedAt: now, lastInteraction: now };

    switch (action) {
      case 'feed':
        updates.hunger = Math.min(100, pet.hunger + 30);
        updates.lastFed = now;
        if (updates.hunger > 80) {
          updates.emotion = 'happy';
          updates.happiness = Math.min(100, pet.happiness + 10);
        }
        break;

      case 'play':
        updates.happiness = Math.min(100, pet.happiness + 15);
        if (updates.happiness > 70) {
          updates.emotion = 'excited';
        }
        break;

      case 'rename':
        if (petName && petName.length > 0 && petName.length <= 50) {
          updates.name = petName;
        } else {
          return NextResponse.json({ error: 'Invalid pet name' }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update pet
    const [updatedPet] = await db
      .update(virtualPets)
      .set(updates)
      .where(eq(virtualPets.id, pet.id))
      .returning();

    // Add to family feed if significant action
    if (action === 'feed' || action === 'play') {
      const feedMessage = action === 'feed'
        ? `${pet.name} is gevoed en voelt zich geweldig!`
        : `${pet.name} heeft gespeeld en is super blij!`;

      await db.insert(familyFeed).values({
        familyId,
        childId,
        type: 'pet_interaction',
        message: feedMessage,
        data: { action, petName: pet.name },
      });
    }

    return NextResponse.json({ pet: updatedPet });
  } catch (error) {
    console.error('Error updating virtual pet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}