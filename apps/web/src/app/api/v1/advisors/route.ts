import { NextResponse } from 'next/server';
import { listAdvisors, type AdvisorFilters } from '@/server/advisors';
import { callerFromSession, handle } from '@/server/route-helpers';

/** Filters: specialism, state, language, availableWithinDays; sort; pagination. */
export const GET = handle(async (req: Request) => {
  const q = new URL(req.url).searchParams;
  const { userId } = await callerFromSession();
  const filters: AdvisorFilters = {
    specialism: q.get('specialism') ?? undefined,
    state: q.get('state') ?? undefined,
    language: q.get('language') ?? undefined,
    availableWithinDays: q.get('availableWithinDays') ? Number(q.get('availableWithinDays')) : undefined,
    sort: (q.get('sort') as AdvisorFilters['sort']) ?? undefined,
  };
  const all = await listAdvisors(filters, userId);
  const page = Math.max(1, Number(q.get('page') ?? 1));
  const size = Math.min(50, Math.max(1, Number(q.get('pageSize') ?? 20)));
  return NextResponse.json({
    total: all.length,
    page,
    pageSize: size,
    advisors: all.slice((page - 1) * size, page * size).map(({ calEventTypeId: _c, calUsername: _u, ...a }) => a),
  });
});
