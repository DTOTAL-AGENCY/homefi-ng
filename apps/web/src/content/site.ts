/** Copy from the brief that is reused on more than one page. */

export const HOW_IT_WORKS = [
  {
    title: 'Get prequalified',
    body: 'Answer a few questions about you, your income and the home you want. It takes under 5 minutes.',
    need: 'Nothing but your income figure.',
  },
  {
    title: 'Get your free report',
    body: "We email you a detailed Mortgage Prequalification Report: what you can access, at what rate, and the deposit you'll need.",
    need: 'An email address.',
  },
  {
    title: 'Talk to a Mortgage Advisor',
    body: "Book a 30 minute 1-on-1 session with a vetted advisor who knows your situation, whether you're salaried, self-employed or abroad.",
    need: '30 minutes and your questions.',
  },
  {
    title: 'We process your mortgage',
    body: 'From application to offer letter, property appraisal, underwriting and disbursement, we handle the lender and the paperwork. You step out to collect your keys.',
    need: 'ID, proof of income, bank statements and property documents (your advisor gives you the exact list).',
  },
] as const;

export const FAQ = [
  {
    q: 'Is prequalification the same as approval?',
    a: 'No. Prequalification is an estimate based on what you tell us. Approval comes from the lender after they check your documents and the property.',
  },
  { q: 'Will this affect my credit record?', a: "No. We don't run a credit check to give you your estimate." },
  {
    q: 'How do you calculate my estimate?',
    a: "We assume your mortgage repayment should be no more than a third of your monthly take-home income, then apply each scheme's rate, term and limits. Your advisor refines it with your exact details.",
  },
  {
    q: 'What is equity?',
    a: 'Your deposit: the part of the property price you pay yourself. Most lenders ask for at least 10%.',
  },
  {
    q: 'Can I use my pension (RSA)?',
    a: 'Pension rules allow some contributors to use part of their RSA towards a home deposit. Your advisor will check whether it applies to you.',
  },
  {
    q: 'Can I apply with my spouse?',
    a: 'Yes. Choose "apply jointly" and add their income. A joint application can increase what you can access.',
  },
  {
    q: "I'm self-employed. Can I still get a mortgage?",
    a: 'Yes. Lenders look at your business income and statements instead of payslips. Your advisor will tell you what to prepare.',
  },
  {
    q: 'I live abroad. Can I apply?',
    a: 'Yes. Enter your income in your currency. NHF Diaspora, MREIF and commercial options may be open to you.',
  },
  {
    q: 'Do you have non-interest options?',
    a: "Yes. Choose the non-interest preference and we'll show Ijarah-based options from non-interest banks.",
  },
  { q: 'What does the advisory session cost?', a: 'USD 25 for 30 minutes, including your 2nd, more precise report.' },
  {
    q: 'How do you make money?',
    a: "From the advisory session and a processing fee of 3% or 4% of the Mortgage approved, paid only as described on our Pricing page, with refunds if we can't secure an appropriate mortgage within the agreed period.",
  },
  {
    q: 'Is my data safe?',
    a: 'We use your details only to prepare your estimate and process your mortgage, and we share them with a lender only when you ask us to. See our Privacy Notice.',
  },
] as const;

export interface OptionPage {
  slug: string;
  code: 'NHF' | 'NHF_DIASPORA' | 'MREIF' | 'COMMERCIAL' | 'NON_INTEREST';
  name: string;
  card: string;
  headline: string;
  what: string;
  qualifies: string[];
  pros: string[];
  tradeoffs: string[];
  documents: string[];
  help: string;
}

