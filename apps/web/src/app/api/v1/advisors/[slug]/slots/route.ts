import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { advisorBySlug } from '@/server/data';
import { handle } from '@/server/route-helpers';
import { advisorSlots } from '@/server/sessions';

/** Open slots for the next 14 days (Cal.com, cached 60 seconds), in UTC; the browser shows them in its time zone. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const a = await advisorBySlug((await ctx.params).slug);
  if (!a) return ERR.notFound();
  const slots = await advisorSlots({ id: a.id, calEventTypeId: a.calEventTypeId });
  return NextResponse.json({ slots }, { headers: { 'cache-control': 'private, max-age=30' } });
});
