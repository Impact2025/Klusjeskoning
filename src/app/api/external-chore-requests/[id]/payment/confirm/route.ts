import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { externalChoreRequests, wallets, walletTransactions, children } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

const confirmPaymentSchema = z.object({
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    const requestId = params.id;
    const body = await request.json();
    const data = confirmPaymentSchema.parse(body);

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

    if (choreRequest.status !== 'completed') {
      return NextResponse.json({
        error: 'Deze klus moet eerst worden voltooid voordat betaling kan worden bevestigd.'
      }, { status: 400 });
    }

    // Handle payment confirmation based on mode
    if (choreRequest.paymentMode === 'manual') {
      // For manual payments, just mark as paid (no wallet transactions needed)
      await db
        .update(externalChoreRequests)
        .set({
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(externalChoreRequests.id, requestId));

    } else if (choreRequest.paymentMode === 'in_app') {
      // For in-app payments, release held funds to child's points
      await db.transaction(async (tx) => {
        // Find the hold transaction
        const [holdTx] = await tx
          .select()
          .from(walletTransactions)
          .where(and(
            eq(walletTransactions.externalChoreId, requestId),
            eq(walletTransactions.type, 'hold'),
            eq(walletTransactions.status, 'pending')
          ))
          .limit(1);

        if (!holdTx) {
          throw new Error('Geen reservering gevonden voor deze betaling.');
        }

        // Get wallet
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.id, holdTx.walletId))
          .limit(1);

        if (!wallet) {
          throw new Error('Portemonnee niet gevonden.');
        }

        // Convert wallet funds to child points (1 cent = 1 point)
        const pointsToAward = choreRequest.offeredAmountCents;

        // Update child points using raw SQL
        await tx.execute(sql`
          UPDATE children
          SET points = points + ${pointsToAward},
              total_points_ever = total_points_ever + ${pointsToAward}
          WHERE id = ${choreRequest.childId}
        `);

        // Mark hold transaction as completed and create credit transaction
        await tx
          .update(walletTransactions)
          .set({
            status: 'completed',
            processedAt: new Date(),
          })
          .where(eq(walletTransactions.id, holdTx.id));

        // Create credit transaction record
        await tx
          .insert(walletTransactions)
          .values({
            walletId: wallet.id,
            externalChoreId: requestId,
            amountCents: -choreRequest.offeredAmountCents, // Negative for debit (funds leaving wallet)
            type: 'debit',
            status: 'completed',
            description: `Betaling voor "${choreRequest.title}" - omgezet naar ${pointsToAward} punten`,
            processedAt: new Date(),
          });

        // Update request status
        await tx
          .update(externalChoreRequests)
          .set({
            status: 'paid',
            updatedAt: new Date(),
          })
          .where(eq(externalChoreRequests.id, requestId));
      });
    }

    // TODO: Send notification to child about payment confirmation
    // TODO: Send notification to contact about payment confirmation

    return NextResponse.json({
      success: true,
      message: choreRequest.paymentMode === 'manual'
        ? 'Betaling handmatig bevestigd!'
        : `Betaling bevestigd! ${choreRequest.childName} heeft ${choreRequest.offeredAmountCents} punten ontvangen.`,
      pointsAwarded: choreRequest.paymentMode === 'in_app' ? choreRequest.offeredAmountCents : 0,
    });

  } catch (error) {
    console.error('[external-chore-requests] payment confirm error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}