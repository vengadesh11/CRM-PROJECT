import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

// Helper to fetch data with fallback for missing is_active column
const fetchOptions = async (table: string, columns: string = 'id, name', orderBy: string = 'name', ascending: boolean = true) => {
    try {
        // Try selecting with is_active filter first
        const { data, error } = await supabaseAdmin
            .from(table)
            .select(columns)
            .eq('is_active', true)
            .order(orderBy, { ascending });

        if (error) throw error;
        return data || [];
    } catch (dbError: any) {
        // If error is about missing column, try without is_active filter
        const isColumnError = dbError.message && (
            dbError.message.includes('is_active') ||
            dbError.message.includes('column') ||
            dbError.message.includes('table') ||
            dbError.message.includes('schema cache')
        );
        if (isColumnError) {
            console.warn(`Column is_active missing or schema error on ${table}, fetching all rows.`);
            const { data, error } = await supabaseAdmin
                .from(table)
                .select(columns)
                .order(orderBy, { ascending });

            if (error) {
                console.error(`Failed to fetch ${table} fallback:`, error);
                return [];
            }
            return data || [];
        }
        console.error(`Failed to fetch ${table}:`, dbError);
        return [];
    }
};

/**
 * GET /api/crm/leads/options
 * Get all dropdown options for creating/editing leads
 */
export const getLeadOptions = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Execute all fetches in parallel
        const [
            brands,
            qualifications,
            leadSources,
            servicesRequired,
            leadOwners,
            leadStatuses,
            users
        ] = await Promise.all([
            fetchOptions('brands'),
            fetchOptions('lead_qualifications', 'id, name, score', 'score', false),
            fetchOptions('lead_sources'),
            fetchOptions('service_required'),
            fetchOptions('lead_owners'),
            fetchOptions('lead_statuses'),
            fetchOptions('users', 'id, first_name, last_name, email', 'first_name')
        ]);

        res.json({
            success: true,
            data: {
                brands,
                leadStatuses,
                qualifications,
                users,
                leadSources,
                servicesRequired,
                leadOwners
            }
        });
    } catch (error: any) {
        console.error('Failed to fetch lead options:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch lead options'
        });
    }
};
