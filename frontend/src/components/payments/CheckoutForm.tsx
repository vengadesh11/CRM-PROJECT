import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Button from '../ui/Button';

interface CheckoutFormProps {
    redirectUrl?: string;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ redirectUrl }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Make sure to change this to your payment completion page
                return_url: redirectUrl || window.location.origin + '/dashboard',
            },
        });

        if (error) {
            // This point will only be reached if there is an immediate error when
            // confirming the payment. Show error to your customer (e.g., payment details incomplete)
            setErrorMessage(error.message || 'An unexpected error occurred.');
        } else {
            // Your customer will be redirected to your `return_url`. For some payment
            // methods like iDEAL, your customer will be redirected to an intermediate
            // site first to authorize the payment, then redirected to the `return_url`.
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {errorMessage && <div className="text-red-500 mt-2 text-sm">{errorMessage}</div>}
            <div className="mt-4">
                <Button type="submit" disabled={!stripe || loading} className="w-full">
                    {loading ? 'Processing...' : 'Pay Now'}
                </Button>
            </div>
        </form>
    );
};

export default CheckoutForm;
