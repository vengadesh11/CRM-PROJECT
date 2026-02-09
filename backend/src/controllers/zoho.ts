import { Request, Response } from 'express';
import { ZohoService } from '../services/zohoService';

export const triggerSync = async (_req: Request, res: Response) => {
    try {
        const result = await ZohoService.syncLeads();
        return res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Zoho sync failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'Zoho sync error' });
    }
};

export const getStatus = async (_req: Request, res: Response) => {
    try {
        const status = await ZohoService.getStatus();
        return res.json({ success: true, data: status });
    } catch (error: any) {
        console.error('Zoho status failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'Zoho status error' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        await ZohoService.handleWebhook(req.body);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('Zoho webhook error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Zoho webhook failed' });
    }
};
