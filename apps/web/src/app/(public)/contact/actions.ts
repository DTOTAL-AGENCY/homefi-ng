'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { flatten } from '@homefi/db';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientIp } from '@/server/request';
import { enqueueEmail } from '@/server/jobs';
import { SITE } from '@/lib/config';

export type ContactState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'error'; message?: string; fields?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().max(30).optional(),
  topic: z.enum(['estimate', 'report', 'session', 'fees', 'partnerships', 'other']),
  message: z.string().trim().min(5, 'Please write a short message.').max(2000),
});

export async function sendContact(_: ContactState, form: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: 'error', fields: flatten(parsed.error) };
  const sb = supabaseAdmin();
  const ip = clientIp(await headers());
  const { data: allowed } = await sb.rpc('hit_rate_limit', { p_key: `contact:${ip}`, p_limit: 5, p_window_seconds: 3600 });
  if (!allowed) return { status: 'error', message: "You've tried a few times in a row. Please wait a minute and try again." };
  const { error } = await sb.from('contact_messages').insert({ ...parsed.data, phone: parsed.data.phone || null });
  if (error) return { status: 'error', message: 'Something went wrong on our side. Please try again.' };
  await enqueueEmail({
    template: 'contact_notification',
    to: process.env.OPS_ALERT_EMAIL ?? SITE.supportEmail,
    data: { ...parsed.data },
  });
  return { status: 'sent' };
}
