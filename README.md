# HomeFi.ng

Mortgage prequalification and processing for Nigerians at home and in the diaspora. Replaces the Google Form → CSV → manual report → manual email process with one on-site journey: answer about 15 questions, see an instant estimate, create an account to get the PDF report by email, then book a paid session with a vetted Mortgage Advisor.

Source documents: [`docs/brief.md`](docs/brief.md) (the website UX and build brief, v1.0) and [`docs/google-form-questions.md`](docs/google-form-questions.md) (the legacy form). Decisions and open `[Confirm]` items: [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Layout

| Path | What it is |
|---|---|
| `apps/web` | Next.js (App Router) site, prequalification flow, dashboard, advisor portal, admin, `/api/v1` |
| `apps/worker` | Queue worker: report generation (Claude narrative → HTML → headless Chrome PDF → checks), email, reminders; legacy importer |
| `packages/engine` | Deterministic prequalification engine (decimal.js). Appendix C fixtures are its tests |
| `packages/db` | Generated Supabase types, form schemas (zod) and row mappers |
| `packages/report` | 6-page report template, AI narrative schema and fallback, automated checks |
| `packages/emails` | Transactional email templates |
| `supabase/` | Migrations (schema from Appendix A + extras + RLS + reference data) and local seed |

## Run it locally

Needs Node 20+, pnpm and Docker.

```bash
pnpm install
```

```bash
pnpm db:start
```

Copy `.env.example` to `apps/web/.env.local` and `apps/worker/.env`, filling the Supabase keys that `pnpm db:start` prints. Then, in two terminals:

```bash
pnpm dev
```

```bash
pnpm worker
```

- Site: http://localhost:3000 · Local inbox (Mailpit): http://127.0.0.1:54324
- First time only, for PDFs: `pnpm --filter worker exec playwright install chromium`
- Seed logins (local only, password `homefi-local-1`): `admin@homefi.test`, `tolu@homefi.test` (advisor), `applicant@homefi.test`
- Without Paystack, Cal.com or Anthropic keys, the app uses a mock checkout, a mock calendar and rule-based report wording, so the whole journey works offline.

## Tests

```bash
pnpm test
```

```bash
pnpm typecheck
```

The engine tests reproduce Appendix C (applicants A, B, C) to the Naira and the Appendix B response shape.

## Changing rates

Rates, limits and engine settings live in the database. Change them in **/admin → Rates and engine**; each save publishes a new immutable engine version, so new estimates use it immediately and old results stay reproducible.

## Legacy import

```bash
pnpm import:legacy -- --csv responses.csv
```

Dry run by default. Add `--commit` to write, `--pdf-dir <folder>` to attach reports already sent, `--invite` to create accounts and send "Your HomeFi dashboard is ready".

## Deploying

- **Web:** Vercel (or Replit Deployments) from `apps/web`.
- **Worker:** any container host, `docker build -f apps/worker/Dockerfile .` (needs Chromium; not serverless).
- **Database:** a Supabase project; `supabase db push` applies migrations. Do not run `supabase/seed.sql` in production.
- Before launch: verify `homefi.ng` with SPF, DKIM and DMARC; set Paystack, Cal.com and Resend webhooks to `/api/v1/webhooks/{paystack,cal,email}`; set `APP_SECRET`; enable Google sign-in in Supabase Auth.
