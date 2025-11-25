import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { trustedContacts } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['pending', 'verified', 'blocked']).optional(),
});

export async function GET(
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
    const contactId = params.id;

    // Get specific trusted contact for this family
    const [contact] = await db
      .select()
      .from(trustedContacts)
      .where(and(
        eq(trustedContacts.id, contactId),
        eq(trustedContacts.parentFamilyId, session.familyId)
      ))
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: 'Contact niet gevonden.' }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('[trusted-contacts] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
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
    const contactId = params.id;
    const body = await request.json();
    const data = updateContactSchema.parse(body);

    // Check if contact exists and belongs to this family
    const [existingContact] = await db
      .select()
      .from(trustedContacts)
      .where(and(
        eq(trustedContacts.id, contactId),
        eq(trustedContacts.parentFamilyId, session.familyId)
      ))
      .limit(1);

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact niet gevonden.' }, { status: 404 });
    }

    // Check for duplicate email/phone if updating
    if (data.email && data.email !== existingContact.email) {
      const existingEmail = await db
        .select()
        .from(trustedContacts)
        .where(and(
          eq(trustedContacts.email, data.email),
          eq(trustedContacts.parentFamilyId, session.familyId)
        ))
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json({
          error: 'Een contact met dit e-mailadres bestaat al.'
        }, { status: 400 });
      }
    }

    if (data.phone && data.phone !== existingContact.phone) {
      const existingPhone = await db
        .select()
        .from(trustedContacts)
        .where(and(
          eq(trustedContacts.phone, data.phone),
          eq(trustedContacts.parentFamilyId, session.familyId)
        ))
        .limit(1);

      if (existingPhone.length > 0) {
        return NextResponse.json({
          error: 'Een contact met dit telefoonnummer bestaat al.'
        }, { status: 400 });
      }
    }

    // Update contact
    const updateData: any = { ...data, updatedAt: new Date() };

    const [updatedContact] = await db
      .update(trustedContacts)
      .set(updateData)
      .where(and(
        eq(trustedContacts.id, contactId),
        eq(trustedContacts.parentFamilyId, session.familyId)
      ))
      .returning();

    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('[trusted-contacts] PATCH error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
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
    const contactId = params.id;

    // Check if contact exists and belongs to this family
    const [existingContact] = await db
      .select()
      .from(trustedContacts)
      .where(and(
        eq(trustedContacts.id, contactId),
        eq(trustedContacts.parentFamilyId, session.familyId)
      ))
      .limit(1);

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact niet gevonden.' }, { status: 404 });
    }

    // Delete contact (cascade will handle related records)
    await db
      .delete(trustedContacts)
      .where(and(
        eq(trustedContacts.id, contactId),
        eq(trustedContacts.parentFamilyId, session.familyId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[trusted-contacts] DELETE error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}