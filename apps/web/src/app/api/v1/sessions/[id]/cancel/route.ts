import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { callerFromSession, handle } from '@/server/route-helpers';
import { cancelSession } from '@/server/sessions';

/** Full refund when cancelled at least 24 hours before the start [Confirm refund window]. */
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  return NextResponse.json(await cancelSession((await ctx.params).id, userId));
});
