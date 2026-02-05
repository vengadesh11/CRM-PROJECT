import crypto from 'crypto';
import supabaseAdmin from '../config/supabase';
import { stripe } from '../config/stripe';
import { Request, Response } from 'express';

interface WebhookPayload {
    event: string;
    event_id: string;
    occurred_at: string;
    data: any;
}

export class WebhookService {
    /**
     * Calculate HMAC-SHA256 signature for payload verification
     */
    private static generateSignature(payload: any, secret: string): string {
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Dispatch an event to all subscribed webhook endpoints
     */
    static async dispatch(eventName: string, data: any, _actorId?: string) {
        try {
            // 1. Fetch active endpoints subscribed to this event
            const { data: endpoints, error } = await supabaseAdmin
                .from('webhook_endpoints')
                .select('*')
                .eq('is_active', true)
                .contains('events', [eventName]);

            if (error) {
                console.error('Failed to fetch webhook endpoints:', error);
                return;
            }

            if (!endpoints || endpoints.length === 0) return;

            // 2. Prepare payload
            const payload: WebhookPayload = {
                event: eventName,
                event_id: crypto.randomUUID(),
                occurred_at: new Date().toISOString(),
                data
            };

            // 3. Send to each endpoint
            const deliveryPromises = endpoints.map(async (endpoint) => {
                const signature = this.generateSignature(payload, endpoint.secret);
                // const startTime = Date.now();
                let responseStatus = 0;
                let responseBody = '';

                try {
                    const response = await fetch(endpoint.url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-DocuFlow-Event': eventName,
                            'X-DocuFlow-Signature': signature,
                            'X-DocuFlow-Timestamp': payload.occurred_at
                        },
                        body: JSON.stringify(payload)
                    });

                    responseStatus = response.status;
                    responseBody = await response.text();
                } catch (err: any) {
                    responseStatus = 500; // Client error or network failure
                    responseBody = err.message || 'Network Error';
                }

                // 4. Log delivery attempt
                await supabaseAdmin.from('webhook_deliveries').insert({
                    endpoint_id: endpoint.id,
                    event_id: payload.event_id,
                    event_name: eventName,
                    request_payload: payload,
                    response_status: responseStatus,
                    response_body: responseBody.substring(0, 1000), // Truncate large responses
                    attempt: 1,
                    // Simple retry logic could be added here or scheduled via queue
                    next_retry_at: responseStatus >= 200 && responseStatus < 300 ? null : null // TODO: Implement retry schedule
                });
            });

            await Promise.all(deliveryPromises);

        } catch (err) {
            console.error('Error dispatching webhooks:', err);
        }
    }

    /**
     * Get all webhook endpoints
     */
    static async getEndpoints() {
        return await supabaseAdmin
            .from('webhook_endpoints')
            .select('*')
            .order('created_at', { ascending: false });
    }

    /**
     * Create a new webhook endpoint
     */
    static async createEndpoint(url: string, events: string[], description?: string, createdBy?: string) {
        // Auto-generate a strong secret
        const secret = crypto.randomBytes(32).toString('hex');

        return await supabaseAdmin
            .from('webhook_endpoints')
            .insert({
                url,
                events,
                description,
                secret,
                created_by: createdBy
            })
            .select()
            .single();
    }

    /**
     * Handle incoming Stripe webhooks
     */
    static async handleStripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            if (!sig || !endpointSecret) {
                console.error('Missing signature or webhook secret');
                return res.status(400).send('Missing signature or webhook secret');
            }
            event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
        } catch (err: any) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('PaymentIntent was successful!', paymentIntent.id);

                // Lookup customer
                let paymentCustomerId = null;
                if (paymentIntent.customer) {
                    const { data: customer } = await supabaseAdmin
                        .from('customers')
                        .select('id')
                        .eq('stripe_customer_id', paymentIntent.customer)
                        .single();
                    if (customer) paymentCustomerId = customer.id;
                }

                // Update Payments Table
                await supabaseAdmin.from('payments').upsert({
                    stripe_payment_intent_id: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    status: 'succeeded',
                    customer_id: paymentCustomerId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'stripe_payment_intent_id' });
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object as any;

                // Lookup customer
                let subCustomerId = null;
                if (subscription.customer) {
                    const { data: customer } = await supabaseAdmin
                        .from('customers')
                        .select('id')
                        .eq('stripe_customer_id', subscription.customer)
                        .single();
                    if (customer) subCustomerId = customer.id;
                }

                await supabaseAdmin.from('subscriptions').upsert({
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    customer_id: subCustomerId,
                    plan_name: subscription.items?.data[0]?.price?.nickname || 'Standard', // Fallback
                    updated_at: new Date().toISOString()
                }, { onConflict: 'stripe_subscription_id' });
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        return res.json({ received: true });
    }
}
