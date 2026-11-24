# HomeFi.ng: notes for Claude

- The brief in `docs/brief.md` is the source of truth for copy, rules and the data model. Use its wording; do not invent marketing copy, testimonials or statistics.
- House rules: "you" for the applicant, "we" for HomeFi; numerals with ₦; estimates are never "approvals"; processing fee is always "3% of the Mortgage approved" (property found) or "4% of the Mortgage approved", never a Naira figure; "Book a 1-on-1 Advisory call Here" with the link on "Here".
- Every figure comes from `packages/engine`. Claude (report narrative) writes words only; `narrativeProblems` and `runChecks` enforce that.
- Engine changes must keep `packages/engine/src/engine.test.ts` (Appendix C) passing to the Naira. Money is integer minor units; use decimal.js, never floats, for loan sizing.
- Rates and settings are data. Never hard-code a rate outside `packages/engine/src/defaults.ts` (tests only) and the reference-data migration.
- New tables need RLS policies in a new migration; the browser never writes directly, API routes use the service role and check ownership.
- Commands: `pnpm test`, `pnpm typecheck`, `pnpm --filter web lint`, `pnpm db:reset`, `pnpm db:types` after a migration.
