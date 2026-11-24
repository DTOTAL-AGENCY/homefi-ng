import { NextResponse } from 'next/server';
import { loadApplication } from '@/server/applications';
import { callerFromSession, handle } from '@/server/route-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

/** Application (draft answers) and latest results, for the anon token owner or the user owner. */
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const app = await loadApplication(supabaseAdmin(), id, await callerFromSession());
  return NextResponse.json({
    applicationId: app.id,
    status: app.status,
    step: app.last_step,
    draft: app.draft,
    referenceCode: app.reference_code,
    estimate: app.estimate,
  });
});
