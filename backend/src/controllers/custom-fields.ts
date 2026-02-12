import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

export const getAllCustomFields = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { module } = req.query;


        let query = supabaseAdmin
            .from('custom_fields')
            .select('*')
            .order('sort_order', { ascending: true });

        if (module) query = query.eq('module', module);

        const { data, error } = await query;
        if (error) throw error;

        // Map DB columns to frontend field names for compatibility
        const mappedData = (data || []).map(field => ({
            ...field,
            field_type: field.type,
            field_order: field.sort_order
        }));

        res.json({ success: true, data: mappedData });
    } catch (error: any) {
        console.error('Failed to fetch custom fields:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch custom fields'
        });
    }
};

export const getCustomFieldById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('custom_fields')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Custom field not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Failed to fetch custom field:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch custom field' });
    }
};

export const createCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const fieldData = {
            ...req.body,
            type: req.body.field_type,
            sort_order: req.body.field_order || 0
        };

        // Remove frontend-specific fields that aren't in the DB
        delete fieldData.field_type;
        delete fieldData.field_order;

        const { data, error } = await supabaseAdmin
            .from('custom_fields')
            .insert([fieldData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data: { ...data, field_type: data.type, field_order: data.sort_order },
            message: 'Custom field created successfully'
        });
    } catch (error: any) {
        console.error('Failed to create custom field:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create custom field' });
    }
};

export const updateCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData: any = {
            ...req.body
        };

        if (req.body.field_type) {
            updateData.type = req.body.field_type;
            delete updateData.field_type;
        }

        if (req.body.field_order !== undefined) {
            updateData.sort_order = req.body.field_order;
            delete updateData.field_order;
        }

        const { data, error } = await supabaseAdmin
            .from('custom_fields')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Custom field not found' });
            return;
        }

        res.json({
            success: true,
            data: { ...data, field_type: data.type, field_order: data.sort_order },
            message: 'Custom field updated successfully'
        });
    } catch (error: any) {
        console.error('Failed to update custom field:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update custom field' });
    }
};

export const deleteCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin.from('custom_fields').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Custom field deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete custom field:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete custom field' });
    }
};
