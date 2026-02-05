import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * POST /api/crm/subscriptions
 * Persist a subscription request coming from landing page.
 */
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = {
            plan_name: req.body.plan_name,
            company_name: req.body.company_name || null,
            contact_name: req.body.contact_name || null,
            email: req.body.email,
            phone: req.body.phone || null,
            message: req.body.message || null,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('subscription_requests')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
            message: 'Subscription request recorded'
        });
    } catch (error: any) {
        console.error('Failed to create subscription:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create subscription request'
        });
    }
};
