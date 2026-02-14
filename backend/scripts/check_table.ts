import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase
        .from('lead_statuses')
        .select('id')
        .limit(1);

    if (error) {
        console.error('Error checking lead_statuses table:', error.message);
        if (error.message.includes('relation "lead_statuses" does not exist')) {
            console.log('Table lead_statuses DOES NOT EXIST');
        }
    } else {
        console.log('Table lead_statuses exists!');
    }
}

checkTable();
