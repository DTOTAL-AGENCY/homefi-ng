import type { Metadata } from 'next';
import { currentProfile } from '@/lib/supabase/server';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const p = (await currentProfile())!;
  return (
    <div className="max-w-2xl">
      <h1 className="h-display text-4xl text-navy">Settings</h1>
      <SettingsForm
        initial={{ firstName: p.first_name, lastName: p.last_name, phone: p.phone_e164 ?? '', marketingOptIn: p.marketing_opt_in, email: p.email ?? '' }}
        verified={!!p.email_verified_at}
      />
    </div>
  );
}
