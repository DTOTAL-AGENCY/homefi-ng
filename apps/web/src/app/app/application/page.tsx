import Link from 'next/link';
export const metadata = { title: 'Application', robots: { index: false } };
export default function Page() {
  return (
    <div className="card">
      <h1 className="h-display text-3xl text-navy">Application tracker</h1>
      <p className="mt-2 text-muted">Coming soon. After your advisory session, you&apos;ll follow your application here from documents to keys.</p>
      <Link href="/app" className="btn-secondary mt-4">Back to dashboard</Link>
    </div>
  );
}
