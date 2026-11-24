import 'server-only';
import { redirect } from 'next/navigation';
import { currentProfile, supabaseAdmin, supabaseServer } from '@/lib/supabase/server';

type Role = 'advisor' | 'ops' | 'admin';

/** Staff pages need the right role and, when enforced, a second factor (aal2). */
export async function requireStaff(roles: Role[], from: string) {
  const p = await currentProfile();
  if (!p) redirect(`/signin?next=${encodeURIComponent(from)}`);
  if (!roles.includes(p.role as Role)) redirect('/app');
  const enforce = process.env.REQUIRE_STAFF_MFA ? process.env.REQUIRE_STAFF_MFA === 'true' : process.env.NODE_ENV === 'production';
  if (enforce) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== 'aal2') redirect(`/mfa?next=${encodeURIComponent(from)}`);
  }
  return p;
}

export async function audit(actorId: string, action: string, entity: string, entityId: string, diff?: unknown) {
  await supabaseAdmin().from('audit_log').insert({ actor_id: actorId, action, entity, entity_id: entityId, diff: (diff ?? null) as never });
}

/** +234 803 *** **67 */
export function maskPhone(p: string | null | undefined) {
  if (!p) return '';
  return p.length > 7 ? `${p.slice(0, 7)}${'*'.repeat(p.length - 9)}${p.slice(-2)}` : '***';
}
