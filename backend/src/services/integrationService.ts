import supabaseAdmin from '../config/supabase';

export class IntegrationService {
    /**
     * Get all integrations, optionally filtering by active status
     */
    static async getIntegrations(onlyActive = false) {
        let query = supabaseAdmin
            .from('integrations')
            .select('id, name, provider, description, is_active, config, triggers, updated_at')
            .order('name');

        if (onlyActive) {
            query = query.eq('is_active', true);
        }

        return await query;
    }

    /**
     * Get integration by provider
     */
    static async getIntegrationByProvider(provider: string) {
        return await supabaseAdmin
            .from('integrations')
            .select('*')
            .eq('provider', provider)
            .single();
    }

    /**
     * Update integration configuration
     */
    static async updateIntegration(id: string, updates: { is_active?: boolean; config?: any; triggers?: string[] }) {
        return await supabaseAdmin
            .from('integrations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
    }

    /**
     * Securely set an API key/secret for an integration
     * (In a real app, you might encrypt this before storing)
     */
    static async setIntegrationSecret(integrationId: string, keyName: string, value: string) {
        // Basic upsert logic
        const { error } = await supabaseAdmin
            .from('integration_secrets')
            .upsert({
                integration_id: integrationId,
                key_name: keyName,
                encrypted_value: value // TODO: Add server-side encryption here (e.g. AES-256)
            }, { onConflict: 'integration_id,key_name' });

        return { error };
    }

    /**
     * Log an integration execution result
     */
    static async logExecution(integrationId: string, event: string, status: 'success' | 'failed', payload: any, response: any) {
        return await supabaseAdmin.from('integration_logs').insert({
            integration_id: integrationId,
            event,
            status,
            payload,
            response
        });
    }

    /**
     * Get logs for a specific integration
     */
    static async getLogs(integrationId: string, limit = 50) {
        return await supabaseAdmin
            .from('integration_logs')
            .select('*')
            .eq('integration_id', integrationId)
            .order('created_at', { ascending: false })
            .limit(limit);
    }
}
