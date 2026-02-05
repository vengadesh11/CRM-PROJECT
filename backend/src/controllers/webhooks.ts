import { Request, Response } from 'express';
import { WebhookService } from '../services/webhookService';

export const getAllEndpoints = async (_req: Request, res: Response) => {
    try {
        const { data, error } = await WebhookService.getEndpoints();

        if (error) throw error;

        return res.json({ success: true, data: data || [] });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const createEndpoint = async (req: Request, res: Response) => {
    try {
        const { url, events, description } = req.body;
        const authReq = req as any;
        const userId = authReq.user?.id;

        if (!url || !events || !Array.isArray(events)) {
            return res.status(400).json({ success: false, error: 'URL and events array are required' });
        }

        const { data, error } = await WebhookService.createEndpoint(url, events, description, userId);

        if (error) throw error;

        return res.status(201).json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteEndpoint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { supabaseAdmin } = require('../config/supabase'); // Or import at top if used frequently, sticking to existing style

        const { error } = await supabaseAdmin.from('webhook_endpoints').delete().eq('id', id);

        if (error) throw error;

        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const testDispatch = async (req: Request, res: Response) => {
    try {
        const { event, data } = req.body;

        if (!event) return res.status(400).json({ success: false, error: 'Event name is required' });

        // Trigger generic dispatch
        await WebhookService.dispatch(event, data || { test: true, time: new Date() });

        return res.json({ success: true, message: 'Test event dispatched' });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
    return WebhookService.handleStripeWebhook(req, res);
};
