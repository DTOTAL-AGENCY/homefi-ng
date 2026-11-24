import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import type { EngineOutput } from '@homefi/engine';
import {
  NarrativeSchema,
  SYSTEM_PROMPT,
  fallbackNarrative,
  narrativeProblems,
  userPrompt,
  type Narrative,
  type NarrativeFacts,
} from '@homefi/report';
import { env } from './env';

// Mirrors NarrativeSchema in zod v4 form for the SDK's structured-output helper.
const OutputSchema = z.object({
  profile_summary: z.string(),
  insight: z.string(),
  recommended_path: z.string(),
  next_steps: z.array(z.string()),
  notes: z.array(z.string()),
});

const client = env.aiEnabled ? new Anthropic() : null;

export interface NarrativeResult {
  narrative: Narrative;
  source: 'ai' | 'fallback';
  model: string | null;
  reason?: string;
}

async function ask(facts: NarrativeFacts): Promise<{ narrative: Narrative | null; reason?: string }> {
  const response = await client!.messages.parse({
    model: env.anthropicModel,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(facts) }],
    output_config: { effort: 'low', format: zodOutputFormat(OutputSchema) },
  });
  if (response.stop_reason === 'refusal') return { narrative: null, reason: 'refusal' };
  if (response.stop_reason === 'max_tokens') return { narrative: null, reason: 'max_tokens' };
  const parsed = NarrativeSchema.safeParse(response.parsed_output);
  if (!parsed.success) return { narrative: null, reason: 'schema' };
  const problems = narrativeProblems(parsed.data, facts.eligibleProducts);
  if (problems.length) return { narrative: null, reason: problems.join('; ') };
  return { narrative: parsed.data };
}

/** Claude writes the words; on failure retry once, then fall back to rule-based wording. */
export async function writeNarrative(facts: NarrativeFacts, estimate: EngineOutput): Promise<NarrativeResult> {
  if (!client) return { narrative: fallbackNarrative(facts, estimate), source: 'fallback', model: null, reason: 'no_api_key' };
  let reason = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await ask(facts);
      if (r.narrative) return { narrative: r.narrative, source: 'ai', model: env.anthropicModel };
      reason = r.reason ?? 'invalid';
      if (reason === 'refusal') break;
    } catch (e) {
      if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
        reason = `api_error_${e.status}`;
        break;
      }
      // Rate limits, 5xx and connection errors were already retried by the SDK
      reason = e instanceof Anthropic.APIError ? `api_error_${e.status}` : (e as Error).message;
    }
  }
  return { narrative: fallbackNarrative(facts, estimate), source: 'fallback', model: null, reason };
}
