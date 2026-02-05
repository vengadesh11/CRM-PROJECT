import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import supabaseAdmin from '../config/supabase';

// Helper to get or create a Stripe Customer
const getOrCreateStripeCustomer = async (email: string, name?: string) => {
    // Check if customer already has a stripe_id in our DB
    const { data: customerData, error: _error } = await supabaseAdmin
        .from('customers')
        .select('id, stripe_customer_id')
        .eq('email', email)
        .single();

    if (customerData?.stripe_customer_id) {
        return customerData.stripe_customer_id;
    }

    // Check if exists in Stripe by email
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
        const stripeCustomerId = existingCustomers.data[0].id;
        // Update our DB
        if (customerData) {
            await supabaseAdmin
                .from('customers')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', customerData.id);
        }
        return stripeCustomerId;
    }

    // Create new Stripe Customer
    const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: {
            crm_customer_id: customerData?.id || ''
        }
    });

    // Update our DB
    if (customerData) {
        await supabaseAdmin
            .from('customers')
            .update({ stripe_customer_id: newCustomer.id })
            .eq('id', customerData.id);
    }

    return newCustomer.id;
};

export const createPaymentIntent = async (req: Request, res: Response) => {
    try {
        const { amount, currency = 'usd', customer_email, customer_name, description } = req.body;

        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email, customer_name);

        const paymentIntent = await stripe.paymentIntents.create({
            amount, // in cents
            currency,
            customer: stripeCustomerId,
            description,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                customer_email
            }
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error: any) {
        console.error('Create PaymentIntent Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const { priceId, customer_email, customer_name } = req.body;

        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email, customer_name);

        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        const invoice = subscription.latest_invoice as any; // Cast to any to avoid strict type issues with expansion
        const paymentIntent = invoice.payment_intent as any;

        res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error: any) {
        console.error('Create Subscription Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createPortalSession = async (req: Request, res: Response) => {
    try {
        const { customer_email, return_url } = req.body;

        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email);

        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: return_url || 'http://localhost:5173/dashboard',
        });

        res.json({ success: true, url: session.url });
    } catch (error: any) {
        console.error('Create Portal Session Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
