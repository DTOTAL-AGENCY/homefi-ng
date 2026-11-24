import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { reportDownloadUrl } from '@/server/reports';
import { callerFromSession, handle } from '@/server/route-helpers';

/** Returns a signed URL valid 15 minutes. ?redirect=1 sends the browser straight to the file. */
export const GET = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { userId } = await callerFromSession();
  if (!userId) return ERR.unauthorised();
  const url = await reportDownloadUrl(id, userId);
  if (new URL(req.url).searchParams.get('redirect')) return NextResponse.redirect(url);
  return NextResponse.json({ url, expiresInSeconds: 900 });
});
