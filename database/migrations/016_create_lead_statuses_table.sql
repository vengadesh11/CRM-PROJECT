-- Create Lead Statuses Table
CREATE TABLE IF NOT EXISTS public.lead_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.lead_statuses;
CREATE POLICY "Enable all access for authenticated users" ON public.lead_statuses FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data
INSERT INTO public.lead_statuses (name) VALUES 
('New'), ('Contacted'), ('Qualified'), ('Nurturing'), ('Converted'), ('Lost')
ON CONFLICT DO NOTHING;
