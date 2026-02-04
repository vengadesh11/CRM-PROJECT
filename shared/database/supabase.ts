import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase Admin Client (server-side only)
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Initialize and return the Supabase admin client
 * Uses service role key for full database access
 */
export function getSupabaseAdmin(): SupabaseClient {
    if (!supabaseAdmin) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error(
                'Missing Supabase credentials. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
            );
        }

        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public',
            },
        });
    }

    return supabaseAdmin;
}

/**
 * Database helper functions
 */
export class Database {
    private client: SupabaseClient;

    constructor() {
        this.client = getSupabaseAdmin();
    }

    /**
     * Execute a query and return the results
     */
    async query<T = any>(
        table: string,
        options?: {
            select?: string;
            filters?: Record<string, any>;
            orderBy?: { column: string; ascending?: boolean };
            limit?: number;
        }
    ) {
        let query = this.client.from(table).select(options?.select || '*');

        // Apply filters
        if (options?.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        // Apply ordering
        if (options?.orderBy) {
            query = query.order(options.orderBy.column, {
                ascending: options.orderBy.ascending ?? true,
            });
        }

        // Apply limit
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Database query error: ${error.message}`);
        }

        return data as T[];
    }

    /**
     * Insert a new record
     */
    async insert<T = any>(table: string, data: Partial<T>) {
        const { data: result, error } = await this.client
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            throw new Error(`Database insert error: ${error.message}`);
        }

        return result as T;
    }

    /**
     * Update a record
     */
    async update<T = any>(table: string, id: string, data: Partial<T>) {
        const { data: result, error } = await this.client
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Database update error: ${error.message}`);
        }

        return result as T;
    }

    /**
     * Delete a record
     */
    async delete(table: string, id: string) {
        const { error } = await this.client.from(table).delete().eq('id', id);

        if (error) {
            throw new Error(`Database delete error: ${error.message}`);
        }

        return true;
    }

    /**
     * Get Supabase client for complex queries
     */
    getClient(): SupabaseClient {
        return this.client;
    }
}

export const db = new Database();
