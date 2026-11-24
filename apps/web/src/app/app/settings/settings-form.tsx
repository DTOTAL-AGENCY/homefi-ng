'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface Initial { firstName: string; lastName: string; phone: string; marketingOptIn: boolean; email: string }

export function SettingsForm({ initial, verified }: { initial: Initial; verified: boolean }) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pw, setPw] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/me/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstName: f.firstName, lastName: f.lastName, phone: f.phone, marketingOptIn: f.marketingOptIn }),
    });
    setMsg(res.ok ? 'Saved.' : 'Please check your details and try again.');
  }
  async function changeEmail() {
    const { error } = await supabaseBrowser().auth.updateUser({ email: f.email });
    setMsg(error ? error.message : 'Check both inboxes to confirm the change.');
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8 || !/\d/.test(pw)) return setMsg('Password: at least 8 characters, with a number.');
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setPw('');
    setMsg(error ? error.message : 'Password updated.');
  }
  async function dataRequest(kind: 'export' | 'delete') {
    await fetch(`/api/v1/me/delete-request?kind=${kind}`, { method: 'POST' });
    setMsg(kind === 'export' ? "We'll email you a copy of your data." : "We've received your request and will confirm by email.");
  }

  return (
    <div className="mt-6 space-y-6">
      {msg && <p className="rounded-xl bg-white p-4 text-navy" role="status">{msg}</p>}
      <form onSubmit={save} className="card space-y-4">
        <h2 className="text-xl font-bold text-navy">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="field-label">First name</span><input className="input" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
          <label className="block"><span className="field-label">Surname</span><input className="input" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></label>
        </div>
        <label className="block"><span className="field-label">Phone</span><input className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <h2 className="pt-2 text-xl font-bold text-navy">Notifications</h2>
        <label className="flex items-center gap-3 text-navy">
          <input type="checkbox" className="h-5 w-5 accent-[#0D2240]" checked={f.marketingOptIn} onChange={(e) => setF({ ...f, marketingOptIn: e.target.checked })} />
          Send me mortgage tips and updates.
        </label>
        <button className="btn-primary">Save changes</button>
      </form>
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-navy">Email</h2>
        <p className="text-sm text-muted">{verified ? 'Confirmed.' : 'Not confirmed yet.'}</p>
        <div className="flex flex-wrap gap-3">
          <input className="input flex-1" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <button type="button" className="btn-secondary" onClick={changeEmail}>Change email</button>
        </div>
      </div>
      <form onSubmit={changePassword} className="card space-y-4">
        <h2 className="text-xl font-bold text-navy">Password</h2>
        <input className="input" type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn-secondary">Update password</button>
      </form>
      <div className="card space-y-3">
        <h2 className="text-xl font-bold text-navy">Data and privacy</h2>
        <p className="text-sm text-muted">You can ask for a copy of your data or for your account and data to be deleted.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={() => dataRequest('export')}>Request my data</button>
          <button type="button" className="btn-secondary !border-danger !text-danger" onClick={() => dataRequest('delete')}>Delete my account</button>
        </div>
      </div>
    </div>
  );
}
