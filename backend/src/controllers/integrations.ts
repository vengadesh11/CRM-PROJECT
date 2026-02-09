import { Request, Response } from 'express';
import { IntegrationService } from '../services/integrationService';
import supabaseAdmin from '../config/supabase';

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
        console.error('Failed to update integration:', error);
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

export const setIntegrationSecret = async (req: Request, res: Response) => {
    try {
        const { provider } = req.params;
        const { keyName, secretValue } = req.body as { keyName?: string; secretValue?: string };

        if (!provider) {
            return res.status(400).json({ success: false, error: 'Provider is required' });
        }
        if (!keyName || !secretValue) {
            return res.status(400).json({ success: false, error: 'keyName and secretValue are required' });
        }

        const { data: integration, error: integrationError } = await supabaseAdmin
            .from('integrations')
            .select('id')
            .eq('provider', provider)
            .limit(1)
            .single();

        if (integrationError || !integration) {
            return res.status(404).json({ success: false, error: 'Integration not found for provider' });
        }

        const { error } = await IntegrationService.setIntegrationSecret(integration.id, keyName, secretValue);

        if (error) {
            throw error;
        }

        return res.json({ success: true });
    } catch (error: any) {
        console.error('Failed to set integration secret:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to store secret' });
    }
};
