const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    let output = '';
    const { data: customers, error: cError } = await supabase.from('customers').select('*').limit(1);
    if (cError) output += 'Customers Error: ' + JSON.stringify(cError) + '\n';
    else if (customers && customers.length > 0) output += 'CUSTOMERS_KEYS: ' + JSON.stringify(Object.keys(customers[0])) + '\n';

    const { data: docs, error: dError } = await supabase.from('customer_legal_docs').select('*').limit(1);
    if (dError) output += 'Docs Error: ' + JSON.stringify(dError) + '\n';
    else if (docs && docs.length > 0) output += 'DOCS_KEYS: ' + JSON.stringify(Object.keys(docs[0])) + '\n';

    fs.writeFileSync('probe-output.txt', output);
}

probe();
