import { NextRequest, NextResponse } from 'next/server';
import { PLAN_DEFINITIONS } from '@/lib/plans';
import type { BillingInterval, PlanTier } from '@/lib/types';

const MULTISAFEPAY_API_KEY = process.env.MULTISAFEPAY_API_KEY;
const MULTISAFEPAY_API_BASE = process.env.MULTISAFEPAY_API_BASE ?? 'https://testapi.multisafepay.com/v1/json';

type CreateOrderRequest = {
  familyId: string;
  familyName: string;
  email: string;
  interval: BillingInterval;
  plan: PlanTier;
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
    payload = (await request.json()) as CreateOrderRequest;
  } catch (error) {
    return NextResponse.json({ error: 'Ongeldige JSON payload.' }, { status: 400 });
  }

  const { familyId, familyName, email, interval, plan } = payload;

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
  const amount = interval === 'yearly' ? planDefinition.priceYearlyCents : planDefinition.priceMonthlyCents;

  if (amount <= 0) {
    return NextResponse.json({ error: 'Je kunt geen betaalverzoek starten voor een gratis plan.' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const orderId = `sub-${familyId}-${Date.now()}`;

  const paymentOptions = {
    notification_url: `${origin}/api/billing/webhook`,
    redirect_url: `${origin}/app?checkout=success&order_id=${orderId}&interval=${interval}`,
    cancel_url: `${origin}/app?checkout=cancel`,
  };

  const body = {
    type: 'redirect',
    order_id: orderId,
    currency: 'EUR',
    amount,
    description: `${planDefinition.label} (${interval})`,
    customer: {
      first_name: familyName,
      last_name: 'Familie',
      email,
      locale: 'nl_NL',
    },
    payment_options: paymentOptions,
    custom_info: {
      subscription_interval: interval,
      plan,
      family_id: familyId,
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
