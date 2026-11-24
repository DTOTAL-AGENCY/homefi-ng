import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';
import { OPTIONS } from '@/content/site';
import { ARTICLES } from './(public)/learn/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '', '/prequalify', '/how-it-works', '/mortgage-options', '/advisors', '/diaspora', '/pricing', '/learn', '/faq',
    '/about', '/contact', '/legal/privacy', '/legal/terms', '/legal/disclaimer',
    ...OPTIONS.map((o) => `/mortgage-options/${o.slug}`),
    ...ARTICLES.map((a) => `/learn/${a.slug}`),
  ];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: 'weekly' }));
}
