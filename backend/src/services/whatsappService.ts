import supabaseAdmin from '../config/supabase';

interface WhatsAppMessage {
    messaging_product: 'whatsapp';
    to: string;
    type: 'template' | 'text';
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: any[];
    };
    text?: {
        body: string;
    };
}

export class WhatsAppService {
    private static async getCredentials() {
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('config')
            .eq('provider', 'whatsapp')
            .single();

        const { data: secrets } = await supabaseAdmin
            .from('integration_secrets')
            .select('key_name, encrypted_value')
            .eq('integration_id', integration?.id);

        // In a real app, decrypt unique secrets here. 
        // For now assuming we store them plainly or just need the config map if simplified.
        // However, standard practice is storing tokens in secrets table.
        // Let's assume we pull from a mix for now to match the "config" object strategy if simpler, 
        // but robust way is strictly secrets.

        // Returning a combined object for ease of use
        const secretMap = (secrets || []).reduce((acc: any, curr: any) => {
            acc[curr.key_name] = curr.encrypted_value;
            return acc;
        }, {});

        return {
            phoneNumberId: integration?.config?.phoneNumberId,
            ...secretMap
        };
    }

    static async sendMessage(to: string, content: any) {
        const credentials = await this.getCredentials();
        const { phoneNumberId, accessToken } = credentials;

        if (!phoneNumberId || !accessToken) {
            throw new Error('WhatsApp integration not configured');
        }

        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to,
                ...content
            })
        });

        const data = await response.json();

        // Log the interaction
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('id')
            .eq('provider', 'whatsapp')
            .single();

        if (integration) {
            await supabaseAdmin.from('integration_logs').insert({
                integration_id: integration.id,
                event: 'send_message',
                status: response.ok ? 'success' : 'failed',
                payload: { to, content },
                response: data
            });
        }

        return data;
    }

    static verifyWebhook(mode: string | null, token: string | null, challenge: string | null) {
        // In reality, you'd fetch the verify token from DB, but often it's a fixed env var or 
        // strictly compared against what was saved. 
        // For dynamic verification, we need to fetch the stored verify token.
        return { mode, token, challenge };
    }

    static async handleWebhook(body: any) {
        // Log webhook payload
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('id')
            .eq('provider', 'whatsapp')
            .single();

        if (integration) {
            await supabaseAdmin.from('integration_logs').insert({
                integration_id: integration.id,
                event: 'webhook_received',
                status: 'success',
                payload: body,
                response: { processed: true }
            });
        }

        // Process messages (simplified)
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.value && change.value.messages) {
                        // Handle incoming messages logic here
                        // e.g., emit socket event, save to DB, trigger auto-reply
                    }
                }
            }
        }
    }
}
