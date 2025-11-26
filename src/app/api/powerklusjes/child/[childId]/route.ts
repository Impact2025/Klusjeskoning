import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { children, families } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  // Security middleware check - this is a public endpoint
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
    const resolvedParams = await params;
    const childId = resolvedParams.childId;

    // Get child info - only basic public information
    const [child] = await db
      .select({
        id: children.id,
        name: children.name,
        avatar: children.avatar,
        familyId: children.familyId,
        // Include family name for context
        familyName: families.familyName,
        city: families.city,
      })
      .from(children)
      .leftJoin(families, eq(children.familyId, families.id))
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return NextResponse.json({ error: 'Kind niet gevonden.' }, { status: 404 });
    }

    // Return only public information
    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
        avatar: child.avatar,
        familyName: child.familyName,
        city: child.city,
      }
    });
  } catch (error) {
    console.error('[powerklusjes] child info error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}