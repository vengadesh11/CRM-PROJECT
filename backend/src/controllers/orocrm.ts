import { Request, Response } from 'express';
import { OroCrmService } from '../services/orocrmService';

export const triggerSync = async (_req: Request, res: Response) => {
    try {
        const result = await OroCrmService.sync();
        return res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('OroCRM sync failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'OroCRM sync error' });
    }
};

export const getStatus = async (_req: Request, res: Response) => {
    try {
        const status = await OroCrmService.getStatus();
        return res.json({ success: true, data: status });
    } catch (error: any) {
        console.error('OroCRM status failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'OroCRM status error' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        await OroCrmService.handleWebhook(req.body);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('OroCRM webhook error:', error);
        return res.status(500).json({ success: false, error: error.message || 'OroCRM webhook failed' });
    }
};
