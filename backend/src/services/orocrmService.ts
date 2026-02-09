import supabaseAdmin from '../config/supabase';
import { IntegrationService } from './integrationService';
import { WebhookService } from './webhookService';

export class OroCrmService {
    static provider = 'orocrm';

    static async getIntegrationRecord() {
        const { data, error } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('provider', this.provider)
            .limit(1)
            .single();
        if (error) throw error;
        if (!data) throw new Error('OroCRM not configured.');
        return data;
    }

    static async getSecret(integrationId: string, keyName: string) {
        const { data, error } = await supabaseAdmin
            .from('integration_secrets')
            .select('encrypted_value')
            .eq('integration_id', integrationId)
            .eq('key_name', keyName)
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.encrypted_value || null;
    }

    static async fetchLeads(apiBase: string, apiKey: string) {
        const url = `${apiBase.replace(/\/$/, '')}/api/lead`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/json'
            }
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`OroCRM ${response.status}: ${text}`);
        }
        return response.json();
    }

    static async sync() {
        const integration = await this.getIntegrationRecord();
        const baseUrl = integration.config?.baseUrl;
        const apiKey = await this.getSecret(integration.id, 'orocrm_api_key');

        if (!baseUrl || !apiKey) {
            throw new Error('OroCRM base URL or API key is missing.');
        }

        const payload = await this.fetchLeads(baseUrl, apiKey);
        const records = Array.isArray(payload.data) ? payload.data : [];

        await IntegrationService.logExecution(
            integration.id,
            'orocrm.sync',
            'success',
            { fetched: records.length },
            {}
        );

        const now = new Date().toISOString();
        await IntegrationService.updateIntegration(integration.id, {
            config: {
                ...integration.config,
                orocrm_last_sync_at: now
            }
        });

        return { count: records.length, syncedAt: now };
    }

    static async getStatus() {
        const integration = await this.getIntegrationRecord();
        const logs = await IntegrationService.getLogs(integration.id, 1);
        return {
            lastSyncAt: integration.config?.orocrm_last_sync_at || null,
            latestLog: logs?.data?.[0] || null
        };
    }

    static async handleWebhook(payload: any) {
        const integration = await this.getIntegrationRecord();
        await IntegrationService.logExecution(
            integration.id,
            'orocrm.webhook',
            'success',
            payload,
            {}
        );
        await WebhookService.dispatch('orocrm.webhook', payload);
        return { success: true };
    }
}
