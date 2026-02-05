import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, CheckIcon, KeyIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { getApiKeys, createApiKey, deleteApiKey, ApiKey } from '../../lib/api-settings';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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
    const { getAccessToken } = useAuth();
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loadingKeys, setLoadingKeys] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const loadKeys = async () => {
        try {
            setLoadingKeys(true);
            const token = await getAccessToken();
            const keys = await getApiKeys(token);
            setApiKeys(keys);
        } catch (error) {
            console.error('Failed to load API keys', error);
        } finally {
            setLoadingKeys(false);
        }
    };

    useEffect(() => {
        loadKeys();
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPath(text);
        setTimeout(() => setCopiedPath(null), 2000);
    };

    const handleCreateKey = async () => {
        if (!newKeyName) return;
        try {
            const token = await getAccessToken();
            const newKey = await createApiKey(token, newKeyName);
            setCreatedKey(newKey.apiKey || null);
            setNewKeyName('');
            loadKeys();
        } catch (error) {
            console.error('Failed to create API key', error);
            alert('Failed to create API API key');
        }
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
        try {
            const token = await getAccessToken();
            await deleteApiKey(token, id);
            loadKeys();
        } catch (error) {
            console.error('Failed to delete API key', error);
        }
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
            {/* API Keys Management Section */}
            <div className="p-6 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">API Keys</h2>
                        <p className="text-gray-400">
                            Generate and manage API keys for authenticating external applications.
                        </p>
                    </div>
                    <Button
                        icon={PlusIcon}
                        onClick={() => setShowCreateModal(true)}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                    >
                        Generate New Key
                    </Button>
                </div>

                <div className="space-y-3">
                    {loadingKeys ? (
                        <div className="text-gray-400 text-sm">Loading keys...</div>
                    ) : apiKeys.length === 0 ? (
                        <div className="text-gray-500 text-sm italic py-4 bg-white/5 rounded-lg text-center">
                            No active API keys found. Generate one to get started.
                        </div>
                    ) : (
                        apiKeys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-ground)] border border-[var(--surface-border)]">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                                        <KeyIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{key.name}</h4>
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {key.prefix}••••••••••••••••••••••••
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-500">
                                        Created: {new Date(key.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteKey(key.id)}
                                        className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                                        title="Revoke Key"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Endpoints List Section */}
            <div className="p-6 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)]">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-white mb-2">Available API Endpoints</h2>
                    <p className="text-gray-400">
                        List of available API endpoints. Authenticate requests using your API Key as a Bearer token.
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

            {/* Create Key Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setCreatedKey(null);
                    setNewKeyName('');
                }}
                title="Generate New API Key"
            >
                <div className="space-y-6">
                    {!createdKey ? (
                        <>
                            <p className="text-gray-300">
                                Give your API key a name to identify it later (e.g., "Zapier Integration", "Mobile App").
                            </p>
                            <Input
                                label="Key Name"
                                placeholder="e.g. Website Integration"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCreateKey}
                                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                    disabled={!newKeyName}
                                >
                                    Generate Key
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                                <CheckIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">API Key Generated!</h3>
                            <p className="text-gray-300 text-sm">
                                Please copy this key now. You won't be able to see it again!
                            </p>

                            <div className="relative group">
                                <div className="p-4 bg-black/30 rounded-lg border border-gray-700 font-mono text-sm break-all text-green-400">
                                    {createdKey}
                                </div>
                                <button
                                    onClick={() => handleCopy(createdKey)}
                                    className="absolute top-2 right-2 p-1.5 bg-gray-800 text-gray-300 rounded hover:text-white"
                                    title="Copy Key"
                                >
                                    {copiedPath === createdKey ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-left">
                                <p className="text-xs text-yellow-200">
                                    <strong>Security Notice:</strong> Treat this key like a password. Do not share it publicly or commit it to version control.
                                </p>
                            </div>

                            <Button
                                className="w-full mt-4"
                                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreatedKey(null);
                                }}
                            >
                                I have copied it
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
