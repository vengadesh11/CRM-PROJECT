-- Ensure leads table has the lead_source column

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS lead_source text;