export const OPTIONS: OptionPage[] = [
  {
    slug: 'nhf',
    code: 'NHF',
    name: 'National Housing Fund (FMBN)',
    card: 'For workers contributing to the NHF. Lowest rate, longer to process.',
    headline: 'The lowest mortgage rate in Nigeria, for NHF contributors.',
    what: 'The National Housing Fund is a federal scheme managed by the Federal Mortgage Bank of Nigeria (FMBN). Workers contribute 2.5% of their salary, and contributors can borrow at a concessionary rate through Primary Mortgage Banks.',
    qualifies: [
      'Nigerian or dual citizens living in Nigeria',
      'Contributing to the NHF (usually 2.5% of salary, deducted by your employer)',
      'Able to repay before the lender’s maximum age',
    ],
    pros: ['The lowest rate available', 'Long repayment terms'],
    tradeoffs: ['Capped loan amount', 'Takes longer to process than commercial loans'],
    documents: ['Valid ID', 'NHF contribution history', 'Payslips and bank statements', 'Property documents'],
    help: 'We check your NHF status, prepare your application, and work with an accredited Primary Mortgage Bank until disbursement.',
  },
  {
    slug: 'nhf-diaspora',
    code: 'NHF_DIASPORA',
    name: 'NHF Diaspora',
    card: 'The FMBN route for Nigerians working abroad.',
    headline: 'The FMBN route for Nigerians earning abroad.',
    what: 'NHF Diaspora extends the National Housing Fund to Nigerians working outside the country, with the same pricing and diaspora eligibility rules.',
    qualifies: ['Nigerian or dual citizens living abroad', 'Registered and contributing under the diaspora scheme'],
    pros: ['Concessionary rate', 'Buy at home without flying home'],
    tradeoffs: ['Capped loan amount', 'Eligibility rules are being confirmed with FMBN'],
    documents: ['Passport', 'Proof of foreign income', 'Bank statements', 'Property documents'],
    help: 'Your advisor meets you on video, in your time zone, and we can search for and verify the property for you.',
  },
  {
    slug: 'mreif',
    code: 'MREIF',
    name: 'MREIF',
    card: 'A strong option when NHF limits are too low for the home you want.',
    headline: 'Single-digit mortgages through partner banks.',
    what: 'The Ministry of Finance Incorporated Real Estate Investment Fund (MREIF) provides long-term funding to partner banks so they can offer single-digit mortgage rates.',
    qualifies: ['Buyers of a home to live in', 'Able to meet the partner bank’s income and document checks'],
    pros: ['Single-digit rate', 'Higher amounts than NHF'],
    tradeoffs: ['Through selected partner banks only', 'Cap and tenor still to be confirmed per bank'],
    documents: ['Valid ID', 'Proof of income', 'Bank statements', 'Property documents'],
    help: 'We match you to a participating bank and handle the application and follow-up.',
  },
  {
    slug: 'commercial',
    code: 'COMMERCIAL',
    name: 'Commercial mortgages',
    card: 'From Primary Mortgage Banks and commercial banks. Higher rates, but often faster and more flexible.',
    headline: 'More flexibility, faster decisions, higher cost.',
    what: 'Primary Mortgage Banks and commercial banks lend at market rates. They are often faster and more flexible about property and income types.',
    qualifies: ['Most salaried and self-employed applicants', 'Eligibility for non-Nigerians depends on residency status'],
    pros: ['Faster decisions', 'More flexible on property and income'],
    tradeoffs: ['Much higher rates', 'Shorter terms'],
    documents: ['Valid ID', 'Proof of income', 'Bank statements', 'Property documents'],
    help: 'We compare lenders for you and negotiate the best terms available for your profile.',
  },
  {
    slug: 'non-interest',
    code: 'NON_INTEREST',
    name: 'Non-interest home finance',
    card: 'Sharia-compliant options based on Ijarah (lease to own), from non-interest banks.',
    headline: 'Own your home through a lease-to-own structure.',
    what: 'Ijarah Muntahia Bittamleek is a lease that ends in ownership. You pay rent plus an ownership portion, and the bank transfers the home to you at the end. The bank sets a profit rate instead of interest.',
    qualifies: ['Anyone who prefers a Sharia-compliant option', 'Able to meet the bank’s checks'],
    pros: ['No interest', 'Clear ownership path'],
    tradeoffs: ['Fewer providers', 'Profit rate set by each bank'],
    documents: ['Valid ID', 'Proof of income', 'Bank statements', 'Property documents'],
    help: 'Your advisor matches you with non-interest banks and explains the structure in plain words.',
  },
];

export const SPECIALISM_LABELS: Record<string, string> = {
  diaspora: 'Diaspora',
  self_employed: 'Self-employed',
  joint: 'Joint applications',
  nhf: 'NHF',
  mreif: 'MREIF',
  non_interest: 'Non-interest',
  first_time: 'First-time buyers',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  yo: 'Yoruba',
  ha: 'Hausa',
  ig: 'Igbo',
  pcm: 'Pidgin',
};
