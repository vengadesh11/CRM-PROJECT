const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('ERROR:', error);
    } else if (data) {
        console.log('USERS_TABLE_EXISTS: true');
        if (data.length > 0) {
            console.log('KEYS:' + JSON.stringify(Object.keys(data[0])));
        } else {
            console.log('TABLE_EMPTY');
        }
    }
}

probe();
