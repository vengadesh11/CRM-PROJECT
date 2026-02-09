import { Request, Response } from 'express';
import { EspoCrmService } from '../services/espocrmService';

export const triggerSync = async (_req: Request, res: Response) => {
    try {
        const result = await EspoCrmService.sync();
        return res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('EspoCRM sync error:', error);
        return res.status(500).json({ success: false, error: error.message || 'EspoCRM sync failed' });
    }
};

export const getStatus = async (_req: Request, res: Response) => {
    try {
        const status = await EspoCrmService.getStatus();
        return res.json({ success: true, data: status });
    } catch (error: any) {
        console.error('EspoCRM status error:', error);
        return res.status(500).json({ success: false, error: error.message || 'EspoCRM status failed' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        await EspoCrmService.handleWebhook(req.body);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('EspoCRM webhook error:', error);
        return res.status(500).json({ success: false, error: error.message || 'EspoCRM webhook failed' });
    }
};
