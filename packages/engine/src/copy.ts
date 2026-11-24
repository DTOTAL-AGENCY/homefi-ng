/** Result-screen and report copy from the brief, shared by the web app and the report worker. */
import { formatNaira } from './format';
import type { EngineOutput, Variant } from './types';

export const DISCLAIMER =
  'This is an estimate based on what you told us. It is not a loan offer or an approval. Final terms depend on each lender’s checks, your documents and the property.';

export interface VariantCopy {
  key: Variant['key'];
  headline?: string;
  body: string;
}

const rate = (n: number | string | null | undefined) =>
  n === null || n === undefined ? '' : `₦${Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export function variantCopy(v: Variant): VariantCopy {
  switch (v.key) {
    case 'low_income':
      return {
        key: v.key,
        headline: "Let's find your way in.",
        body: 'On your current income alone, a mortgage would be small. Applying jointly, saving a bigger deposit, or a rent-to-own plan can change that. An advisor can show you which works best for you.',
      };
    case 'nhf_cap':
      return {
        key: v.key,
        body: "NHF loans are capped at ₦50m. We've shown how MREIF and commercial options can cover a more expensive home.",
      };
    case 'target_above':
      return {
        key: v.key,
        body: `The home you want costs more than this estimate covers. A bigger deposit, a joint application or a different location can close the gap of about ${formatNaira(Number(v.params.gapKobo ?? 0))}.`,
      };
    case 'age_term':
      return {
        key: v.key,
        body: `Because lenders want loans repaid by about age ${v.params.maxAge}, your term is ${v.params.years} years. That lowers the amount, but not the rate.`,
      };
    case 'diaspora':
      return {
        key: v.key,
        body:
          v.params.liveRate && v.params.stressedRate
            ? `We converted your income at today's rate of ${rate(v.params.liveRate)} per ${v.params.currency} and tested it at ${rate(v.params.stressedRate)}, so your estimate still holds if the Naira moves. The figures above use the safer rate.`
            : 'NHF Diaspora is shown in place of NHF because you live outside Nigeria.',
      };
    case 'nhf_not_contributor':
      return {
        key: v.key,
        body: "You'll need to register and contribute to the NHF before applying. Your advisor will guide you.",
      };
    case 'non_interest':
      return {
        key: v.key,
        body: 'Non-interest home finance (Ijarah). Your advisor will match you with non-interest banks.',
      };
    case 'non_nigerian':
      return {
        key: v.key,
        body: 'Eligibility depends on residency status. Your advisor will confirm.',
      };
  }
}

/** One-line headline for emails and cards: "You could access up to ₦34,610,000." */
export function headlineSentence(e: Pick<EngineOutput, 'headline'> | null | undefined): string | null {
  return e?.headline ? `You could access up to ${e.headline.display}.` : null;
}
