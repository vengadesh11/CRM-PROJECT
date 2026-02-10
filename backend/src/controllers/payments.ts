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

        // Use authenticated user's email if available, fallback to body (for flex, but auth is better)
        const email = (req as any).user?.email || customer_email;
        if (!email) {
            return res.status(400).json({ success: false, error: 'User email is required' });
        }

        const stripeCustomerId = await getOrCreateStripeCustomer(email, customer_name);

        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent as any;

        return res.json({
            success: true,
            subscriptionId: subscription.id,
            clientSecret: paymentIntent?.client_secret || null,
        });

    } catch (error: any) {
        console.error('Create Subscription Error:', error);

        // Handle Stripe specific errors with better messaging
        if (error.type?.startsWith('Stripe')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }

        return res.status(500).json({ success: false, error: 'Internal server error while creating subscription' });
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

export const listPaymentMethods = async (req: Request, res: Response) => {
    try {
        const { customer_email } = req.query;
        if (!customer_email) throw new Error('Customer email is required');

        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email as string);
        const paymentMethods = await stripe.paymentMethods.list({
            customer: stripeCustomerId,
            type: 'card',
        });

        // Get default payment method from customer
        const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
        const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

        res.json({
            success: true,
            data: paymentMethods.data,
            defaultPaymentMethodId
        });
    } catch (error: any) {
        console.error('List Payment Methods Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createSetupIntent = async (req: Request, res: Response) => {
    try {
        const { customer_email } = req.body;
        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email);

        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
        });

        res.json({
            success: true,
            clientSecret: setupIntent.client_secret
        });
    } catch (error: any) {
        console.error('Create SetupIntent Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
    try {
        const { customer_email, paymentMethodId } = req.body;
        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email);

        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('Set Default Payment Method Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const detachPaymentMethod = async (req: Request, res: Response) => {
    try {
        const { paymentMethodId } = req.body;
        await stripe.paymentMethods.detach(paymentMethodId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Detach Payment Method Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        const { customer_email } = req.query;
        if (!customer_email) {
            return res.status(400).json({ success: false, error: 'Customer email is required' });
        }

        const stripeCustomerId = await getOrCreateStripeCustomer(customer_email as string);
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
            status: 'all',
            expand: ['data.plan.product']
        });

        if (subscriptions.data.length === 0) {
            return res.json({ success: true, data: null });
        }

        const sub = subscriptions.data[0] as any;
        return res.json({
            success: true,
            data: {
                id: sub.id,
                status: sub.status,
                current_period_end: sub.current_period_end,
                plan: {
                    id: sub.plan?.id,
                    name: sub.plan?.product?.name || 'Active Plan',
                    amount: sub.plan?.amount,
                    currency: sub.plan?.currency
                }
            }
        });
    } catch (error: any) {
        console.error('Get Subscription Status Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
