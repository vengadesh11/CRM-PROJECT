-- Create Sales Settings Tables

-- Lead Sources
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Service Required
CREATE TABLE IF NOT EXISTS public.service_required (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Lead Owners (This might be a subset of users, or a separate table if they are not system users)
-- For now, we'll creating a separate table as requested, but typically this links to users table.
-- Based on requirements, users might want to add "Lead Owners" that are not necessarily system users yet?
-- Or maybe it's just a way to categorize users. Let's create a simple table as requested for the dropdown.
CREATE TABLE IF NOT EXISTS public.lead_owners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Payment Status
CREATE TABLE IF NOT EXISTS public.payment_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Service Closed Status
CREATE TABLE IF NOT EXISTS public.service_closed_statuses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_required ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_closed_statuses ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow full access for authenticated users for now)
CREATE POLICY "Enable all access for authenticated users" ON public.lead_sources FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.service_required FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.lead_owners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.payment_statuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON public.service_closed_statuses FOR ALL USING (auth.role() = 'authenticated');


-- Seed Data

-- Lead Sources
INSERT INTO public.lead_sources (name) VALUES 
('Website'), ('Referral'), ('Cold Call'), ('LinkedIn'), ('Exhibition')
ON CONFLICT DO NOTHING;

-- Service Required
INSERT INTO public.service_required (name) VALUES 
('Audit'), ('Taxation'), ('Consulting'), ('Bookkeeping')
ON CONFLICT DO NOTHING;

-- Payment Status
INSERT INTO public.payment_statuses (name) VALUES 
('Pending'), ('Paid'), ('Overdue'), ('Partially Paid')
ON CONFLICT DO NOTHING;

-- Service Closed Status
INSERT INTO public.service_closed_statuses (name) VALUES 
('Completed'), ('Cancelled'), ('On Hold')
ON CONFLICT DO NOTHING;
