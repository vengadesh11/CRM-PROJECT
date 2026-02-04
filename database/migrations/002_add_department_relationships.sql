-- DocuFlow CRM - Department Relationships Migration
-- This migration adds department_id foreign keys to leads, deals, and customers tables

-- Add department_id to leads table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN department_id UUID REFERENCES departments(id);
        CREATE INDEX idx_leads_department ON leads(department_id);
    END IF;
END $$;

-- Add department_id to deals table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'deals' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE deals ADD COLUMN department_id UUID REFERENCES departments(id);
        CREATE INDEX idx_deals_department ON deals(department_id);
    END IF;
END $$;

-- Add department_id to customers table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE customers ADD COLUMN department_id UUID REFERENCES departments(id);
        CREATE INDEX idx_customers_department ON customers(department_id);
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN leads.department_id IS 'Department this lead is assigned to';
COMMENT ON COLUMN deals.department_id IS 'Department this deal belongs to';
COMMENT ON COLUMN customers.department_id IS 'Department this customer is assigned to';
