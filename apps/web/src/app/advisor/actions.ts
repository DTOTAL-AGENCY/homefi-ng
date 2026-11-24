'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/server';
import { audit, requireStaff } from '@/server/staff';

async function myAdvisor() {
  const me = await requireStaff(['advisor', 'admin'], '/advisor');
  const { data } = await supabaseAdmin().from('advisors').select('id').eq('user_id', me.id).maybeSingle();
  return { me, advisorId: data?.id ?? null };
}

export async function saveNotes(form: FormData) {
  const { me, advisorId } = await myAdvisor();
  const id = String(form.get('id'));
  await supabaseAdmin().from('advisory_sessions').update({ advisor_notes: String(form.get('notes') ?? '').slice(0, 5000) }).eq('id', id).eq('advisor_id', advisorId ?? '');
  await audit(me.id, 'session_notes_saved', 'advisory_sessions', id);
  revalidatePath('/advisor');
}

export async function markNoShow(form: FormData) {
  const { me, advisorId } = await myAdvisor();
  const id = String(form.get('id'));
  await supabaseAdmin().from('advisory_sessions').update({ status: 'no_show' }).eq('id', id).eq('advisor_id', advisorId ?? '').in('status', ['confirmed', 'rescheduled']);
  await audit(me.id, 'session_no_show', 'advisory_sessions', id);
  revalidatePath('/advisor');
}

/** Advisors write their own bio; HomeFi edits it and verifies track record and credentials. */
export async function saveOwnProfile(form: FormData) {
  const { me, advisorId } = await myAdvisor();
  if (!advisorId) return;
  const update = {
    headline: String(form.get('headline')).slice(0, 90),
    bio_short: String(form.get('bio_short')).slice(0, 280),
    bio_long: String(form.get('bio_long') ?? '') || null,
  };
  await supabaseAdmin().from('advisors').update(update).eq('id', advisorId);
  await audit(me.id, 'advisor_profile_self_edit', 'advisors', advisorId, update);
  revalidatePath('/advisor/profile');
}
