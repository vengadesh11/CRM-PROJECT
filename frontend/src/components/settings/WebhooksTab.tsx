import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getWebhookEndpoints,
    createWebhookEndpoint,
    deleteWebhookEndpoint,
    testWebhookDispatch,
    WebhookEndpoint
} from '../../lib/api-settings';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { TrashIcon, PlusIcon, BoltIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';

export default function WebhooksTab() {
    const { getAccessToken, hasPermission } = useAuth();
    const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const requireToken = async () => {
        const token = await getAccessToken();
        if (!token) {
            throw new Error('Missing authentication token. Please sign in again.');
        }
        return token;
    };

    // Form State
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [events, setEvents] = useState('leads.created, deals.won'); // Simple comma-separated input for now

    const canManage = hasPermission('webhooks.create') || hasPermission('webhooks.delete');

    useEffect(() => {
        loadEndpoints();
    }, []);

    const loadEndpoints = async () => {
        setLoading(true);
        try {
            const token = await requireToken();
            const data = await getWebhookEndpoints(token);
            setEndpoints(data || []);
        } catch (error) {
            console.error('Failed to load webhooks', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const token = await requireToken();
            await createWebhookEndpoint(token, {
                url,
                description,
                events: events.split(',').map(e => e.trim())
            });
            setIsCreateModalOpen(false);
            setUrl('');
            setDescription('');
            loadEndpoints();
        } catch (error) {
            console.error('Failed to create webhook', error);
            alert('Failed to create webhook');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;
        try {
            const token = await requireToken();
            await deleteWebhookEndpoint(token, id);
            loadEndpoints();
        } catch (error) {
            console.error('Failed to delete webhook', error);
        }
    };

    const handleTest = async (event: string) => {
        try {
            const token = await requireToken();
            await testWebhookDispatch(token, event);
            alert(`Test event '${event}' dispatched! Check your endpoint logs.`);
        } catch (error) {
            console.error('Failed to test webhook', error);
            alert('Test dispatch failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Webhook Endpoints</h3>
                {canManage && (
                    <Button icon={PlusIcon} onClick={() => setIsCreateModalOpen(true)} style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                        Add Endpoint
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-gray-400">Loading webhooks...</div>
            ) : (
                <div className="grid gap-4">
                    {endpoints.length === 0 && (
                        <div className="p-8 text-center bg-white/5 rounded-lg text-gray-400">
                            No webhooks configured. Add one to start receiving real-time events.
                        </div>
                    )}
                    {endpoints.map((ep) => (
                        <div key={ep.id} className="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-blue-400 font-bold text-sm bg-blue-500/10 px-2 py-0.5 rounded">{ep.url}</span>
                                    {ep.is_active ? (
                                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>
                                    ) : (
                                        <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">Inactive</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-300">{(ep.description ?? '') || 'No description'}</p>
                                <div className="flex gap-2 mt-2">
                                    {ep.events.map(evt => (
                                        <span key={evt} className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded">{evt}</span>
                                    ))}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Secret: •••••••••••••••o</div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Button
                                    variant="secondary"
                                    className="!p-2 text-xs"
                                    onClick={() => handleTest(ep.events[0] || 'leads.created')}
                                    title="Test Trigger"
                                >
                                    <BoltIcon className="w-4 h-4" />
                                </Button>
                                {canManage && (
                                    <button
                                        onClick={() => handleDelete(ep.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add Webhook Endpoint"
            >
                <div className="space-y-4">
                    <Input
                        label="Endpoint URL"
                        value={url || ''}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.yoursystem.com/hooks/docuflow"
                    />
                    <Input
                        label="Description"
                        value={description || ''}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Sync new leads to Slack"
                    />
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">Events (comma separated)</label>
                        <Input
                            value={events || ''}
                            onChange={(e) => setEvents(e.target.value)}
                            placeholder="leads.created, deals.won"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>Create Webhook</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
