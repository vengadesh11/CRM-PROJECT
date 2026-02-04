
import { Link } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';

export default function DashboardPage() {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
