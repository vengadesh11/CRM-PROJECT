// CRM-specific TypeScript type definitions

// Common types
export interface AttachedDocument {
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadDate: string;
}

// ============================================
// LEADS MODULE
// ============================================

export interface Lead {
    id: string;
    date: string;
    companyName: string;
    brand?: string;
    mobileNumber: string;
    email: string;
    leadSource: string;
    status: string;
    serviceRequired?: string;
    leadQualification?: string;
    leadOwner?: string; // User ID
    remarks?: string;
    lastContact?: string;
    closingCycle?: string;
    closingDate?: string;
    department_id?: string;
    createdAt?: string;
    custom_data?: Record<string, any>;
    documents?: AttachedDocument[];
}

// ============================================
// DEALS MODULE
// ============================================

export interface Deal {
    id: string;
    cifNumber: string;
    date: string;
    name: string;
    companyName: string;
    brand: string;
    contactNo: string;
    email: string;
    leadSource: string;
    services: string;
    serviceClosed: string;
    serviceAmount: number;
    closingDate: string;
    paymentStatus: string;
    department_id?: string;
    custom_data?: Record<string, any>;
    documents?: AttachedDocument[];
    dealDocuments?: DealDocument[];
    followUps?: DealFollowUp[];
    notes?: DealNote[];
}

export interface DealFollowUp {
    id: string;
    dealId: string;
    created: string;
    nextFollowUp: string;
    startTime: string;
    sendReminder: boolean;
    remindBefore: number;
    remindUnit: 'Day(s)' | 'Hour(s)' | 'Minute(s)';
    remark: string;
    status: 'Pending' | 'Completed' | 'Cancelled';
    created_by?: string;
}

export interface DealNote {
    id: string;
    dealId: string;
    title: string;
    detail: string; // Rich text HTML
    created: string;
    created_by?: string;
}

export interface DealDocument {
    id: string;
    dealId: string;
    uploaderId: string;
    documentType: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    createdAt: string;
}

export interface DealHistoryItem {
    id: string;
    type: 'followup' | 'note' | 'document' | 'status_change';
    timestamp: string;
    user?: string;
    userName?: string;
    title: string;
    description?: string;
    data?: any;
}

// ============================================
// CUSTOMERS MODULE
// ============================================

export interface Shareholder {
    ownerType: 'Individual' | 'Corporate';
    name: string;
    nationality: string;
    percentage: number;
}

export interface ContactPerson {
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    workPhone: string;
    mobile: string;
}

export interface Customer {
    id: string;
    cifNumber?: string;
    type: 'business' | 'individual';

    // Basic Information
    salutation: string;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    workPhone: string;
    mobile: string;
    currency: string;
    language: string;

    // Business Details
    entityType?: string;
    entitySubType?: string;
    incorporationDate?: string;
    tradeLicenseAuthority?: string;
    tradeLicenseNumber?: string;
    tradeLicenseIssueDate?: string;
    tradeLicenseExpiryDate?: string;
    businessActivity?: string;
    isFreezone?: boolean;
    freezoneName?: string;
    shareholders?: Shareholder[];
    authorisedSignatories?: string;
    shareCapital?: string;

    // Address
    billingAddress: string;
    shippingAddress: string;

    // Tax & Financials
    taxTreatment: string;
    trn: string; // VAT TRN
    vatRegisteredDate?: string;
    firstVatFilingPeriod?: string;
    vatFilingDueDate?: string;
    vatReportingPeriod?: 'Monthly' | 'Quarterly';

    corporateTaxTreatment?: string;
    corporateTaxTrn?: string;
    corporateTaxRegisteredDate?: string;
    corporateTaxPeriod?: string;
    firstCorporateTaxPeriodStart?: string;
    firstCorporateTaxPeriodEnd?: string;
    corporateTaxFilingDueDate?: string;

    businessRegistrationNumber?: string;
    placeOfSupply: string;
    openingBalance: number;
    paymentTerms: string;

    // Contacts & Documents
    contactPersons?: ContactPerson[];
    documents?: CustomerDocument[];
    custom_data?: Record<string, any>;

    // Meta
    ownerId?: string;
    department_id?: string;
    portalAccess: boolean;
    createdAt?: string;
}

export interface CustomerDocument {
    id: string;
    customerId: string;
    documentType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    uploadDate: string;
}

// ============================================
// CUSTOM FIELDS MODULE
// ============================================

export type CustomFieldType =
    | 'text'
    | 'number'
    | 'date'
    | 'textarea'
    | 'dropdown'
    | 'radio'
    | 'checkbox'
    | 'image';

export type CustomFieldModule = 'leads' | 'deals' | 'customers';

export interface CustomField {
    id: string;
    module: CustomFieldModule;
    label: string;
    field_type: CustomFieldType;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For dropdown, radio
    field_order: number;
    is_active: boolean;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
}

// ============================================
// CRM SETTINGS
// ============================================

export interface LeadSource {
    id: string;
    name: string;
    is_active: boolean;
}

export interface Service {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface Brand {
    id: string;
    name: string;
    is_active: boolean;
}

export interface LeadQualification {
    id: string;
    name: string;
    score?: number;
    is_active: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
