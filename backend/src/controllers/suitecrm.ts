import { Request, Response } from 'express';
import { SuiteCRMService } from '../services/suitecrmService';

export const triggerSync = async (_req: Request, res: Response) => {
    try {
        const result = await SuiteCRMService.syncAll();
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('SuiteCRM sync error:', error);
        res.status(500).json({ success: false, error: error.message || 'SuiteCRM sync failed' });
    }
};

export const getStatus = async (_req: Request, res: Response) => {
    try {
        const status = await SuiteCRMService.getStatus();
        res.json({ success: true, data: status });
    } catch (error: any) {
        console.error('SuiteCRM status error:', error);
        res.status(500).json({ success: false, error: error.message || 'Could not read status' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        await SuiteCRMService.handleWebhook(req.body);
        res.json({ success: true });
    } catch (error: any) {
        console.error('SuiteCRM webhook handler failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Webhook handling failed' });
    }
};
