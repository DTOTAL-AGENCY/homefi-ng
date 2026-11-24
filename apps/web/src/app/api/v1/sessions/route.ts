import { NextResponse } from 'next/server';
import { z } from 'zod';
import { flatten } from '@homefi/db';
import { ERR, apiError, readJson } from '@/server/api';
import { callerFromSession, handle } from '@/server/route-helpers';
import { startBooking } from '@/server/sessions';

const schema = z.object({
  advisorId: z.string().uuid(),
  start: z.string().datetime(),
  applicationId: z.string().uuid().nullable().optional(),
  topic: z.string().max(300).optional(),
  meetingType: z.enum(['video', 'phone']),
  currency: z.enum(['USD', 'NGN']),
  timezone: z.string().max(64),
});

/** Creates a pending session, holds the slot, initialises Paystack. Returns { sessionId, authorizationUrl }. */
export const POST = handle(async (req: Request) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return apiError(422, 'validation_failed', 'Please check your booking details.', flatten(parsed.error));
  const out = await startBooking({ userId, ...parsed.data, applicationId: parsed.data.applicationId ?? null, topic: parsed.data.topic ?? null });
  return NextResponse.json({ sessionId: out.sessionId, authorizationUrl: out.authorizationUrl });
});
