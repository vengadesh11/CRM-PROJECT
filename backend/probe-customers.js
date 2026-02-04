const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('--- Probing Customers ---');
    const { data: customers, error: cError } = await supabase.from('customers').select('*').limit(1);
    if (cError) console.error('Customers Error:', cError);
    else if (customers && customers.length > 0) console.log('CUSTOMERS_KEYS:', Object.keys(customers[0]));
    else console.log('CUSTOMERS EMPTY');

    console.log('\n--- Probing Customer Legal Docs ---');
    try {
        const { data: docs, error: dError } = await supabase.from('customer_legal_docs').select('*').limit(1);
        if (dError) console.error('Docs Error:', dError);
        else if (docs && docs.length > 0) console.log('DOCS_KEYS:', Object.keys(docs[0]));
        else console.log('DOCS EMPTY');
    } catch (e) {
        console.log('customer_legal_docs table might not exist');
    }
}

probe();
