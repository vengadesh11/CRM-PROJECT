import { useState, useEffect, FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'Validation error');
            setLoading(false);
            return;
        }

        const { error: confirmError } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/settings',
            },
            redirect: 'if_required',
        });

        if (confirmError) {
            setError(confirmError.message || 'Confirm error');
        } else {
            onSuccess();
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
                {loading ? 'Processing...' : 'Save Payment Method'}
            </Button>
        </form>
    );
};

export default function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
    const { user } = useAuth();
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && user?.email) {
            api.post('/payments/setup-intent', { customer_email: user.email })
                .then(res => {
                    if (res.data.success) setClientSecret(res.data.clientSecret);
                });
        }
    }, [isOpen, user?.email]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Payment Method"
        >
            <div className="p-1">
                <p className="text-sm text-gray-400 mb-6">
                    Use this form to securely add a new payment method for your subscription.
                </p>
                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                        <CheckoutForm onSuccess={onSuccess} />
                    </Elements>
                ) : (
                    <div className="h-40 flex items-center justify-center text-gray-400">Loading Stripe...</div>
                )}
            </div>
        </Modal>
    );
}
