import { NextResponse } from 'next/server';
import { ERR, apiError, readJson } from '@/server/api';
import { callerFromSession, handle } from '@/server/route-helpers';
import { rescheduleSession } from '@/server/sessions';

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const body = await readJson<{ start?: string }>(req);
  if (!body?.start) return apiError(422, 'validation_failed', 'Please pick a new time.');
  return NextResponse.json(await rescheduleSession((await ctx.params).id, userId, body.start));
});
