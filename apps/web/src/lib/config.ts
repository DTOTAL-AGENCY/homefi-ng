export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  company: 'HomeFi Africa Technologies Ltd',
  rc: 'RC 7494763',
  city: 'Abuja, Nigeria',
  supportEmail: 'support.homefi@gmail.com',
  phone: '+234 802 537 9001',
  whatsapp: 'https://wa.me/2348025379001',
  instagram: 'https://instagram.com/homefi_ng',
  x: 'https://x.com/HomeFi_Ng',
} as const;

export const SESSION = {
  priceUsdCents: 2500,
  minutes: 30,
  holdMinutes: 10,
  /** [Confirm] refund window: cancellations this many hours before start are refunded */
  refundWindowHours: 24,
} as const;

export const ANON = {
  cookie: 'hf_anon',
  days: 30,
} as const;

export const LIMITS = {
  submitsPerIpPerHour: 10,
  draftSavesPerIpPerHour: 300,
  reportResendsPerDay: 3,
} as const;

export const CONSENT_TERMS_VERSION = 'terms-2026-11-v1';
