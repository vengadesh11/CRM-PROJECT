-- Seed permissions for sidebar resources

INSERT INTO public.permissions (name, label, description, category)
VALUES
    ('dashboard.view', 'View Dashboard', 'Access dashboard overview widgets', 'Administration'),
    ('departments.view', 'View Departments', 'Access department list', 'Administration'),
    ('departments.create', 'Create Department', 'Create a new department', 'Administration'),
    ('departments.edit', 'Edit Department', 'Modify department details', 'Administration'),
    ('departments.delete', 'Delete Department', 'Remove a department', 'Administration'),
    ('roles.view', 'View Roles', 'See available roles', 'Administration'),
    ('roles.create', 'Create Role', 'Add a new role', 'Administration'),
    ('roles.edit', 'Edit Role', 'Modify existing roles', 'Administration'),
    ('roles.delete', 'Delete Role', 'Remove a role', 'Administration'),
    ('users.view', 'View Users', 'See CRM users', 'Administration'),
    ('users.create', 'Invite User', 'Invite new CRM users', 'Administration'),
    ('users.edit', 'Edit User', 'Update user metadata', 'Administration'),
    ('users.delete', 'Delete User', 'Deactivate or remove users', 'Administration'),
    ('customers.view', 'View Customers', 'Access customer directory', 'Administration'),
    ('customers.create', 'Create Customer', 'Add a new customer record', 'Administration'),
    ('customers.edit', 'Edit Customer', 'Update customer information', 'Administration'),
    ('customers.delete', 'Delete Customer', 'Remove customer records', 'Administration'),
    ('leads.view', 'View Leads', 'View the leads pipeline', 'Sales'),
    ('leads.create', 'Create Lead', 'Add new lead', 'Sales'),
    ('leads.edit', 'Edit Lead', 'Update lead details', 'Sales'),
    ('leads.delete', 'Delete Lead', 'Remove a lead', 'Sales'),
    ('deals.view', 'View Deals', 'Review deal opportunities', 'Sales'),
    ('deals.create', 'Create Deal', 'Create a new deal', 'Sales'),
    ('deals.edit', 'Edit Deal', 'Modify deal details', 'Sales'),
    ('deals.delete', 'Delete Deal', 'Remove deals', 'Sales'),
    ('settings.view', 'View Settings', 'Access application settings', 'Administration'),
    ('settings.edit', 'Edit Settings', 'Modify configuration settings', 'Administration')
ON CONFLICT (name) DO NOTHING;
