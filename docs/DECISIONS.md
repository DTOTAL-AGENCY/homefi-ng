# Decisions and open items

## Made
- **Stack:** Next.js (App Router, TypeScript) + Tailwind + Supabase (Postgres with RLS, Auth, Storage, pgmq), as recommended in the brief. A separate Node worker (`apps/worker`) runs report, email and scheduled jobs.
- **Form:** the brief's 4-step flow and validation, plus the legacy Google Form questions that the team still uses (gender, property features and bedrooms, RSA-for-equity, upfront cost acknowledgement, financial readiness, proceed intent, accuracy declaration). See `docs/google-form-questions.md`. The engine ignores these; they feed the report narrative, advisor context and admin export.
- **Email:** collected at sign-up, not in the form (brief).
- **Engine:** deterministic TypeScript in `packages/engine` with decimal.js; settings and rates are data (`engine_settings`, `rate_products`), so the admin can change them without a release. Every change creates a new immutable engine version.
- **Email provider:** Resend by default behind an adapter; a console/log transport is used locally.
- **AI narrative:** Claude API with JSON schema output; no names, phones or emails sent; numbers come from the engine only; rule-based fallback.

## Open (from the brief, implemented with these defaults)
| Item | Default used | Where to change |
|---|---|---|
| Repayment method | equal principal | admin → engine settings |
| Commercial range and tenor | 22%–30%, 15 years | admin → rate products |
| MREIF cap and tenor | no cap, 18 years | admin → rate products |
| Max age at end of term | 60 | admin → engine settings |
| Deduct existing obligations | on | admin → engine settings |
| Session price in Naira | unset (USD 25 shown; NGN shown only once set per advisor) | admin → advisors |
| Refund / reschedule window | 24 hours before start | `apps/web/src/lib/config.ts` |
| Advisor credentials list | free-form, verified by admin | admin → advisors |
| Sending domain | `support@homefi.ng`, reply-to support.homefi@gmail.com | env `EMAIL_FROM`, `EMAIL_REPLY_TO` |
| Trust strip counts | live from DB; lender stat uses the brief's wording until MOUs | `apps/web/src/app/(public)/page.tsx` |
| Account-to-booking target (8%) | analytics only | — |
