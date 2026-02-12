
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
    role?: string;
}

export interface ContactPerson {
    id?: string;
    salutation?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    workPhone?: string;
    mobile?: string;
    designation?: string;
    isPrimary?: boolean;
}

export interface Shareholder {
    id?: string;
    ownerType: string;
    name: string;
    nationality: string;
    percentage: number;
}

export interface DocumentUploadPayload {
    documentType: string;
    file: File;
}

export interface Customer {
    id: string;
    cifNumber?: string;

    // Basic Details
    type: 'business' | 'individual';
    salutation?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;

    // Contact
    email?: string;
    workPhone?: string;
    mobile?: string;

    // Address
    currency?: string;
    language?: string;
    billingAddress?: string;
    shippingAddress?: string;

    // Entity Details
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

    // Owners / Signatories
    shareholders?: Shareholder[];
    authorisedSignatories?: string;
    shareCapital?: string;

    // Tax
    taxTreatment?: string;
    trn?: string;
    vatRegisteredDate?: string;
    firstVatFilingPeriod?: string;
    vatFilingDueDate?: string;
    vatReportingPeriod?: string;

    // Corporate Tax
    corporateTaxTreatment?: string;
    corporateTaxTrn?: string;
    corporateTaxRegisteredDate?: string;
    corporateTaxPeriod?: string;
    firstCorporateTaxPeriodStart?: string;
    firstCorporateTaxPeriodEnd?: string;
    corporateTaxFilingDueDate?: string;
    businessRegistrationNumber?: string;
    placeOfSupply?: string;

    // Financials
    openingBalance?: number;
    paymentTerms?: string;

    // Meta
    remarks?: string;
    ownerId?: string;
    portalAccess?: boolean;
    contactPersons?: ContactPerson[];
    custom_data?: Record<string, any>;

    created_at?: string;
    updated_at?: string;
}
