export interface PlanFeature {
    text: string;
}

export interface Plan {
    id: string; // Stripe Price ID
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    color?: string;
}

export const PLANS: Plan[] = [
    {
        id: 'price_starter_placeholder',
        name: 'Starter',
        price: '0',
        period: 'per user/month',
        description: 'Get your team started with a free trial of the CRM experience.',
        features: [
            'Unlimited contacts',
            'Lead & deal pipelines',
            'Email & SMS activity log',
            'Community support'
        ],
        color: 'from-blue-500 to-blue-600'
    },
    {
        id: 'price_growth_placeholder',
        name: 'Growth',
        price: '49',
        period: 'per user/month',
        description: 'Automate processes and drive revenue with advanced insights.',
        features: [
            'Custom workflows',
            'Priority support',
            'Reports & dashboards',
            'Portal access controls'
        ],
        highlighted: true,
        color: 'from-emerald-500 to-emerald-600'
    },
    {
        id: 'price_enterprise_placeholder',
        name: 'Enterprise',
        price: '149',
        period: 'per user/month',
        description: 'Designed for large operations that need full governance.',
        features: [
            'Dedicated success manager',
            'Advanced permissions',
            'SLA-backed uptime',
            'Custom integrations'
        ],
        color: 'from-purple-500 to-purple-600'
    }
];
