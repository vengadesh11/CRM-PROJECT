-- DocuFlow CRM - Custom Fields Table Migration
-- This migration creates the custom_fields table to store dynamic field definitions
-- for Leads, Deals, and Customers modules

-- Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module TEXT NOT NULL CHECK (module IN ('leads', 'deals', 'customers')),
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'textarea', 'dropdown', 'radio', 'checkbox', 'image')),
  required BOOLEAN DEFAULT false,
  placeholder TEXT,
  options JSONB, -- For dropdown/radio options: ["Option 1", "Option 2"]
  field_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_fields_module ON custom_fields(module, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON custom_fields(module, field_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_custom_fields_created_by ON custom_fields(created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to custom_fields table
CREATE TRIGGER update_custom_fields_updated_at 
    BEFORE UPDATE ON custom_fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE custom_fields IS 'Stores custom field definitions for CRM modules (leads, deals, customers)';
COMMENT ON COLUMN custom_fields.module IS 'The CRM module this field belongs to: leads, deals, or customers';
COMMENT ON COLUMN custom_fields.field_type IS 'The type of input field: text, number, date, textarea, dropdown, radio, checkbox, or image';
COMMENT ON COLUMN custom_fields.options IS 'JSON array of options for dropdown and radio field types';
COMMENT ON COLUMN custom_fields.field_order IS 'Display order of the field in the form (lower numbers appear first)';
