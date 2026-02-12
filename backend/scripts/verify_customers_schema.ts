/// <reference types="node" />

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking customers table schema...');

    // Try to select a column that might not exist
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching columns:', error.message);
    } else {
        if (data && data.length > 0) {
            const keys = Object.keys(data[0]);
            console.log('Existing columns:', keys.join(', '));

            const requiredColumns = [
                'type', 'salutation', 'first_name', 'last_name', 'company_name',
                'entity_type', 'entity_sub_type', 'incorporation_date',
                'trade_license_authority', 'trade_license_number', 'trade_license_issue_date', 'trade_license_expiry_date',
                'business_activity', 'is_freezone', 'freezone_name',
                'shareholders', 'authorised_signatories', 'share_capital',
                'tax_treatment', 'trn', 'vat_registered_date', 'first_vat_filing_period',
                'vat_filing_due_date', 'vat_reporting_period',
                'corporate_tax_treatment', 'corporate_tax_trn', 'corporate_tax_registered_date',
                'corporate_tax_period', 'corporate_tax_filing_due_date',
                'contact_persons'
            ];

            const missing = requiredColumns.filter(col => !keys.includes(col));
            if (missing.length > 0) {
                console.log('MISSING columns:', missing.join(', '));
            } else {
                console.log('All required columns exist!');
            }
        } else {
            console.log('Table exists but is empty. Cannot verify columns easily without metadata query (which requires admin access via RPC).');
            // Try to insert a dummy record with all fields to see if it fails?
            // No, that might fail due to constraints.
        }
    }
}

checkColumns();
