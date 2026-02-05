import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
}

const ENDPOINTS: Endpoint[] = [
    // Leads
    { method: 'GET', path: '/api/crm/leads', description: 'Get a list of all leads' },
    { method: 'POST', path: '/api/crm/leads', description: 'Create a new lead' },
    { method: 'GET', path: '/api/crm/leads/:id', description: 'Get details of a specific lead' },

    // Deals
    { method: 'GET', path: '/api/crm/deals', description: 'Get all deals in the pipeline' },
    { method: 'POST', path: '/api/crm/deals', description: 'Create a new deal' },

    // Customers
    { method: 'GET', path: '/api/crm/customers', description: 'List all customers' },
    { method: 'POST', path: '/api/crm/customers', description: 'Add a new customer' },

    // Analytics & Reports
    { method: 'GET', path: '/api/crm/analytics/dashboard', description: 'Get dashboard summary metrics' },
    { method: 'GET', path: '/api/crm/analytics/pipeline', description: 'Get pipeline performance data' },

    // Webhooks
    { method: 'GET', path: '/api/crm/webhooks/endpoints', description: 'List registered webhook endpoints' },
    { method: 'POST', path: '/api/crm/webhooks/endpoints', description: 'Register a new webhook endpoint' },
];

export default function ApiEndpointsTab() {
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    const handleCopy = (path: string) => {
        navigator.clipboard.writeText(path);
        setCopiedPath(path);
        setTimeout(() => setCopiedPath(null), 2000);
    };

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'text-blue-400 bg-blue-400/10';
            case 'POST': return 'text-green-400 bg-green-400/10';
            case 'PUT': return 'text-orange-400 bg-orange-400/10';
            case 'DELETE': return 'text-red-400 bg-red-400/10';
            case 'PATCH': return 'text-yellow-400 bg-yellow-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)]">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Available API Endpoints</h2>
                    <p className="text-gray-400">
                        List of available API endpoints for accessing your company data programmatically.
                        All requests must be authenticated with a Bearer token.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Endpoints</h3>

                    <div className="grid gap-2">
                        {ENDPOINTS.map((endpoint, index) => (
                            <div
                                key={index}
                                className="group flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono w-16 text-center ${getMethodColor(endpoint.method)}`}>
                                        {endpoint.method}
                                    </span>
                                    <span className="font-mono text-sm text-gray-300 font-bold">
                                        {endpoint.path}
                                    </span>
                                    <span className="text-gray-500 hidden md:inline-block">
                                        - {endpoint.description}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleCopy(endpoint.path)}
                                    className="p-2 text-gray-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Copy Path"
                                >
                                    {copiedPath === endpoint.path ? (
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <ClipboardDocumentIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
