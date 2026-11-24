import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { currentUser } from '@/lib/supabase/server';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser().catch(() => null);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gold focus:p-3 focus:text-navy">
        Skip to content
      </a>
      <SiteHeader signedIn={!!user} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
