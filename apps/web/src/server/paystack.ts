import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Paystack: card details never touch HomeFi servers (hosted checkout). Confirm only on
 * a verified charge. Without PAYSTACK_SECRET_KEY (local dev) a mock checkout is used.
 */
const BASE = 'https://api.paystack.co';
export const paystackLive = () => !!process.env.PAYSTACK_SECRET_KEY;
const auth = () => ({ authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'content-type': 'application/json' });

export async function initialise(opts: {
  email: string;
  amountMinor: number;
  currency: 'NGN' | 'USD';
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<{ authorizationUrl: string }> {
  if (!paystackLive()) {
    return { authorizationUrl: `/app/book/mock-checkout?reference=${encodeURIComponent(opts.reference)}` };
  }
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountMinor,
      currency: opts.currency,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    }),
  });
  const body = (await res.json()) as { status: boolean; data?: { authorization_url: string }; message?: string };
  if (!body.status || !body.data) throw new Error(`paystack init: ${body.message}`);
  return { authorizationUrl: body.data.authorization_url };
}

export interface Verified {
  status: 'success' | 'failed' | 'abandoned' | 'pending' | string;
  amount: number;
  currency: string;
  raw: unknown;
}

export async function verify(reference: string, expected: { amount: number; currency: string }): Promise<Verified> {
  if (!paystackLive()) {
    return { status: 'success', amount: expected.amount, currency: expected.currency, raw: { mock: true } };
  }
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, { headers: auth() });
  const body = (await res.json()) as { status: boolean; data?: { status: string; amount: number; currency: string } };
  if (!body.status || !body.data) throw new Error('paystack verify failed');
  return { status: body.data.status, amount: body.data.amount, currency: body.data.currency, raw: body.data };
}

export async function refund(reference: string): Promise<void> {
  if (!paystackLive()) return;
  const res = await fetch(`${BASE}/refund`, { method: 'POST', headers: auth(), body: JSON.stringify({ transaction: reference }) });
  if (!res.ok) throw new Error(`paystack refund ${res.status}`);
}

/** x-paystack-signature is HMAC SHA512 of the raw body with the secret key. */
export function validSignature(raw: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expect = createHmac('sha512', secret).update(raw).digest('hex');
  const a = Buffer.from(expect);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
