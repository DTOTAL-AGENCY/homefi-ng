import { NextResponse } from 'next/server';
import { ERR } from '@/server/api';
import { advisorBySlug, publishedReviews } from '@/server/data';
import { handle } from '@/server/route-helpers';

export const GET = handle(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const a = await advisorBySlug((await ctx.params).slug);
  if (!a) return ERR.notFound();
  const { calEventTypeId: _c, calUsername: _u, ...pub } = a;
  return NextResponse.json({ advisor: pub, reviews: await publishedReviews(a.id) });
});
