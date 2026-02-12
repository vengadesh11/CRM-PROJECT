
import supabaseAdmin from '../src/config/supabase';

async function checkCustomFields() {
    console.log('Checking custom fields for module: leads');
    const { data, error } = await supabaseAdmin
        .from('custom_fields')
        .select('*')
        .eq('module', 'leads');

    if (error) {
        console.error('Error fetching custom fields:', error);
    } else {
        console.log(`Found ${data.length} custom fields for leads:`);
        console.table(data);
    }
}

checkCustomFields();
