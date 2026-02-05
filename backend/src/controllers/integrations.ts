import { Request, Response } from 'express';
import { IntegrationService } from '../services/integrationService';

export const getIntegrations = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;
        const onlyActive = active === 'true';

        const { data, error } = await IntegrationService.getIntegrations(onlyActive);

        if (error) throw error;

        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const updateIntegration = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active, config, triggers, secrets } = req.body;

        // Update main config
        const { data, error } = await IntegrationService.updateIntegration(id, {
            is_active,
            config,
            triggers
        });

        if (error) throw error;

        // Update secrets if provided
        if (secrets && typeof secrets === 'object') {
            for (const [key, value] of Object.entries(secrets)) {
                await IntegrationService.setIntegrationSecret(id, key, value as string);
            }
        }

        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getIntegrationLogs = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;

        const { data, error } = await IntegrationService.getLogs(id, Number(limit) || 50);

        if (error) throw error;

        return res.json({ success: true, data });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
