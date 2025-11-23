import { NextResponse } from 'next/server';
import { createCoupon } from '@/server/services/family-service';

export async function POST() {
  try {
    const coupon = await createCoupon({
      code: 'TEST20',
      description: 'Test coupon - 20% korting voor testing',
      discountType: 'percentage',
      discountValue: 20,
      maxUses: 10,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Test coupon created successfully',
      coupon
    });
  } catch (error) {
    console.error('Error creating test coupon:', error);
    return NextResponse.json(
      { error: 'Failed to create test coupon', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}