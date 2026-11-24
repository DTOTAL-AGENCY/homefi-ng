'use client';

export function NextSlotLabel({ iso }: { iso: string | null }) {
  if (!iso) return <>Fully booked for the next 14 days</>;
  return (
    <span suppressHydrationWarning>
      {new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}
