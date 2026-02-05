export interface PermissionActionConfig {
    action: 'create' | 'view' | 'edit' | 'delete';
    label: string;
    description?: string;
}

export interface PermissionResourceConfig {
    id: string;
    label: string;
    section: string;
    description?: string;
    actions: PermissionActionConfig[];
}

export const PERMISSION_RESOURCES: PermissionResourceConfig[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        section: 'Administration',
        description: 'Access analytics, widgets, and overall KPIs',
        actions: [
            { action: 'view', label: 'View Dashboard' }
        ]
    },
    {
        id: 'departments',
        label: 'Departments',
        section: 'Administration',
        description: 'Manage department hierarchy',
        actions: [
            { action: 'view', label: 'View Departments' },
            { action: 'create', label: 'Create Department' },
            { action: 'edit', label: 'Edit Department' },
            { action: 'delete', label: 'Delete Department' }
        ]
    },
    {
        id: 'roles',
        label: 'Roles & Permissions',
        section: 'Administration',
        description: 'Control system roles and permissions',
        actions: [
            { action: 'view', label: 'View Roles' },
            { action: 'create', label: 'Create Role' },
            { action: 'edit', label: 'Edit Role' },
            { action: 'delete', label: 'Delete Role' }
        ]
    },
    {
        id: 'users',
        label: 'User Management',
        section: 'Administration',
        description: 'Invite, update, and remove CRM users',
        actions: [
            { action: 'view', label: 'View Users' },
            { action: 'create', label: 'Invite User' },
            { action: 'edit', label: 'Edit User' },
            { action: 'delete', label: 'Delete User' }
        ]
    },
    {
        id: 'customers',
        label: 'Customers',
        section: 'Administration',
        description: 'Customer records and contacts',
        actions: [
            { action: 'view', label: 'View Customers' },
            { action: 'create', label: 'Create Customer' },
            { action: 'edit', label: 'Edit Customer' },
            { action: 'delete', label: 'Delete Customer' }
        ]
    },
    {
        id: 'leads',
        label: 'Leads',
        section: 'Sales',
        description: 'Leads pipeline and conversions',
        actions: [
            { action: 'view', label: 'View Leads' },
            { action: 'create', label: 'Create Lead' },
            { action: 'edit', label: 'Edit Lead' },
            { action: 'delete', label: 'Delete Lead' }
        ]
    },
    {
        id: 'deals',
        label: 'Deals',
        section: 'Sales',
        description: 'Opportunity management',
        actions: [
            { action: 'view', label: 'View Deals' },
            { action: 'create', label: 'Create Deal' },
            { action: 'edit', label: 'Edit Deal' },
            { action: 'delete', label: 'Delete Deal' }
        ]
    },
    {
        id: 'settings',
        label: 'Settings',
        section: 'Administration',
        description: 'System settings and configuration',
        actions: [
            { action: 'view', label: 'View Settings' },
            { action: 'edit', label: 'Edit Settings' }
        ]
    },
    {
        id: 'integrations',
        label: 'Integrations',
        section: 'Administration',
        description: 'Manage third-party integrations',
        actions: [
            { action: 'view', label: 'View Integrations' },
            { action: 'edit', label: 'Manage Integrations' }
        ]
    },
    {
        id: 'webhooks',
        label: 'Webhooks',
        section: 'Administration',
        description: 'Manage webhook endpoints and logs',
        actions: [
            { action: 'view', label: 'View Webhooks' },
            { action: 'create', label: 'Create Webhook' },
            { action: 'edit', label: 'Edit Webhook' },
            { action: 'delete', label: 'Delete Webhook' }
        ]
    }
];

export const createPermissionName = (resourceId: string, action: string) => `${resourceId}.${action}`;

export const permissionActionLabel = (action: string) => {
    switch (action) {
        case 'view':
            return 'View';
        case 'create':
            return 'Create';
        case 'edit':
            return 'Edit';
        case 'delete':
            return 'Delete';
        default:
            return action;
    }
};
