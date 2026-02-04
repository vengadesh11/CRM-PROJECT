-- Align existing roles/permissions schema with CRM requirements

-- Ensure roles table exposes is_editable + timestamps
ALTER TABLE IF EXISTS public.roles
    ADD COLUMN IF NOT EXISTS is_editable boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE IF EXISTS public.roles
    ALTER COLUMN is_editable SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT now();

-- Add canonical permission name column that maps to system resources
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'permissions'
            AND column_name = 'name'
    ) THEN
        ALTER TABLE public.permissions
            ADD COLUMN name text;
    END IF;
END$$;

ALTER TABLE IF EXISTS public.permissions
    DROP CONSTRAINT IF EXISTS permissions_name_unique;

ALTER TABLE IF EXISTS public.permissions
    ADD CONSTRAINT permissions_name_unique UNIQUE (name);

-- Add a composite primary key for role_permissions for consistency
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
            AND table_name = 'role_permissions'
            AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.role_permissions
            ADD PRIMARY KEY (role_id, permission_id);
    ELSE
        ALTER TABLE public.role_permissions
            DROP CONSTRAINT IF EXISTS role_permissions_pkey;
        ALTER TABLE public.role_permissions
            ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);
    END IF;
END$$;
