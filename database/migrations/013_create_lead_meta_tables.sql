-- Create tables for lead dropdown options

-- Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Lead Qualifications
CREATE TABLE IF NOT EXISTS public.lead_qualifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    score integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Seed initial data
INSERT INTO public.brands (name) VALUES
    ('Brand A'),
    ('Brand B'),
    ('Brand C')
ON CONFLICT DO NOTHING;

INSERT INTO public.services (name, description) VALUES
    ('Consulting', 'Strategic consulting services'),
    ('Implementation', 'Software implementation'),
    ('Support', 'Ongoing technical support'),
    ('Training', 'User training and onboarding')
ON CONFLICT DO NOTHING;

INSERT INTO public.lead_qualifications (name, score) VALUES
    ('Hot', 90),
    ('Warm', 60),
    ('Cold', 20),
    ('Qualified', 80),
    ('Unqualified', 0)
ON CONFLICT DO NOTHING;

-- Ensure leads table has last_contact column
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS last_contact timestamp with time zone;
