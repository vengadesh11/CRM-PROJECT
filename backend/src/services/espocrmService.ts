import supabaseAdmin from '../config/supabase';
import { IntegrationService } from './integrationService';
import { WebhookService } from './webhookService';

const MODULE = 'Leads';
const PAGE_SIZE = 100;

export class EspoCrmService {
    static provider = 'espocrm';

    static async getIntegrationRecord() {
        const { data, error } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('provider', this.provider)
            .limit(1)
            .single();
        if (error) throw error;
        if (!data) throw new Error('EspoCRM integration not configured.');
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

    static async fetchLeads(apiBase: string, accessToken: string, offset = 0) {
        const url = new URL(`${apiBase.replace(/\/$/, '')}/api/v1/${MODULE}`);
        url.searchParams.set('limit', PAGE_SIZE.toString());
        url.searchParams.set('offset', offset.toString());

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`EspoCRM ${response.status}: ${body}`);
        }

        return response.json();
    }

    static async sync() {
        const integration = await this.getIntegrationRecord();
        const apiBase = integration.config?.baseUrl;
        const token = await this.getSecret(integration.id, 'espocrm_token');

        if (!apiBase || !token) {
            throw new Error('EspoCRM base URL or token missing.');
        }

        const records: any[] = [];
        let offset = 0;
        let batch = 1;

        while (true) {
            const payload = await this.fetchLeads(apiBase, token, offset);
            if (!Array.isArray(payload.records) || payload.records.length === 0) break;
            records.push(...payload.records);
            await IntegrationService.logExecution(
                integration.id,
                'espocrm.batch',
                'success',
                { batch, count: payload.records.length },
                {}
            );
            if (payload.records.length < PAGE_SIZE) break;
            offset += PAGE_SIZE;
            batch += 1;
        }

        const now = new Date().toISOString();
        await IntegrationService.updateIntegration(integration.id, {
            config: {
                ...integration.config,
                espocrm_last_sync_at: now
            }
        });

        await IntegrationService.logExecution(
            integration.id,
            'espocrm.sync',
            'success',
            { fetched: records.length },
            { syncedAt: now }
        );

        return { count: records.length, syncedAt: now };
    }

    static async getStatus() {
        const integration = await this.getIntegrationRecord();
        const logs = await IntegrationService.getLogs(integration.id, 1);
        return {
            lastSyncAt: integration.config?.espocrm_last_sync_at || null,
            latestLog: logs?.data?.[0] || null
        };
    }

    static async handleWebhook(payload: any) {
        const integration = await this.getIntegrationRecord();
        await IntegrationService.logExecution(
            integration.id,
            'espocrm.webhook',
            'success',
            payload,
            {}
        );
        await WebhookService.dispatch('espocrm.webhook', payload);
        return { success: true };
    }
}
