import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.warn('STRIPE_SECRET_KEY is not defined in .env');
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
    // Using 2024-12-18.acacia as expected by installed types
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
});
