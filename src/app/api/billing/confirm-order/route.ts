import { NextRequest, NextResponse } from 'next/server';
import type { BillingInterval } from '@/lib/types';

const MULTISAFEPAY_API_KEY = process.env.MULTISAFEPAY_API_KEY;
const MULTISAFEPAY_API_BASE = process.env.MULTISAFEPAY_API_BASE ?? 'https://testapi.multisafepay.com/v1/json';

type MultiSafepayOrderResponse = {
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    order_id?: string;
    custom_info?: Record<string, unknown>;
  };
  error_code?: string;
  error_info?: string;
};

export async function POST(request: NextRequest) {
  if (!MULTISAFEPAY_API_KEY) {
    return NextResponse.json({ error: 'MultiSafepay API-sleutel ontbreekt. Voeg MULTISAFEPAY_API_KEY toe aan je omgeving.' }, { status: 500 });
  }

  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch (error) {
    return NextResponse.json({ error: 'Ongeldige JSON payload.' }, { status: 400 });
  }

  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is verplicht.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${MULTISAFEPAY_API_BASE}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        api_key: MULTISAFEPAY_API_KEY,
      },
    });

    const data = (await response.json()) as MultiSafepayOrderResponse;

    if (!response.ok || data.error_code) {
      const message = data.error_info || 'MultiSafepay gaf een foutmelding.';
      return NextResponse.json({ error: message }, { status: response.status || 502 });
    }

    const order = data.data ?? {};
    const status = order.status ?? 'unknown';
    const customInterval = (order.custom_info?.subscription_interval ?? order.custom_info?.interval) as BillingInterval | undefined;

    return NextResponse.json({
      status,
      interval: customInterval ?? null,
      amount: order.amount ?? null,
      currency: order.currency ?? 'EUR',
    });
  } catch (error) {
    console.error('confirm-order error', error);
    return NextResponse.json({ error: 'Kon bestelling niet ophalen bij MultiSafepay.' }, { status: 502 });
  }
}
