-- Remove only indexes duplicated by the broad foreign-key hardening migration.
-- The retained indexes were created by the original V1 schema and have clearer stable names.
drop index if exists public.idx_companies_workspace_id_0dd14aae;
drop index if exists public.idx_evidence_items_report_id_f2c29ce2;
drop index if exists public.idx_sources_research_job_id_d8c6a04d;
