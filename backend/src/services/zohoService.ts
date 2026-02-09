import supabaseAdmin from '../config/supabase';
import { IntegrationService } from './integrationService';
import { WebhookService } from './webhookService';

const MODULE_NAME = 'Leads';
const ZOHO_BATCH_SIZE = 200;

export class ZohoService {
    static provider = 'zoho';

    static async getIntegrationRecord() {
        const { data, error } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('provider', this.provider)
            .limit(1)
            .single();

        if (error) throw error;
        if (!data) throw new Error('Zoho integration is not configured.');
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

    static async fetchZohoLeads(apiBase: string, accessToken: string, pageToken?: string) {
        const url = new URL(`${apiBase}/crm/v2/${MODULE_NAME}`);
        url.searchParams.set('per_page', ZOHO_BATCH_SIZE.toString());
        if (pageToken) url.searchParams.set('page', pageToken);

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Zoho API error ${response.status}: ${body}`);
        }

        const payload = await response.json();
        return {
            data: payload.data || [],
            nextPage: payload.info?.next_page?.page
        };
    }

    static async syncLeads() {
        const integration = await this.getIntegrationRecord();
        const apiBase = integration.config?.baseUrl;
        const accessToken = await this.getSecret(integration.id, 'zoho_access_token');

        if (!apiBase || !accessToken) {
            throw new Error('Configure Zoho base URL and access token in integration settings.');
        }

        const summary: Array<{ batch: number; count: number }> = [];
        let nextPage: string | undefined;
        let batch = 1;

        do {
            const response = await this.fetchZohoLeads(apiBase, accessToken, nextPage);
            summary.push({ batch, count: response.data.length });

            await IntegrationService.logExecution(
                integration.id,
                'zoho.opensync',
                'success',
                { batch, records: response.data.length },
                {}
            );

            batch += 1;
            nextPage = response.nextPage;
        } while (nextPage);

        const now = new Date().toISOString();
        await IntegrationService.updateIntegration(integration.id, {
            config: {
                ...integration.config,
                zoho_last_sync_at: now
            }
        });

        await IntegrationService.logExecution(
            integration.id,
            'zoho.sync',
            'success',
            { summary },
            { syncedAt: now }
        );

        return { summary, syncedAt: now };
    }

    static async getStatus() {
        const integration = await this.getIntegrationRecord();
        const logsResult = await IntegrationService.getLogs(integration.id, 1);
        return {
            lastSyncAt: integration.config?.zoho_last_sync_at || null,
            latestLog: logsResult?.data?.[0] || null
        };
    }

    static async handleWebhook(payload: any) {
        const integration = await this.getIntegrationRecord();
        await IntegrationService.logExecution(
            integration.id,
            'zoho.webhook',
            'success',
            payload,
            {}
        );
        await WebhookService.dispatch('zoho.webhook', payload);
        return { success: true };
    }
}
