import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { PLAN_DEFINITIONS } from '@/lib/plans';
import type { BillingInterval, PlanTier } from '@/lib/types';
import { validateCoupon, applyCouponToOrder } from '@/server/services/family-service';

const MULTISAFEPAY_API_KEY = process.env.MULTISAFEPAY_API_KEY;
const MULTISAFEPAY_API_BASE = process.env.MULTISAFEPAY_API_BASE ?? 'https://testapi.multisafepay.com/v1/json';

type CreateOrderRequest = {
  familyId: string;
  familyName: string;
  email: string;
  interval: BillingInterval;
  plan: PlanTier;
  couponCode?: string;
};

type MultiSafepayCreateResponse = {
  data?: {
    payment_url?: string;
    payment_url_qr?: string;
  };
  payment_url?: string;
  success?: boolean;
  error_code?: string;
  error_info?: string;
};

export async function POST(request: NextRequest) {
  if (!MULTISAFEPAY_API_KEY) {
    return NextResponse.json({ error: 'MultiSafepay API-sleutel ontbreekt. Voeg MULTISAFEPAY_API_KEY toe aan je omgeving.' }, { status: 500 });
  }

  let payload: CreateOrderRequest;
  try {
    const rawBody = await request.text();
    payload = JSON.parse(rawBody) as CreateOrderRequest;
  } catch (error) {
    return NextResponse.json({ error: 'Ongeldige JSON payload.' }, { status: 400 });
  }

  const { familyId, familyName, email, interval, plan, couponCode } = payload;

  if (!familyId || !email || !familyName) {
    return NextResponse.json({ error: 'familyId, familyName en email zijn verplicht.' }, { status: 400 });
  }

  if (!['monthly', 'yearly'].includes(interval)) {
    return NextResponse.json({ error: 'Interval moet "monthly" of "yearly" zijn.' }, { status: 400 });
  }

  if (!(plan in PLAN_DEFINITIONS)) {
    return NextResponse.json({ error: 'Onbekend plan.' }, { status: 400 });
  }

  const planDefinition = PLAN_DEFINITIONS[plan];
  let amount = interval === 'yearly' ? planDefinition.priceYearlyCents : planDefinition.priceMonthlyCents;
  let discountAmount = 0;
  let appliedCoupon = null;

  // Validate and apply coupon if provided
  if (couponCode) {
    try {
      const coupon = await validateCoupon(couponCode, familyId);

      // Calculate discount
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((amount * coupon.discountValue) / 100);
      } else {
        discountAmount = Math.min(coupon.discountValue, amount);
      }

      // Apply discount
      amount = Math.max(0, amount - discountAmount);
      appliedCoupon = coupon;
    } catch (error) {
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Coupon code ongeldig.'
      }, { status: 400 });
    }
  }

  const origin = request.nextUrl.origin;
  // SECURITY: Use cryptographically secure random for order IDs
  const orderId = `sub-${Date.now()}-${randomBytes(4).toString('hex')}`;

  // Handle free orders (100% discount) after coupon processing
  if (amount <= 0) {
    // For free orders, create a mock successful response
    const freeOrderId = `free-${Date.now()}-${randomBytes(4).toString('hex')}`;
    return NextResponse.json({
      orderId: freeOrderId,
      paymentUrl: `${origin}/app/success?order_id=${freeOrderId}&interval=${interval}&free=true`,
      free: true
    }, { status: 200 });
  }

  const paymentOptions = {
    notification_url: `${origin}/api/billing/webhook`,
    redirect_url: `${origin}/app/success?order_id=${orderId}&interval=${interval}`,
    cancel_url: `${origin}/app?checkout=cancel`,
  };

  const body = {
    type: 'redirect',
    order_id: orderId,
    currency: 'EUR',
    amount,
    description: `${planDefinition.label} (${interval})${appliedCoupon ? ` - ${appliedCoupon.discountValue}${appliedCoupon.discountType === 'percentage' ? '%' : '€'} korting` : ''}`,
    payment_options: paymentOptions,
    custom_info: {
      subscription_interval: interval,
      plan,
      family_id: familyId,
      family_name: familyName,
      email,
      coupon_id: appliedCoupon?.id,
      original_amount: interval === 'yearly' ? planDefinition.priceYearlyCents : planDefinition.priceMonthlyCents,
      discount_amount: discountAmount,
    },
  };

  try {
    const response = await fetch(`${MULTISAFEPAY_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_key: MULTISAFEPAY_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as MultiSafepayCreateResponse;

    if (!response.ok || data.error_code) {
      const message = data.error_info || 'MultiSafepay gaf een foutmelding.';
      return NextResponse.json({ error: message, orderId }, { status: response.status || 502 });
    }

    const paymentUrl = data.data?.payment_url ?? data.payment_url;

    if (!paymentUrl) {
      return NextResponse.json({ error: 'Ontving geen betaal-URL van MultiSafepay.' }, { status: 502 });
    }

    return NextResponse.json({ orderId, paymentUrl }, { status: 200 });
  } catch (error) {
    console.error('create-order error', error);
    return NextResponse.json({ error: 'Kon geen verbinding maken met MultiSafepay.' }, { status: 502 });
  }
}
