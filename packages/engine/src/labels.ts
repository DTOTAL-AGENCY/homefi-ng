/** Shared option lists and labels used by the form, the result, the report and the admin. */

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

/** Diaspora countries listed first (legacy form order), then the rest via Intl names. */
export const PRIORITY_COUNTRIES = ['GB', 'US', 'CA', 'AE', 'DE', 'ZA', 'IE', 'NL', 'FR', 'IT', 'AU', 'QA', 'SA'];

export const ALL_COUNTRY_CODES = (
  'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CA CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW'
).split(' ');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const countryName = (code: string | null | undefined): string | null => {
  if (!code || code.length !== 2) return null;
  try {
    return regionNames.of(code.toUpperCase()) ?? null;
  } catch {
    return null;
  }
};

export const CURRENCIES = ['NGN', 'GBP', 'USD', 'CAD', 'EUR', 'AED'] as const;

/** Default income currency from the residence country */
export function defaultCurrency(country: string | null | undefined): string {
  switch (country) {
    case 'GB': return 'GBP';
    case 'US': return 'USD';
    case 'CA': return 'CAD';
    case 'AE': return 'AED';
    case 'DE': case 'IE': case 'NL': case 'FR': case 'IT': case 'ES': case 'BE': case 'AT': case 'PT': case 'FI':
      return 'EUR';
    default: return 'NGN';
  }
}

export const BUDGET_BANDS = [
  { key: 'lt10m', label: 'Below ₦10m', minKobo: 0, maxKobo: 1_000_000_000 },
  { key: '10to20m', label: '₦10m to ₦20m', minKobo: 1_000_000_000, maxKobo: 2_000_000_000 },
  { key: '20to30m', label: '₦20m to ₦30m', minKobo: 2_000_000_000, maxKobo: 3_000_000_000 },
  { key: '30to50m', label: '₦30m to ₦50m', minKobo: 3_000_000_000, maxKobo: 5_000_000_000 },
  { key: '50to75m', label: '₦50m to ₦75m', minKobo: 5_000_000_000, maxKobo: 7_500_000_000 },
  { key: '75to100m', label: '₦75m to ₦100m', minKobo: 7_500_000_000, maxKobo: 10_000_000_000 },
  { key: 'gt100m', label: 'Above ₦100m', minKobo: 10_000_000_000, maxKobo: null },
  { key: 'exact', label: 'I have an exact price', minKobo: null, maxKobo: null },
] as const;

export const PRODUCT_LABELS: Record<string, string> = {
  NHF: 'National Housing Fund (FMBN)',
  NHF_DIASPORA: 'NHF Diaspora (FMBN)',
  MREIF: 'MREIF via partner banks',
  COMMERCIAL: 'Commercial (PMBs and banks)',
  NON_INTEREST: 'Non-interest (Ijarah)',
};

/**
 * Residence label for the report: the chosen country; if it is "Other" or blank,
 * infer it from a non-Nigerian phone country; otherwise "Outside of Nigeria".
 */
export function residenceLabel(
  residence: 'nigeria' | 'diaspora',
  country: string | null | undefined,
  phoneCountry: string | null | undefined,
  state?: string | null,
): string {
  if (residence === 'nigeria') return state ? `${state}, Nigeria` : 'Nigeria';
  const chosen = country && country !== 'XX' && country !== 'NG' ? countryName(country) : null;
  if (chosen) return chosen;
  const inferred = phoneCountry && phoneCountry !== 'NG' ? countryName(phoneCountry) : null;
  return inferred ?? 'Outside of Nigeria';
}
