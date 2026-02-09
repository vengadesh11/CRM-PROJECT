import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';

export const getAllCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { search, type } = req.query;

        let query = supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (type) query = query.eq('type', type);
        if (search) {
            query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%,work_phone.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        console.error('Failed to fetch customers:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch customers' });
    }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('customers')
            .select('*, deals(id, title, amount, status)')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Failed to fetch customer:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch customer' });
    }
};

const getNextCif = async (): Promise<string> => {
    try {
        const { data, error } = await supabaseAdmin
            .from('customers')
            .select('cif')
            .not('cif', 'is', null)
            .neq('cif', '');

        if (error) throw error;

        // Filter for numeric-only strings and find the maximum
        const numericCifs = (data || [])
            .map(item => parseInt(item.cif))
            .filter(n => !isNaN(n))
            .sort((a, b) => b - a);

        if (numericCifs.length === 0) {
            return '1001';
        }

        return (numericCifs[0] + 1).toString();
    } catch (error) {
        console.error('Error in getNextCif:', error);
        return '1001';
    }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const cif = await getNextCif();
        const customerData = {
            cif,
            type: req.body.type || req.body.customer_type || 'business',
            salutation: req.body.salutation || null,
            first_name: req.body.first_name || null,
            last_name: req.body.last_name || null,
            company_name: req.body.company_name || req.body.name || null,
            display_name: req.body.display_name || req.body.name || req.body.company_name || null,
            email: req.body.email || null,
            work_phone: req.body.work_phone || null,
            mobile: req.body.mobile || req.body.phone || null,
            currency: req.body.currency || 'AED',
            language: req.body.language || 'en',
            billing_address: req.body.billing_address || null,
            shipping_address: req.body.shipping_address || null,
            remarks: req.body.remarks || req.body.notes || null,
            entity_type: req.body.entity_type || null,
            entity_sub_type: req.body.entity_sub_type || null,
            incorporation_date: req.body.incorporation_date || null,
            trade_license_authority: req.body.trade_license_authority || null,
            trade_license_number: req.body.trade_license_number || null,
            trade_license_issue_date: req.body.trade_license_issue_date || null,
            trade_license_expiry_date: req.body.trade_license_expiry_date || null,
            business_activity: req.body.business_activity || null,
            is_freezone: req.body.is_freezone || false,
            freezone_name: req.body.freezone_name || null,
            shareholders: req.body.shareholders || [],
            authorised_signatories: req.body.authorised_signatories || null,
            share_capital: req.body.share_capital || null,
            tax_treatment: req.body.tax_treatment || null,
            trn: req.body.trn || null,
            vat_registered_date: req.body.vat_registered_date || null,
            first_vat_filing_period: req.body.first_vat_filing_period || null,
            vat_filing_due_date: req.body.vat_filing_due_date || null,
            vat_reporting_period: req.body.vat_reporting_period || null,
            corporate_tax_treatment: req.body.corporate_tax_treatment || null,
            corporate_tax_trn: req.body.corporate_tax_trn || null,
            corporate_tax_registered_date: req.body.corporate_tax_registered_date || null,
            corporate_tax_period: req.body.corporate_tax_period || null,
            first_corporate_tax_period_start: req.body.first_corporate_tax_period_start || null,
            first_corporate_tax_period_end: req.body.first_corporate_tax_period_end || null,
            corporate_tax_filing_due_date: req.body.corporate_tax_filing_due_date || null,
            business_registration_number: req.body.business_registration_number || null,
            place_of_supply: req.body.place_of_supply || null,
            opening_balance: req.body.opening_balance || 0,
            payment_terms: req.body.payment_terms || null,
            owner_id: req.user?.id,
            portal_access: req.body.portal_access || false,
            contact_persons: req.body.contact_persons || [],
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert([customerData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data, message: 'Customer created successfully' });
    } catch (error: any) {
        console.error('Failed to create customer:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create customer' });
    }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = {
            type: req.body.type || req.body.customer_type || 'business',
            salutation: req.body.salutation || null,
            first_name: req.body.first_name || null,
            last_name: req.body.last_name || null,
            company_name: req.body.company_name || req.body.name || null,
            display_name: req.body.display_name || req.body.name || req.body.company_name || null,
            email: req.body.email || null,
            work_phone: req.body.work_phone || null,
            mobile: req.body.mobile || req.body.phone || null,
            currency: req.body.currency || 'AED',
            language: req.body.language || 'en',
            billing_address: req.body.billing_address || null,
            shipping_address: req.body.shipping_address || null,
            remarks: req.body.remarks || req.body.notes || null,
            entity_type: req.body.entity_type || null,
            entity_sub_type: req.body.entity_sub_type || null,
            incorporation_date: req.body.incorporation_date || null,
            trade_license_authority: req.body.trade_license_authority || null,
            trade_license_number: req.body.trade_license_number || null,
            trade_license_issue_date: req.body.trade_license_issue_date || null,
            trade_license_expiry_date: req.body.trade_license_expiry_date || null,
            business_activity: req.body.business_activity || null,
            is_freezone: req.body.is_freezone || false,
            freezone_name: req.body.freezone_name || null,
            shareholders: req.body.shareholders || [],
            authorised_signatories: req.body.authorised_signatories || null,
            share_capital: req.body.share_capital || null,
            tax_treatment: req.body.tax_treatment || null,
            trn: req.body.trn || null,
            vat_registered_date: req.body.vat_registered_date || null,
            first_vat_filing_period: req.body.first_vat_filing_period || null,
            vat_filing_due_date: req.body.vat_filing_due_date || null,
            vat_reporting_period: req.body.vat_reporting_period || null,
            corporate_tax_treatment: req.body.corporate_tax_treatment || null,
            corporate_tax_trn: req.body.corporate_tax_trn || null,
            corporate_tax_registered_date: req.body.corporate_tax_registered_date || null,
            corporate_tax_period: req.body.corporate_tax_period || null,
            first_corporate_tax_period_start: req.body.first_corporate_tax_period_start || null,
            first_corporate_tax_period_end: req.body.first_corporate_tax_period_end || null,
            corporate_tax_filing_due_date: req.body.corporate_tax_filing_due_date || null,
            business_registration_number: req.body.business_registration_number || null,
            place_of_supply: req.body.place_of_supply || null,
            opening_balance: req.body.opening_balance || 0,
            payment_terms: req.body.payment_terms || null,
            portal_access: req.body.portal_access || false,
            contact_persons: req.body.contact_persons || [],
            custom_data: req.body.custom_data || {}
        };

        const { data, error } = await supabaseAdmin
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ success: false, error: 'Customer not found' });
            return;
        }

        res.json({ success: true, data, message: 'Customer updated successfully' });
    } catch (error: any) {
        console.error('Failed to update customer:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update customer' });
    }
};

/**
 * POST /api/crm/customers/bulk-delete
 * Bulk delete customers
 */
export const bulkDeleteCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid or empty IDs array'
            });
            return;
        }

        const { error, count } = await supabaseAdmin
            .from('customers')
            .delete({ count: 'exact' })
            .in('id', ids);

        if (error) throw error;

        res.json({
            success: true,
            message: `${count} customers deleted successfully`,
            count
        });
    } catch (error: any) {
        console.error('Failed to bulk delete customers:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to bulk delete customers'
        });
    }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin.from('customers').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
        console.error('Failed to delete customer:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete customer' });
    }
};
