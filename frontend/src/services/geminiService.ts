
export const LICENSE_AUTHORITIES = [
    'DED Dubai',
    'ADED Abu Dhabi',
    'Sharjah PED',
    'Ajman DED',
    'Fujairah Municipality',
    'RAK DED',
    'UMM Al Quwain DED',
    'DDA',
    'DMCC',
    'JAFZA',
    'DIFC',
    'ADGM',
    'Meydan Free Zone',
    'IFZA'
];

export const ENTITY_TYPES = [
    'Sole Establishment',
    'Civil Company',
    'Limited Liability Company (LLC)',
    'Public Joint Stock Company (PJSC)',
    'Private Joint Stock Company (PrJSC)',
    'Branch of Foreign Company',
    'Branch of UAE Company',
    'Free Zone Establishment (FZE)',
    'Free Zone Company (FZCO)'
];

export const ENTITY_SUB_TYPES = [
    'General',
    'Professional',
    'Industrial',
    'Commercial',
    'Tourism',
    'Agricultural'
];

// Mock extraction functions
export const extractTradeLicenseDetailsForCustomer = async (parts: any[]) => {
    console.log('Mock extracting trade license...', parts);
    return {};
};

export const extractMoaDetails = async (parts: any[]) => {
    console.log('Mock extracting MOA...', parts);
    return {};
};

export const extractBusinessEntityDetails = async (parts: any[]) => {
    console.log('Mock extracting entity details...', parts);
    return {};
};

export const extractVatCertificateData = async (parts: any[]) => {
    console.log('Mock extracting VAT data...', parts);
    return {};
};

export const extractCorporateTaxCertificateData = async (parts: any[]) => {
    console.log('Mock extracting Corporate Tax data...', parts);
    return {};
};
