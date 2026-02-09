-- Create integration_secrets table for storing API keys/tokens
-- This table stores encrypted secrets for each integration

CREATE TABLE IF NOT EXISTS integration_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT integration_secrets_unique UNIQUE (integration_id, key_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_secrets_integration_id ON integration_secrets(integration_id);
