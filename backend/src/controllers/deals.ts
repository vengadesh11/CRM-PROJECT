import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

export const getAllDeals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { search } = req.query;

        let query = supabaseAdmin
            .from('deals')
            .select(`
                *,
                brand_data:brands(name),
                source_data:lead_sources(name),
                service_data:service_required(name)
            `)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error('Failed to fetch deals:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch deals' });
    }
};

export const getDealById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('deals')
            .select(`
                *,
                brand_data:brands(name),
                source_data:lead_sources(name),
                service_data:service_required(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Deal not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Failed to fetch deal:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch deal' });
    }
};

export const createDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const dealData = {
            user_id: req.user?.id,
            cif: req.body.cif || null,
            email: req.body.email || null,
            name: req.body.name || req.body.title || null,
            contact_number: req.body.contact_number || req.body.contactNo || req.body.phone || null,
            company_name: req.body.company_name || req.body.company || null,
            lead_source: req.body.lead_source || null,
            brand: req.body.brand || null,
            service: req.body.service || null,
            service_amount: req.body.service_amount || req.body.value || null,
            service_closed: req.body.service_closed || false,
            payment_status: req.body.payment_status || null,
            deal_date: req.body.deal_date || new Date().toISOString().split('T')[0],
            closing_date: req.body.closing_date || req.body.expected_close_date || null,
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('deals')
            .insert([dealData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data, message: 'Deal created successfully' });
    } catch (error: any) {
        console.error('Failed to create deal:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create deal' });
    }
};

export const updateDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = {
            cif: req.body.cif || null,
            email: req.body.email || null,
            name: req.body.name || req.body.title || null,
            contact_number: req.body.contact_number || req.body.contactNo || req.body.phone || null,
            company_name: req.body.company_name || req.body.company || null,
            lead_source: req.body.lead_source || null,
            brand: req.body.brand || null,
            service: req.body.service || null,
            service_amount: req.body.service_amount || req.body.value || null,
            service_closed: req.body.service_closed || false,
            payment_status: req.body.payment_status || null,
            deal_date: req.body.deal_date || null,
            closing_date: req.body.closing_date || req.body.expected_close_date || null,
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('deals')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Deal not found' });
            return;
        }

        res.json({ success: true, data, message: 'Deal updated successfully' });
    } catch (error: any) {
        console.error('Failed to update deal:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update deal' });
    }
};

export const deleteDeal = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin.from('deals').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete deal:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete deal' });
    }
};
