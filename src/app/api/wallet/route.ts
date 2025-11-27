import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { wallets, walletTransactions } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware } from '@/lib/security-middleware';

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

    // Get or create wallet for family
    let [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.familyId, session.familyId))
      .limit(1);

    if (!wallet) {
      // Create wallet if it doesn't exist
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

    // Get recent transactions (last 20)
    const recentTransactions = await db
      .select({
        id: walletTransactions.id,
        amountCents: walletTransactions.amountCents,
        type: walletTransactions.type,
        status: walletTransactions.status,
        description: walletTransactions.description,
        createdAt: walletTransactions.createdAt,
        processedAt: walletTransactions.processedAt,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(20);

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        balanceCents: wallet.balanceCents,
        currency: wallet.currency,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
      recentTransactions,
    });
  } catch (error) {
    console.error('[wallet] GET error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}