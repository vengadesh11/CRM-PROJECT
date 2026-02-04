import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

/**
 * GET /api/crm/leads
 * Get all leads with optional filtering
 */
export const getAllLeads = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, source, search } = req.query;

        let query = supabaseAdmin
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }
        if (source) {
            query = query.eq('lead_source', source);
        }
        if (search) {
            query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%,mobile_number.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error('Failed to fetch leads:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch leads'
        });
    }
};

/**
 * GET /api/crm/leads/:id
 * Get a single lead by ID
 */
export const getLeadById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
            return;
        }

        res.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Failed to fetch lead:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch lead'
        });
    }
};

/**
 * POST /api/crm/leads
 * Create a new lead
 */
export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const leadData = {
            user_id: req.user?.id,
            company_name: req.body.company_name || req.body.company || req.body.name || null,
            mobile_number: req.body.mobile_number || req.body.mobile || req.body.phone || null,
            email: req.body.email || null,
            lead_source: req.body.lead_source || req.body.source || null,
            status: req.body.status || 'new',
            brand_id: req.body.brand_id || null,
            lead_owner_id: req.body.lead_owner_id || null,
            lead_qualification_id: req.body.lead_qualification_id || null,
            service_required_id: req.body.service_required_id || null,
            closing_cycle: req.body.closing_cycle || req.body.closingCycle || null,
            expected_closing: req.body.expected_closing || req.body.expected_close_date || req.body.closingDate || null,
            remarks: req.body.remarks || null,
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('leads')
            .insert([leadData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Lead created successfully'
        });
    } catch (error: any) {
        console.error('Failed to create lead:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create lead'
        });
    }
};

/**
 * PUT /api/crm/leads/:id
 * Update an existing lead
 */
export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = {
            company_name: req.body.company_name || req.body.company || req.body.name || null,
            mobile_number: req.body.mobile_number || req.body.mobile || req.body.phone || null,
            email: req.body.email || null,
            lead_source: req.body.lead_source || req.body.source || null,
            status: req.body.status,
            brand_id: req.body.brand_id || null,
            lead_owner_id: req.body.lead_owner_id || null,
            lead_qualification_id: req.body.lead_qualification_id || null,
            service_required_id: req.body.service_required_id || null,
            closing_cycle: req.body.closing_cycle || req.body.closingCycle || null,
            expected_closing: req.body.expected_closing || req.body.expected_close_date || req.body.closingDate || null,
            remarks: req.body.remarks || null,
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
            return;
        }

        res.json({
            success: true,
            data,
            message: 'Lead updated successfully'
        });
    } catch (error: any) {
        console.error('Failed to update lead:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update lead'
        });
    }
};

/**
 * DELETE /api/crm/leads/:id
 * Delete a lead
 */
export const deleteLead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error: any) {
        console.error('Failed to delete lead:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete lead'
        });
    }
};
