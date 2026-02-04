const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probe() {
    const { data, error } = await supabase.from('customers').select('cif, company_name, display_name').order('created_at', { ascending: false });
    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('COUNT:', data.length);
        data.forEach((c, i) => {
            console.log(`${i + 1}. CIF:[${c.cif}] NAME:[${c.company_name || c.display_name}]`);
        });
    }
}

probe();
