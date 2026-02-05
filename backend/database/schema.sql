-- =============================================
-- DocuFlow CRM - Integrations & Webhooks Schema
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Integrations Table
-- Stores configuration for third-party services (e.g., Slack, SendGrid, Zapier)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL, -- e.g., 'slack', 'zapier', 'sendgrid'
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb, -- Public config (non-sensitive)
    triggers TEXT[], -- Array of event names that trigger this integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Integration Secrets Table
-- Stores sensitive API keys/tokens. In a real production environment, 
-- values should be encrypted at application level before inserting.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL, -- e.g., 'api_token'
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Integration Logs Table
-- Audit trail for all integration executions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
    event TEXT NOT NULL, -- The trigger event
    status TEXT NOT NULL, -- 'success', 'failed'
    payload JSONB, -- Data sent to provider
    response JSONB, -- Data received from provider
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. Webhook Endpoints Table
-- Destinations where DocuFlow sends payloads.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    description TEXT,
    secret TEXT NOT NULL, -- Shared secret for HMAC signature
    events TEXT[], -- Array of subscribed events, e.g., ['leads.created']
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id), -- Optional link to creator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. Webhook Deliveries Table
-- History of specific delivery attempts.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
    event_id UUID NOT NULL, -- Unique ID of the event occurrence
    event_name TEXT NOT NULL, -- e.g., 'deals.won'
    request_payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    attempt INTEGER DEFAULT 1,
    next_retry_at TIMESTAMP WITH TIME ZONE, -- Null if success or max retries reached
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- RLS Policies (Row Level Security)
-- -----------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Simple Policies: Only authenticated users (or specific roles) can view/manage
-- Adjust these based on your specific 'permissions' table logic if needed.

-- For now, allowing all authenticated users to View, but only Admins to Modify is common.
-- Assuming 'public' role for simplicity here, but in production use checks against your 'users' table role.

CREATE POLICY "Enable read access for authenticated users" ON public.integrations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON public.webhook_endpoints
    FOR SELECT TO authenticated USING (true);

-- (In a real scenario, you'd restrict Write access to Admins)
