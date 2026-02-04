// CRM Permission Constants
// Used across both frontend and backend for permission checks

export const CRM_PERMISSIONS = {
    // Leads Module
    LEADS_VIEW: 'sales-leads:view',
    LEADS_CREATE: 'sales-leads:create',
    LEADS_EDIT: 'sales-leads:edit',
    LEADS_DELETE: 'sales-leads:delete',
    LEADS_VIEW_ALL: 'sales-leads:view-all', // View all leads, not just assigned ones

    // Deals Module
    DEALS_VIEW: 'sales-deals:view',
    DEALS_CREATE: 'sales-deals:create',
    DEALS_EDIT: 'sales-deals:edit',
    DEALS_DELETE: 'sales-deals:delete',
    DEALS_VIEW_ALL: 'sales-deals:view-all',

    // Customers Module
    CUSTOMERS_VIEW: 'customer-management:view',
    CUSTOMERS_CREATE: 'customer-management:create',
    CUSTOMERS_EDIT: 'customer-management:edit',
    CUSTOMERS_DELETE: 'customer-management:delete',
    CUSTOMERS_VIEW_ALL: 'customer-management:view-all',

    // Custom Fields
    CUSTOM_FIELDS_MANAGE: 'crm:custom-fields:manage',

    // CRM Settings
    CRM_SETTINGS_MANAGE: 'crm:settings:manage',

    // Departments (if CRM-specific)
    DEPARTMENTS_MANAGE: 'crm:departments:manage',
} as const;

export type CRMPermission = typeof CRM_PERMISSIONS[keyof typeof CRM_PERMISSIONS];

/**
 * Check if a permission string is a valid CRM permission
 */
export function isValidCRMPermission(permission: string): permission is CRMPermission {
    return Object.values(CRM_PERMISSIONS).includes(permission as CRMPermission);
}

/**
 * Group permissions by module
 */
export const PERMISSIONS_BY_MODULE = {
    leads: [
        CRM_PERMISSIONS.LEADS_VIEW,
        CRM_PERMISSIONS.LEADS_CREATE,
        CRM_PERMISSIONS.LEADS_EDIT,
        CRM_PERMISSIONS.LEADS_DELETE,
        CRM_PERMISSIONS.LEADS_VIEW_ALL,
    ],
    deals: [
        CRM_PERMISSIONS.DEALS_VIEW,
        CRM_PERMISSIONS.DEALS_CREATE,
        CRM_PERMISSIONS.DEALS_EDIT,
        CRM_PERMISSIONS.DEALS_DELETE,
        CRM_PERMISSIONS.DEALS_VIEW_ALL,
    ],
    customers: [
        CRM_PERMISSIONS.CUSTOMERS_VIEW,
        CRM_PERMISSIONS.CUSTOMERS_CREATE,
        CRM_PERMISSIONS.CUSTOMERS_EDIT,
        CRM_PERMISSIONS.CUSTOMERS_DELETE,
        CRM_PERMISSIONS.CUSTOMERS_VIEW_ALL,
    ],
    customFields: [CRM_PERMISSIONS.CUSTOM_FIELDS_MANAGE],
    settings: [CRM_PERMISSIONS.CRM_SETTINGS_MANAGE],
    departments: [CRM_PERMISSIONS.DEPARTMENTS_MANAGE],
};
