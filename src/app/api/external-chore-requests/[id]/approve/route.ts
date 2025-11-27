import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { externalChoreRequests, parentApprovals, wallets, walletTransactions, children, trustedContacts } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';
import { sendEmail } from '@/lib/email/sendgrid';

const approveSchema = z.object({
  approvedAmountCents: z.number().int().min(0).max(50000).optional(), // Optional adjustment
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
    const data = approveSchema.parse(body);

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

    const approvedAmount = data.approvedAmountCents ?? choreRequest.offeredAmountCents;

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

    // Start transaction for approval
    await db.transaction(async (tx) => {
      // Update request status
      await tx
        .update(externalChoreRequests)
        .set({
          status: 'approved',
          offeredAmountCents: approvedAmount, // Update with approved amount
          updatedAt: new Date(),
        })
        .where(eq(externalChoreRequests.id, requestId));

      // Record parent approval
      await tx
        .insert(parentApprovals)
        .values({
          externalChoreId: requestId,
          parentFamilyId: session.familyId,
          decision: data.approvedAmountCents && data.approvedAmountCents !== choreRequest.offeredAmountCents ? 'modified' : 'approved',
          originalAmountCents: choreRequest.offeredAmountCents,
          approvedAmountCents: approvedAmount,
          notes: data.notes,
        });

      // If in-app payment, create wallet hold
      if (choreRequest.paymentMode === 'in_app') {
        // Get or create wallet for family
        let [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.familyId, session.familyId))
          .limit(1);

        if (!wallet) {
          const [newWallet] = await tx
            .insert(wallets)
            .values({
              familyId: session.familyId,
              balanceCents: 0,
              currency: 'EUR',
              isActive: 1,
            })
            .returning();
          wallet = newWallet;
        }

        // Check if wallet has sufficient balance
        if (wallet.balanceCents < approvedAmount) {
          throw new Error('Onvoldoende saldo in portemonnee voor deze betaling.');
        }

        // Create hold transaction
        await tx
          .insert(walletTransactions)
          .values({
            walletId: wallet.id,
            externalChoreId: requestId,
            amountCents: -approvedAmount, // Negative for hold
            type: 'hold',
            status: 'pending',
            description: `Reservering voor "${choreRequest.title}"`,
          });

        // Update wallet balance (hold the funds)
        await tx
          .update(wallets)
          .set({
            balanceCents: wallet.balanceCents - approvedAmount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id));
      }
    });

    // Send notification to contact about approval
    if (contact?.email) {
      try {
        await sendEmail({
          to: contact.email,
          type: 'superklusje_approved',
          data: {
            childName: child?.name || 'Het kind',
            title: choreRequest.title,
            amountEuros: approvedAmount / 100,
            contactName: contact.name,
          },
        });
        console.log('[external-chore-requests] Approval email sent to contact:', contact.email);
      } catch (emailError) {
        console.error('[external-chore-requests] Failed to send approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verzoek goedgekeurd! Het contact krijgt een e-mail.',
      approvedAmountCents: approvedAmount,
    });

  } catch (error) {
    console.error('[external-chore-requests] approve error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}