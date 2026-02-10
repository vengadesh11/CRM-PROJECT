import supabaseAdmin from '../config/supabase';
import { IntegrationService } from './integrationService';
import { WebhookService } from './webhookService';

interface SuiteCrmModuleConfig {
    moduleName: string;
    eventName: string;
    description: string;
}

const MODULES: SuiteCrmModuleConfig[] = [
    { moduleName: 'Leads', eventName: 'suitecrm.lead.synced', description: 'Leads mirrored from SuiteCRM' },
    { moduleName: 'Opportunities', eventName: 'suitecrm.deal.synced', description: 'Deals mirrored from SuiteCRM' },
];

const DEFAULT_FIELDS = ['id', 'name', 'email', 'date_modified', 'assigned_user_id', 'status'];

export class SuiteCRMService {
    static provider = 'suitecrm';

    static async getIntegrationRecord() {
        const { data, error } = await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('provider', this.provider)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching ${this.provider} integration:`, error);
            throw error;
        }

        return data;
    }

    static async getSecret(integrationId: string, keyName: string): Promise<string | null> {
        const { data, error } = await supabaseAdmin
            .from('integration_secrets')
            .select('encrypted_value')
            .eq('integration_id', integrationId)
            .eq('key_name', keyName)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data?.encrypted_value || null;
    }

    static async fetchModuleRecords(baseUrl: string, moduleName: string, token: string, since?: string, offset = 0) {
        const url = new URL(`${baseUrl.replace(/\/$/, '')}/api/${moduleName}`);
        url.searchParams.set('max_num', '250');
        url.searchParams.set('offset', offset.toString());
        url.searchParams.set('fields', DEFAULT_FIELDS.join(','));
        if (since) {
            url.searchParams.set('filter[0][date_modified][$gt]', since);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(`SuiteCRM responded with ${response.status}: ${message}`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload.records)) {
            return [];
        }

        return payload.records;
    }

    static async syncAll() {
        const integration = await this.getIntegrationRecord();
        const baseUrl = integration.config?.baseUrl;
        if (!baseUrl) {
            throw new Error('Please configure the SuiteCRM base URL in the integration settings.');
        }

        const token = await this.getSecret(integration.id, 'suitecrm_api_key');
        if (!token) {
            throw new Error('SuiteCRM API key secret is missing. Save it via the integration secrets screen.');
        }

        const lastSync = integration.config?.last_sync_at;
        const results: Array<{ module: string; count: number }> = [];

        // Pagination Config
        const MAX_BATCH_SIZE = 250;

        for (const moduleConfig of MODULES) {
            let offset = 0;
            let totalModuleRecords = 0;

            try {
                while (true) {
                    // Fetch batch
                    const records = await this.fetchModuleRecords(baseUrl, moduleConfig.moduleName, token, lastSync, offset);

                    if (!records || records.length === 0) {
                        break;
                    }

                    totalModuleRecords += records.length;
                    offset += records.length;

                    // Log batch success (optional, or just log final)
                    await IntegrationService.logExecution(
                        integration.id,
                        moduleConfig.eventName,
                        'success',
                        { baseUrl, since: lastSync, batchCount: records.length, offset },
                        { summary: `Fetched ${records.length} records (Offset: ${offset})` }
                    );

                    // If we got fewer than requested, we are done
                    if (records.length < MAX_BATCH_SIZE) {
                        break;
                    }

                    // Safety break loop to prevent infinite loop during dev
                    if (offset > 10000) break;
                }

                results.push({ module: moduleConfig.moduleName, count: totalModuleRecords });

            } catch (error: any) {
                await IntegrationService.logExecution(
                    integration.id,
                    moduleConfig.eventName,
                    'failed',
                    { module: moduleConfig.moduleName, error: error?.message },
                    {}
                );
                throw error;
            }
        }

        const now = new Date().toISOString();
        await IntegrationService.updateIntegration(integration.id, {
            config: {
                ...integration.config,
                last_sync_at: now
            }
        });

        await IntegrationService.logExecution(
            integration.id,
            'suitecrm.sync',
            'success',
            results,
            { syncedAt: now }
        );

        return { counts: results, syncedAt: now };
    }

    static async getStatus() {
        const integration = await this.getIntegrationRecord();
        if (!integration) {
            return { lastSyncAt: null, latestLog: null, isConfigured: false };
        }
        const logsResult = await IntegrationService.getLogs(integration.id, 1);
        return {
            lastSyncAt: integration.config?.last_sync_at || null,
            latestLog: logsResult?.data?.[0] || null,
            isConfigured: true
        };
    }

    static async handleWebhook(payload: any) {
        const integration = await this.getIntegrationRecord();
        await IntegrationService.logExecution(
            integration.id,
            'suitecrm.webhook',
            'success',
            payload,
            {}
        );
        await WebhookService.dispatch('suitecrm.webhook', payload);
        return { success: true };
    }
}
