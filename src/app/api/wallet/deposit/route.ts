import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { wallets, walletTransactions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

const depositSchema = z.object({
  amountCents: z.number().int().min(100).max(100000), // Min €1, max €1000
  description: z.string().max(255).optional(),
});

export async function POST(request: Request) {
  // Security middleware check
  const securityCheck = await securityMiddleware(request, {
    maxPayloadSize: 1024 * 1024, // 1MB limit
    allowedOrigins: ['klusjeskoning.nl', 'klusjeskoningapp.nl']
  });

  if (!securityCheck.valid) {
    return securityCheck.response!;
  }

  // Rate limiting
  const rateLimitResult = await checkApiRateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json({
      error: 'Te veel API verzoeken. Probeer het later opnieuw.',
      retryAfter: rateLimitResult.reset,
    }, {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.reset?.getTime() || Date.now() + 3600000) / 1000).toString(),
      }
    });
  }

  try {
    const session = await requireSession();
    const body = await request.json();
    const data = depositSchema.parse(body);

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get or create wallet for family
    let [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.familyId, session.familyId))
      .limit(1);

    if (!wallet) {
      [wallet] = await db
        .insert(wallets)
        .values({
          familyId: session.familyId,
          balanceCents: 0,
          currency: 'EUR',
          isActive: 1,
        })
        .returning();
    }

    // In production, this would integrate with payment providers
    // For development/demo purposes, we'll simulate instant deposits

    await db.transaction(async (tx) => {
      // Update wallet balance
      await tx
        .update(wallets)
        .set({
          balanceCents: wallet.balanceCents + data.amountCents,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      // Record the deposit transaction
      await tx
        .insert(walletTransactions)
        .values({
          walletId: wallet.id,
          amountCents: data.amountCents, // Positive for credit
          type: 'credit',
          status: 'completed',
          description: data.description || `Storting van €${(data.amountCents / 100).toFixed(2)}`,
          processedAt: new Date(),
        });
    });

    return NextResponse.json({
      success: true,
      message: `€${(data.amountCents / 100).toFixed(2)} succesvol toegevoegd aan je portemonnee!`,
      newBalanceCents: wallet.balanceCents + data.amountCents,
    });

  } catch (error) {
    console.error('[wallet] deposit error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}