-- DocuFlow CRM - Audit Trail Migration
-- This migration creates an audit log table to track all changes in CRM modules

CREATE TABLE IF NOT EXISTS crm_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'deal', 'customer', 'custom_field')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'assignment')),
  user_id UUID REFERENCES users(id),
  changes JSONB, -- { "old": {...}, "new": {...} }
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_entity ON crm_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON crm_audit_logs(user_id);
CREATE INDEX idx_audit_created ON crm_audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON crm_audit_logs(action);

-- Add comments
COMMENT ON TABLE crm_audit_logs IS 'Audit trail for all CRM module changes';
COMMENT ON COLUMN crm_audit_logs.entity_type IS 'Type of CRM entity: lead, deal, customer, or custom_field';
COMMENT ON COLUMN crm_audit_logs.action IS 'Action performed: create, update, delete, status_change, or assignment';
COMMENT ON COLUMN crm_audit_logs.changes IS 'JSON object containing old and new values';
