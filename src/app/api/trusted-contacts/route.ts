import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/server/db/client';
import { trustedContacts } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

const createContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['pending', 'verified', 'blocked']).optional(),
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

    // Get all trusted contacts for this family
    const contacts = await db
      .select()
      .from(trustedContacts)
      .where(eq(trustedContacts.parentFamilyId, session.familyId))
      .orderBy(trustedContacts.createdAt);

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('[trusted-contacts] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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
    const data = createContactSchema.parse(body);

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Check if contact with same email/phone already exists for this family
    if (data.email) {
      const existingEmail = await db
        .select()
        .from(trustedContacts)
        .where(eq(trustedContacts.email, data.email))
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json({
          error: 'Een contact met dit e-mailadres bestaat al.'
        }, { status: 400 });
      }
    }

    if (data.phone) {
      const existingPhone = await db
        .select()
        .from(trustedContacts)
        .where(eq(trustedContacts.phone, data.phone))
        .limit(1);

      if (existingPhone.length > 0) {
        return NextResponse.json({
          error: 'Een contact met dit telefoonnummer bestaat al.'
        }, { status: 400 });
      }
    }

    // Create new trusted contact
    const [contact] = await db
      .insert(trustedContacts)
      .values({
        parentFamilyId: session.familyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        status: 'pending', // Always start as pending, parent must verify
      })
      .returning();

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('[trusted-contacts] POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}