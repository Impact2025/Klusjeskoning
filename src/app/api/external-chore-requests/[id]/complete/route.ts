import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { externalChoreRequests, children } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

const completeSchema = z.object({
  evidenceUrl: z.string().url(), // Photo/video proof URL
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const resolvedParams = await params;
    const requestId = resolvedParams.id;
    const body = await request.json();
    const data = completeSchema.parse(body);

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get the external chore request with child info
    const [choreRequest] = await db
      .select({
        id: externalChoreRequests.id,
        childId: externalChoreRequests.childId,
        familyId: externalChoreRequests.familyId,
        status: externalChoreRequests.status,
        offeredAmountCents: externalChoreRequests.offeredAmountCents,
        paymentMode: externalChoreRequests.paymentMode,
        title: externalChoreRequests.title,
        childName: children.name,
      })
      .from(externalChoreRequests)
      .leftJoin(children, eq(externalChoreRequests.childId, children.id))
      .where(and(
        eq(externalChoreRequests.id, requestId),
        eq(externalChoreRequests.familyId, session.familyId)
      ))
      .limit(1);

    if (!choreRequest) {
      return NextResponse.json({ error: 'Verzoek niet gevonden.' }, { status: 404 });
    }

    if (choreRequest.status !== 'approved') {
      return NextResponse.json({
        error: 'Dit verzoek moet eerst worden goedgekeurd door ouders.'
      }, { status: 400 });
    }

    // Update request as completed
    await db
      .update(externalChoreRequests)
      .set({
        status: 'completed',
        evidenceUrl: data.evidenceUrl,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalChoreRequests.id, requestId));

    // For manual payments, just mark as completed
    // For in-app payments, the funds are already held and will be released when parent confirms payment

    // TODO: Send notification to parent about completion
    // TODO: Send notification to contact about completion

    return NextResponse.json({
      success: true,
      message: choreRequest.paymentMode === 'manual'
        ? 'Klus voltooid! Wacht op bevestiging van betaling door de contactpersoon.'
        : 'Klus voltooid! De ouders kunnen nu de betaling bevestigen.',
    });

  } catch (error) {
    console.error('[external-chore-requests] complete error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}