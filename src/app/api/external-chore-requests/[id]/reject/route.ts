import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { externalChoreRequests, parentApprovals, wallets, walletTransactions, children, trustedContacts } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';
import { sendEmail } from '@/lib/email/sendgrid';

const rejectSchema = z.object({
  notes: z.string().max(500).optional(),
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
    const data = rejectSchema.parse(body);

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get the external chore request
    const [choreRequest] = await db
      .select()
      .from(externalChoreRequests)
      .where(and(
        eq(externalChoreRequests.id, requestId),
        eq(externalChoreRequests.familyId, session.familyId)
      ))
      .limit(1);

    if (!choreRequest) {
      return NextResponse.json({ error: 'Verzoek niet gevonden.' }, { status: 404 });
    }

    if (choreRequest.status !== 'awaiting_parent') {
      return NextResponse.json({
        error: 'Dit verzoek is al behandeld.'
      }, { status: 400 });
    }

    // Get child and contact info for emails
    const [child] = await db
      .select({ name: children.name })
      .from(children)
      .where(eq(children.id, choreRequest.childId))
      .limit(1);

    let contact = null;
    if (choreRequest.contactId) {
      const [contactData] = await db
        .select({
          name: trustedContacts.name,
          email: trustedContacts.email,
        })
        .from(trustedContacts)
        .where(eq(trustedContacts.id, choreRequest.contactId))
        .limit(1);
      contact = contactData;
    }

    // Start transaction for rejection
    await db.transaction(async (tx) => {
      // Update request status
      await tx
        .update(externalChoreRequests)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(externalChoreRequests.id, requestId));

      // Record parent rejection
      await tx
        .insert(parentApprovals)
        .values({
          externalChoreId: requestId,
          parentFamilyId: session.familyId,
          decision: 'rejected',
          originalAmountCents: choreRequest.offeredAmountCents,
          approvedAmountCents: 0,
          notes: data.notes,
        });

      // If in-app payment was approved, release any held funds
      if (choreRequest.paymentMode === 'in_app') {
        // Find any hold transactions for this request
        const holdTransactions = await tx
          .select()
          .from(walletTransactions)
          .where(and(
            eq(walletTransactions.externalChoreId, requestId),
            eq(walletTransactions.type, 'hold'),
            eq(walletTransactions.status, 'pending')
          ));

        for (const holdTx of holdTransactions) {
          // Get wallet
          const [wallet] = await tx
            .select()
            .from(wallets)
            .where(eq(wallets.id, holdTx.walletId))
            .limit(1);

          if (wallet) {
            // Release the hold by adding funds back
            await tx
              .update(wallets)
              .set({
                balanceCents: wallet.balanceCents - holdTx.amountCents, // amountCents is negative, so this adds
                updatedAt: new Date(),
              })
              .where(eq(wallets.id, wallet.id));

            // Mark hold transaction as cancelled
            await tx
              .update(walletTransactions)
              .set({
                status: 'cancelled',
                processedAt: new Date(),
              })
              .where(eq(walletTransactions.id, holdTx.id));
          }
        }
      }
    });

    // Send notification to contact about rejection
    if (contact?.email) {
      try {
        await sendEmail({
          to: contact.email,
          type: 'superklusje_rejected',
          data: {
            childName: child?.name || 'Het kind',
            title: choreRequest.title,
            contactName: contact.name,
            reason: data.notes,
          },
        });
        console.log('[external-chore-requests] Rejection email sent to contact:', contact.email);
      } catch (emailError) {
        console.error('[external-chore-requests] Failed to send rejection email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verzoek afgewezen. Het contact krijgt een e-mail.',
    });

  } catch (error) {
    console.error('[external-chore-requests] reject error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}