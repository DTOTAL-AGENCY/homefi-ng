import { NextResponse } from 'next/server';
import { confirmPayment } from '@/server/sessions';
import { validSignature } from '@/server/paystack';

/** Verifies x-paystack-signature (HMAC SHA512), then verifies the transaction by API before confirming. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-paystack-signature'))) return new NextResponse('invalid signature', { status: 401 });
  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event === 'charge.success' && event.data?.reference?.startsWith('HF-SES-')) {
    try {
      await confirmPayment(event.data.reference);
    } catch (e) {
      console.error('[paystack webhook]', (e as Error).message);
      return new NextResponse('retry', { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
