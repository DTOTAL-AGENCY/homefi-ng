/** "₦34,610,000" from kobo. Whole Naira only; the brief always shows numerals with ₦. */
export function formatNaira(kobo: number): string {
  const naira = Math.floor(kobo / 100);
  return '₦' + naira.toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

/** Compact form for chips and tables: ₦34.6m */
export function formatNairaShort(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${trim(naira / 1_000_000)}m`;
  if (naira >= 1_000) return `₦${trim(naira / 1_000)}k`;
  return formatNaira(kobo);
}

const trim = (n: number) => (Math.floor(n * 10) / 10).toString();

export function formatRate(rate: number): string {
  return `${trim2(rate * 100)}%`;
}
const trim2 = (n: number) => Number(n.toFixed(2)).toString();

/** Reference code HF-PQ-YYYY-MMDD-INITIALS-NNNN */
export const REFERENCE_CODE = /^HF-PQ-\d{4}-\d{4}-[A-Z]{1,4}-\d{4}$/;

export function initials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return (f + l).toUpperCase().replace(/[^A-Z]/g, '') || 'XX';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "MortgagePrequalification Report1 [22.Nov.26]_HomeFi-[Surname First-name]" */
export function reportFileName(
  reportNumber: 1 | 2,
  date: Date,
  surname: string,
  firstName: string,
): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[date.getUTCMonth()];
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `MortgagePrequalification Report${reportNumber} [${dd}.${mon}.${yy}]_HomeFi-[${surname.trim()} ${firstName.trim()}]`;
}
