import type { Metadata } from 'next';
import { PageHero } from '@/components/page-hero';

export const metadata: Metadata = { title: 'About', description: 'Why we started HomeFi, and the team helping Nigerians access the right mortgage.' };

export default function AboutPage() {
  return (
    <>
      <PageHero title="Why we started HomeFi" />
      <section className="container-page prose-hf max-w-3xl py-14">
        {/* [DT to refine the founding story in his own words] */}
        <p>
          Fewer than 1 in 10 Nigerian home buyers use a mortgage. Most pay from savings or gratuity, or stay renting, often
          because nobody showed them the options. HomeFi started with a family story about mortgage terms that could have
          been better with a simple comparison. We built the comparison, and then the team to carry people through the whole
          process.
        </p>
        <h2>Our mission</h2>
        <p>Help 1 million Nigerians, at home and abroad, access the right mortgage.</p>
        <h2>Team and advisory board</h2>
        <ul>
          <li>DT, Co-Founder and Product Lead</li>
          <li>Semiloore Akilo, Head of Engineering</li>
          <li>Advisory: Dr. Ayobami Oladejo, Mr. Korede Asunni</li>
        </ul>
      </section>
    </>
  );
}
