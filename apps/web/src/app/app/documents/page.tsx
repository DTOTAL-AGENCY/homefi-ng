import Link from 'next/link';
export const metadata = { title: 'Application', robots: { index: false } };
export default function Page() {
  return (
    <div className="card">
      <h1 className="h-display text-3xl text-navy">Documents</h1>
      <p className="mt-2 text-muted">Coming soon. After your advisory session, you&apos;ll upload your documents here, with a checklist for your income type.</p>
      <Link href="/app" className="btn-secondary mt-4">Back to dashboard</Link>
    </div>
  );
}
