const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function probe() {
    const { data, error } = await supabase.from('deals').select('*').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log('COLUMN_COUNT:', keys.length);
        keys.forEach(k => console.log('COL:', k));
    } else {
        console.log('TABLE_EMPTY');
    }
}

probe();
