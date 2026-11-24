'use client';

import { useEffect, useState } from 'react';

/** "Tue 25 Nov, 10:00 (Europe/London) · 10:00 WAT": viewer's time zone with WAT alongside. */
export function SessionTime({ iso, showWat = true }: { iso: string; showWat?: boolean }) {
  const [tz, setTz] = useState<string | null>(null);
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  const d = new Date(iso);
  const fmt = (timeZone: string) =>
    d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone });
  const local = tz ?? 'Africa/Lagos';
  const wat = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {fmt(local)} ({local}){showWat && local !== 'Africa/Lagos' ? ` · ${wat} WAT` : ''}
    </time>
  );
}
