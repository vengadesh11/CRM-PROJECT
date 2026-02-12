
import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsappService';
import supabaseAdmin from '../config/supabase';

/**
 * GET /api/crm/integrations/whatsapp/webhook
 * Verifies the webhook subscription
 */
export const verifyWebhook = async (req: Request, res: Response) => {
    try {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        // Fetch the stored verify token from the database
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('config')
            .eq('provider', 'whatsapp')
            .single();

        const storedVerifyToken = integration?.config?.verifyToken;

        if (mode && token) {
            if (mode === 'subscribe' && token === storedVerifyToken) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.sendStatus(403);
            }
        }

        return res.sendStatus(400);

    } catch (error) {
        console.error('Error verifying webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * POST /api/crm/integrations/whatsapp/webhook
 * Receive webhook events
 */
export const receiveWebhook = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        console.log('Received webhook:', JSON.stringify(body, null, 2));

        await WhatsAppService.handleWebhook(body);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(500);
    }
};

/**
 * POST /api/crm/integrations/whatsapp/send
 * Send a message
 */
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { to, content } = req.body;
        const result = await WhatsAppService.sendMessage(to, content);
        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
