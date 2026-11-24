-- The full engine output shown on the result screen, frozen at submit time so the
-- page and the report never drift if rates change later. prequal_results keeps the
-- per-product rows for querying and reporting.
alter table applications add column estimate jsonb;
alter table applications add column report_prompt_at timestamptz;
