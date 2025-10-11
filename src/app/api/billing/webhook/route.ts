import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('MultiSafepay webhook ontvangen', payload);
  } catch (error) {
    console.error('Webhook parsing fout', error);
    return NextResponse.json({ received: false }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
