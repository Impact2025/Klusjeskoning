import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { externalChoreRequests, trustedContacts, children, families } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';
import { sendEmail } from '@/lib/email/sendgrid';

const createRequestSchema = z.object({
  childId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  offeredAmountCents: z.number().int().min(0).max(50000), // Max €500
  currency: z.string().default('EUR'),
  paymentMode: z.enum(['manual', 'in_app']).default('manual'),
  contact: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(20).optional(),
  }),
});

export async function GET(request: Request) {
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

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get all external chore requests for this family
    const requests = await db
      .select({
        id: externalChoreRequests.id,
        childId: externalChoreRequests.childId,
        familyId: externalChoreRequests.familyId,
        contactId: externalChoreRequests.contactId,
        title: externalChoreRequests.title,
        description: externalChoreRequests.description,
        offeredAmountCents: externalChoreRequests.offeredAmountCents,
        currency: externalChoreRequests.currency,
        paymentMode: externalChoreRequests.paymentMode,
        status: externalChoreRequests.status,
        createdBy: externalChoreRequests.createdBy,
        evidenceUrl: externalChoreRequests.evidenceUrl,
        completedAt: externalChoreRequests.completedAt,
        createdAt: externalChoreRequests.createdAt,
        updatedAt: externalChoreRequests.updatedAt,
        // Include child info
        childName: children.name,
        childAvatar: children.avatar,
        // Include contact info (if exists)
        contactName: trustedContacts.name,
        contactEmail: trustedContacts.email,
        contactPhone: trustedContacts.phone,
        contactAvatar: trustedContacts.avatarUrl,
        contactStatus: trustedContacts.status,
      })
      .from(externalChoreRequests)
      .leftJoin(children, eq(externalChoreRequests.childId, children.id))
      .leftJoin(trustedContacts, eq(externalChoreRequests.contactId, trustedContacts.id))
      .where(eq(externalChoreRequests.familyId, session.familyId))
      .orderBy(externalChoreRequests.createdAt);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[external-chore-requests] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Security middleware check - NOTE: This endpoint is PUBLIC for external contacts
  const securityCheck = await securityMiddleware(request, {
    maxPayloadSize: 1024 * 1024, // 1MB limit
    allowedOrigins: ['klusjeskoning.nl', 'klusjeskoningapp.nl']
  });

  if (!securityCheck.valid) {
    return securityCheck.response!;
  }

  // Rate limiting - more restrictive for public endpoint
  const rateLimitResult = await checkApiRateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json({
      error: 'Te veel verzoeken. Probeer het later opnieuw.',
      retryAfter: rateLimitResult.reset,
    }, {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((rateLimitResult.reset?.getTime() || Date.now() + 3600000) / 1000).toString(),
      }
    });
  }

  try {
    const requestBody = await request.json();
    const data = createRequestSchema.parse(requestBody);

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Verify child exists and get family info
    const [child] = await db
      .select({
        id: children.id,
        familyId: children.familyId,
        name: children.name,
        familyEmail: families.email,
      })
      .from(children)
      .leftJoin(families, eq(children.familyId, families.id))
      .where(eq(children.id, data.childId))
      .limit(1);

    if (!child) {
      return NextResponse.json({
        error: 'Kind niet gevonden.'
      }, { status: 404 });
    }

    // Check if contact already exists for this family
    let contactId: string | null = null;
    if (data.contact.email || data.contact.phone) {
      const existingContact = await db
        .select()
        .from(trustedContacts)
        .where(and(
          eq(trustedContacts.parentFamilyId, child.familyId),
          data.contact.email ? eq(trustedContacts.email, data.contact.email) : undefined,
          data.contact.phone ? eq(trustedContacts.phone, data.contact.phone) : undefined
        ))
        .limit(1);

      if (existingContact.length > 0) {
        contactId = existingContact[0].id;
      }
    }

    // If contact doesn't exist, create it
    if (!contactId) {
      const [newContact] = await db
        .insert(trustedContacts)
        .values({
          parentFamilyId: child.familyId,
          name: data.contact.name,
          email: data.contact.email,
          phone: data.contact.phone,
          status: 'pending', // Always start as pending
        })
        .returning();

      contactId = newContact.id;
    }

    // Create the external chore request
    const [choreRequest] = await db
      .insert(externalChoreRequests)
      .values({
        childId: data.childId,
        familyId: child.familyId,
        contactId: contactId,
        title: data.title,
        description: data.description,
        offeredAmountCents: data.offeredAmountCents,
        currency: data.currency,
        paymentMode: data.paymentMode,
        status: 'awaiting_parent',
        createdBy: 'contact',
      })
      .returning();

    // Send notification email to parent about new request
    if (child.familyEmail) {
      try {
        await sendEmail({
          to: child.familyEmail,
          type: 'superklusje_new_request',
          data: {
            childName: child.name,
            title: data.title,
            description: data.description,
            amountEuros: data.offeredAmountCents / 100,
            contactName: data.contact.name,
          },
        });
        console.log('[external-chore-requests] Email sent to parent:', child.familyEmail);
      } catch (emailError) {
        console.error('[external-chore-requests] Failed to send email to parent:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Also send confirmation email to contact if they provided an email
    if (data.contact.email) {
      try {
        await sendEmail({
          to: data.contact.email,
          type: 'superklusje_new_request',
          data: {
            childName: child.name,
            title: data.title,
            description: data.description,
            amountEuros: data.offeredAmountCents / 100,
            contactName: data.contact.name,
          },
        });
        console.log('[external-chore-requests] Confirmation email sent to contact:', data.contact.email);
      } catch (emailError) {
        console.error('[external-chore-requests] Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      request: {
        id: choreRequest.id,
        status: choreRequest.status,
        message: 'Verzoek verzonden! De ouders krijgen een e-mail en kunnen dit bekijken in de app.'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[external-chore-requests] POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}