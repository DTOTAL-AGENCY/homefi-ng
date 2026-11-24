'use client';

import { useEffect } from 'react';
import type { PostHog } from 'posthog-js';

let ph: PostHog | null = null;
const queue: Array<[string, Record<string, unknown>]> = [];

/** PostHog, loaded lazily and only when a key is configured. Never sends form values. */
export function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || ph) return;
    const start = () =>
      import('posthog-js').then(({ default: posthog }) => {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
          capture_pageview: true,
          autocapture: false,
          disable_session_recording: true,
          mask_all_text: true,
        });
        ph = posthog;
        queue.splice(0).forEach(([e, p]) => posthog.capture(e, p));
      });
    if ('requestIdleCallback' in window) (window as Window).requestIdleCallback(() => void start());
    else setTimeout(start, 1500);
  }, []);
  return null;
}

/** Event names and properties from the brief's analytics table. */
export type AnalyticsEvent =
  | 'prequal_started'
  | 'prequal_step_completed'
  | 'prequal_submitted'
  | 'estimate_viewed'
  | 'report_prompt_answered'
  | 'account_created'
  | 'signed_in'
  | 'report_downloaded'
  | 'advisors_viewed'
  | 'advisor_profile_viewed'
  | 'booking_started'
  | 'booking_paid'
  | 'booking_failed'
  | 'review_submitted';

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  if (ph) ph.capture(event, props);
  else if (queue.length < 50) queue.push([event, props]);
}
