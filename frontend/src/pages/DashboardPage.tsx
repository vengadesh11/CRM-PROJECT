import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { PLANS } from '../config/plans';
import api from '../utils/api';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingSub, setLoadingSub] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!user?.email) return;
            try {
                const { data } = await api.get(`/payments/subscription-status?customer_email=${user.email}`);
                if (data.success) {
                    setSubscription(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch subscription status', err);
            } finally {
                setLoadingSub(false);
            }
        };
        fetchStatus();
    }, [user?.email]);

    const handlePlanSelection = (planName: string) => {
        navigate(`/subscription?plan=${encodeURIComponent(planName)}`);
    };

    const modules = [
        {
            title: 'Leads Management',
            description: 'Track and manage sales leads',
            icon: '📊',
            path: '/leads',
            color: 'from-blue-500 to-blue-600'
        },
        {
            title: 'Deals Management',
            description: 'Manage opportunities and deals',
            icon: '🤝',
            path: '/deals',
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Customers',
            description: 'Customer information and history',
            icon: '👥',
            path: '/customers',
            color: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Custom Fields',
            description: 'Configure dynamic form fields',
            icon: '⚙️',
            path: '/custom-fields',
            color: 'from-orange-500 to-orange-600'
        }
    ];

    return (
        <Layout title="Dashboard">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
                <p className="text-[var(--text-secondary)]">Here's an overview of your CRM modules.</p>
            </div>

            <SubscriptionSection
                subscription={subscription}
                loading={loadingSub}
                onSelectPlan={handlePlanSelection}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {modules.map((module) => (
                    <Link
                        key={module.path}
                        to={module.path}
                        className="group"
                    >
                        <div className="surface-panel p-6 hover:border-[var(--accent-primary)] transition-all hover:shadow-xl hover:shadow-blue-500/10">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                                {module.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {module.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}

const SubscriptionSection = ({ subscription, loading, onSelectPlan }: { subscription: any, loading: boolean, onSelectPlan: (name: string) => void }) => {
    if (loading) return <div className="mb-8 p-6 surface-panel animate-pulse h-40"></div>;

    if (subscription) {
        return (
            <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-blue-400 mb-1">Active Subscription</p>
                    <h3 className="text-2xl font-bold text-white mb-2">{subscription.plan?.name}</h3>
                    <p className="text-sm text-gray-400">
                        Your subscription is <span className="text-emerald-400 font-bold uppercase">{subscription.status}</span>.
                        Next renewal: <span className="text-white">{new Date(subscription.current_period_end * 1000).toLocaleDateString()}</span>
                    </p>
                </div>
                <Link
                    to="/settings"
                    className="px-6 py-3 rounded-full bg-white text-slate-900 font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
                >
                    Manage Billing
                </Link>
            </div>
        );
    }

    return null;
};
