import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing Supabase environment variables! Check your .env file.');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY | SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Set' : 'MISSING');
}

// Admin client with service role key (for server-side operations)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Public client for auth operations (uses anon key)
export const supabaseAnon: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Create a client for user-specific operations
export const createUserClient = (accessToken: string): SupabaseClient => {
    return createClient(supabaseUrl!, process.env.SUPABASE_ANON_KEY!, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};

export default supabaseAdmin;
