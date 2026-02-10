import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CheckoutForm from '../components/payments/CheckoutForm';
import api from '../utils/api';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

import { PLANS } from '../config/plans';

const SubscriptionPage: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [_selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            // Preserve query parameters (plan) when redirecting
            const target = '/subscription' + window.location.search;
            // Also pass plan explicitly for Login Page display if possible
            const planParam = searchParams.get('plan');
            let redirectUrl = `/login?redirect=${encodeURIComponent(target)}`;
            if (planParam) {
                redirectUrl += `&plan=${encodeURIComponent(planParam)}`;
            }
            navigate(redirectUrl);
        }

        const planParam = searchParams.get('plan');
        if (planParam) {
            // Find plan by name
            const plan = PLANS.find(p => p.name === planParam);
            if (plan) {
                // If we have user, select it immediately
                if (user) {
                    // Check if already selected to avoid infinite loop or re-selection artifacts if needed
                    // But handleSelectPlan sets loading state, so we should be careful.
                    // Actually, we can just highlight it or let user click. 
                    // But typically 'Select Plan' from landing page implies intent.
                    // We'll trigger it.
                }

                // Only auto-trigger if we haven't selected yet and we are not loading?
                // Actually, simply pre-selecting in UI is safer than auto-firing API.
                // But the user clicked "Select Plan".
                // We'll trigger it.
                if (user && !_selectedPlan && !loading) {
                    handleSelectPlan(plan.id);
                }
            }
        }
    }, [authLoading, user, navigate, searchParams, _selectedPlan, loading]);

    const [error, setError] = useState<string | null>(null);

    const handleSelectPlan = async (priceId: string) => {
        if (!user) return;

        setSelectedPlan(priceId);
        setLoading(true);
        setError(null);

        try {
            // Fix: Remove /crm prefix because API_BASE already includes it (http://localhost:3001/api/crm)
            // Backend routes: app.use('/api/crm/payments', paymentsRouter)
            // paymentsRouter: router.post('/create-subscription', ...)
            // Full URL: http://localhost:3001/api/crm/payments/create-subscription
            const { data } = await api.post('/payments/create-subscription', {
                priceId,
                customer_email: user.email,
                customer_name: user.fullName || user.email
            });

            if (data.success) {
                setClientSecret(data.clientSecret);
            } else {
                console.error('Failed to init subscription', data.error);
                setError(data.error || 'Failed to initialize subscription');
            }
        } catch (err: any) {
            console.error('Error creating subscription:', err);
            const msg = err.response?.data?.error || err.message || 'Payment initialization failed';
            if (msg.includes('No such price')) {
                setError('Configuration Error: The Price ID is invalid. Please update frontend/src/pages/SubscriptionPage.tsx with your actual Stripe Price IDs.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const appearance = {
        theme: 'night' as const, // Use Stripe 'night' theme for better match
        variables: {
            colorPrimary: '#ffffff',
            colorBackground: '#1e293b',
            colorText: '#ffffff',
        },
    };

    const options = {
        clientSecret: clientSecret || '',
        appearance,
    };

    return (
        <MainLayout title="Subscription">
            <div className="container mx-auto px-4 py-8 text-white">
                <h1 className="text-3xl font-bold mb-8 text-white">Choose Your Plan</h1>

                {error && (
                    <div className="mb-6 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {!clientSecret ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {PLANS.map((plan) => (
                            <div key={plan.name} className="border border-white/10 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all bg-white/5 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-2 text-white">{plan.name}</h2>
                                <p className="text-3xl font-bold mb-4 text-white">${plan.price}/{plan.period}</p>
                                <ul className="mb-8 space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center text-slate-300">
                                            <svg className="w-5 h-5 mr-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loading && _selectedPlan === plan.id}
                                    className="w-full bg-white text-slate-900 font-bold py-3 px-6 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50 uppercase tracking-widest text-sm"
                                >
                                    {loading && _selectedPlan === plan.id ? 'Processing...' : 'Select Plan'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-slate-900 border border-white/10 p-8 rounded-2xl shadow-2xl">
                        <button
                            onClick={() => setClientSecret(null)}
                            className="mb-6 text-sm text-slate-400 hover:text-white flex items-center transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            Back to Plans
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-white">Complete Payment</h2>
                        {clientSecret && (
                            <Elements options={options} stripe={stripePromise}>
                                <CheckoutForm />
                            </Elements>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default SubscriptionPage;
