-- Seed integrations table with CRM providers
-- This ensures that SuiteCRM, Zoho, EspoCRM, and OroCRM integration records exist.

INSERT INTO integrations (id, name, provider, description, is_active, config, triggers, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'SuiteCRM', 'suitecrm', 'Sync leads and opportunities from SuiteCRM.', false, '{}', '{}', now(), now()),
    (gen_random_uuid(), 'Zoho CRM', 'zoho', 'Sync leads and contacts from Zoho CRM.', false, '{}', '{}', now(), now()),
    (gen_random_uuid(), 'EspoCRM', 'espocrm', 'Sync leads from EspoCRM.', false, '{}', '{}', now(), now()),
    (gen_random_uuid(), 'OroCRM', 'orocrm', 'Sync leads from OroCRM.', false, '{}', '{}', now(), now())
ON CONFLICT (provider) DO NOTHING;
