import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * POST /api/crm/analytics/events
 * Record analytics events emitted from the landing page.
 */
export const trackEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { event_name, metadata } = req.body;
        if (!event_name) {
            res.status(400).json({ success: false, error: 'event_name is required' });
            return;
        }

        const payload = {
            event_name,
            metadata: metadata || {},
            created_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('analytics_events')
            .insert(payload);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Analytics tracking failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to track event'
        });
    }
};
