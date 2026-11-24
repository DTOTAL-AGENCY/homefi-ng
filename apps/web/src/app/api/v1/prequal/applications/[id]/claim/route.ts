import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { claimApplication } from '@/server/applications';
import { callerFromSession, handle, requestMeta } from '@/server/route-helpers';

/** Links the anonymous application to the signed-in user, records consent, queues Report 1. Idempotent. */
export const POST = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const out = await claimApplication({ applicationId: id, userId, ...(await requestMeta()) });
  return NextResponse.json(out);
});
