-- =============================================
-- DocuFlow CRM - Restore Trial Requests Schema
-- =============================================

-- This table supports the "Request a Trial" landing page form.
-- We use 'subscription_requests' to avoid conflict with the 'subscriptions' table used for Stripe.

CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name TEXT,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'contacted', 'converted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone (public/anon) to INSERT requests (since it's a public landing page)
CREATE POLICY "Enable insert access for all users" ON public.subscription_requests
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view
CREATE POLICY "Enable read access for authenticated users" ON public.subscription_requests
    FOR SELECT TO authenticated USING (true);
