import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Button from '../ui/Button';
import { CreditCardIcon, PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import AddPaymentMethodModal from './AddPaymentMethodModal';

interface PaymentMethod {
    id: string;
    card: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
}

interface Subscription {
    status: string;
    current_period_end: number;
    plan: {
        name: string;
        amount: number;
        currency: string;
    };
}

export default function BillingTab() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const loadBillingData = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const [subRes, methodsRes] = await Promise.all([
                api.get(`/payments/subscription-status?customer_email=${user.email}`),
                api.get(`/payments/list-payment-methods?customer_email=${user.email}`)
            ]);

            if (subRes.data.success) setSubscription(subRes.data.data);
            if (methodsRes.data.success) {
                setPaymentMethods(methodsRes.data.data);
                setDefaultMethodId(methodsRes.data.defaultPaymentMethodId);
            }
        } catch (error) {
            console.error('Failed to load billing data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBillingData();
    }, [user?.email]);

    const handleSetDefault = async (methodId: string) => {
        try {
            await api.post('/payments/set-default-payment-method', {
                customer_email: user?.email,
                paymentMethodId: methodId
            });
            setDefaultMethodId(methodId);
        } catch (error) {
            console.error('Failed to set default method', error);
            alert('Failed to update default payment method');
        }
    };

    const handleRemove = async (methodId: string) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return;
        try {
            await api.post('/payments/detach-payment-method', { paymentMethodId: methodId });
            setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
        } catch (error) {
            console.error('Failed to remove method', error);
            alert('Failed to remove payment method');
        }
    };

    if (loading) return <div className="text-gray-400">Loading billing information...</div>;

    return (
        <div className="space-y-8">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCardIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Subscription Overview</h3>
                </div>
                {subscription ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{subscription.plan?.name}</p>
                                <p className="text-xs text-gray-400">Current Plan • ${(subscription.plan?.amount / 100).toFixed(2)} / month</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 capitalize">Status: <span className="text-emerald-400 font-bold">{subscription.status}</span></p>
                            <p className="text-xs text-gray-400 mt-1">Renews on: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                        <p className="text-gray-400 italic">No active subscription found.</p>
                        <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>View Plans</Button>
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Payment Methods</h3>
                    <Button
                        variant="secondary"
                        icon={PlusIcon}
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-xs"
                    >
                        Add Card
                    </Button>
                </div>

                <div className="grid gap-4">
                    {paymentMethods.length === 0 && (
                        <p className="text-gray-400 text-center py-8 bg-black/20 rounded-xl italic">No payment methods saved.</p>
                    )}
                    {paymentMethods.map((method) => (
                        <div key={method.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white/70 capitalize font-bold text-xs">
                                    {method.card.brand}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">•••• •••• •••• {method.card.last4}</p>
                                    <p className="text-xs text-gray-400">Expires {method.card.exp_month}/{method.card.exp_year}</p>
                                </div>
                                {method.id === defaultMethodId && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Default</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {method.id !== defaultMethodId && (
                                    <button
                                        onClick={() => handleSetDefault(method.id)}
                                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                        title="Set as Default"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleRemove(method.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                    title="Remove Method"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddPaymentMethodModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    loadBillingData();
                }}
            />
        </div>
    );
}
