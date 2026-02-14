import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

// Map of allowed categories to table names
const TABLE_MAP: Record<string, string> = {
    'lead-sources': 'lead_sources',
    'lead-owners': 'lead_owners',
    'service-required': 'service_required',
    'payment-statuses': 'payment_statuses',
    'service-closed-statuses': 'service_closed_statuses',
    'brands': 'brands',
    'services': 'services',
    'lead-status': 'lead_statuses',
    'lead-statuses': 'lead_statuses',
    'lead-qualifications': 'lead_qualifications'
};

/**
 * GET /api/crm/sales-settings/:category
 * Get all items for a category
 */
export const getItems = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category } = req.params;
        const tableName = TABLE_MAP[category];

        console.log(`[DEBUG] GET sales-settings category: ${category}, tableName: ${tableName}`);

        if (!tableName) {
            res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
            return;
        }

        try {
            // Try with is_active filter first
            const { data, error } = await supabaseAdmin
                .from(tableName)
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            res.json({
                success: true,
                data: data || []
            });
        } catch (dbError: any) {
            // If column doesn't exist, fallback to fetching all
            const isColumnError = dbError.message && (
                dbError.message.includes('is_active') ||
                dbError.message.includes('column') ||
                dbError.message.includes('table') ||
                dbError.message.includes('schema cache')
            );
            if (isColumnError) {
                console.warn(`Column is_active missing or schema error on ${tableName}, fetching all rows.`);
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .select('*')
                    .order('name');

                if (error) {
                    console.error(`Failed to fetch ${tableName} fallback:`, error);
                    res.json({
                        success: true,
                        data: []
                    });
                    return;
                }

                res.json({
                    success: true,
                    data: data || []
                });
                return;
            }
            throw dbError;
        }
    } catch (error: any) {
        console.error(`Failed to fetch ${req.params.category}:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch items'
        });
    }
};

/**
 * POST /api/crm/sales-settings/:category
 * Create a new item
 */
export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category } = req.params;
        const { name } = req.body;
        const tableName = TABLE_MAP[category];

        console.log(`[DEBUG] POST sales-settings category: ${category}, tableName: ${tableName}, name: ${name}`);

        if (!tableName) {
            console.error(`[DEBUG] Invalid category requested: "${category}". Available categories: ${Object.keys(TABLE_MAP).join(', ')}`);
            res.status(400).json({
                success: false,
                error: `Invalid category: ${category}. Available: ${Object.keys(TABLE_MAP).join(', ')}`,
                debug: {
                    requestedCategory: category,
                    availableCategories: Object.keys(TABLE_MAP)
                }
            });
            return;
        }

        if (!name) {
            res.status(400).json({
                success: false,
                error: 'Name is required'
            });
            return;
        }

        const payload: any = { name, is_active: true };

        try {
            const { data, error } = await supabaseAdmin
                .from(tableName)
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                success: true,
                data,
                message: 'Item created successfully'
            });
        } catch (dbError: any) {
            // Check if error is due to missing is_active column
            const isColumnError = dbError.message && (
                dbError.message.includes('is_active') ||
                dbError.message.includes('column') ||
                dbError.message.includes('schema cache')
            );

            if (isColumnError) {
                console.warn(`Column is_active missing on ${tableName}, retrying create without it.`);
                delete payload.is_active;
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;

                res.status(201).json({
                    success: true,
                    data,
                    message: 'Item created successfully (fallback)'
                });
                return;
            }
            throw dbError;
        }
    } catch (error: any) {
        console.error(`[ERROR] Failed to create ${req.params.category} item:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create item'
        });
    }
};

/**
 * PUT /api/crm/sales-settings/:category/:id
 * Update an item
 */
export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, id } = req.params;
        const { name, is_active } = req.body;
        const tableName = TABLE_MAP[category];

        if (!tableName) {
            res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
            return;
        }

        const payload: any = {};
        if (name !== undefined) payload.name = name;
        if (is_active !== undefined) payload.is_active = is_active;

        try {
            const { data, error } = await supabaseAdmin
                .from(tableName)
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data,
                message: 'Item updated successfully'
            });
        } catch (dbError: any) {
            // Check if error is due to missing is_active column
            const isColumnError = dbError.message && (
                dbError.message.includes('is_active') ||
                dbError.message.includes('column') ||
                dbError.message.includes('schema cache')
            );

            if (isColumnError && payload.is_active !== undefined) {
                console.warn(`Column is_active missing on ${tableName}, retrying update without it.`);
                delete payload.is_active;
                const { data, error } = await supabaseAdmin
                    .from(tableName)
                    .update(payload)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                res.json({
                    success: true,
                    data,
                    message: 'Item updated successfully (fallback)'
                });
                return;
            }
            throw dbError;
        }
    } catch (error: any) {
        console.error(`Failed to update ${req.params.category} item:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update item'
        });
    }
};

/**
 * DELETE /api/crm/sales-settings/:category/:id
 * Delete (soft delete) an item
 */
export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, id } = req.params;
        const tableName = TABLE_MAP[category];

        if (!tableName) {
            res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
            return;
        }

        try {
            // We'll perform a soft delete by setting is_active = false
            const { error } = await supabaseAdmin
                .from(tableName)
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Item deleted successfully'
            });
            return;
        } catch (dbError: any) {
            const isColumnError = dbError.message && (
                dbError.message.includes('is_active') ||
                dbError.message.includes('column') ||
                dbError.message.includes('table') ||
                dbError.message.includes('schema cache')
            );

            if (isColumnError) {
                console.warn(`Column is_active missing on ${tableName}, performing hard delete.`);
                const { error } = await supabaseAdmin
                    .from(tableName)
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                res.json({
                    success: true,
                    message: 'Item deleted successfully (hard delete)'
                });
                return;
            }
            throw dbError;
        }
    } catch (error: any) {
        console.error(`Failed to delete ${req.params.category} item:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete item'
        });
    }
};
