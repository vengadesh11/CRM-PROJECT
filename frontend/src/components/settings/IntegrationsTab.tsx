import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getIntegrations,
    updateIntegration,
    Integration
} from '../../lib/api-settings';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const INTEGRATION_LOGOS: Record<string, string> = {
    slack: 'https://cdn.iconscout.com/icon/free/png-256/free-slack-logo-icon-download-in-svg-png-gif-file-formats--social-media-company-brand-vol-5-pack-logos-icons-2945084.png',
    sendgrid: 'https://cdn.iconscout.com/icon/free/png-256/free-sendgrid-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-6-pack-logos-icons-2945119.png',
    zapier: 'https://cdn.iconscout.com/icon/free/png-256/free-zapier-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-company-brand-vol-7-pack-logos-icons-2945155.png',
    openai: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/1024px-ChatGPT_logo.svg.png',
    stripe: 'https://cdn.iconscout.com/icon/free/png-256/free-stripe-logo-icon-download-in-svg-png-gif-file-formats--payment-gateway-pay-finance-technology-company-brand-vol-6-pack-logos-icons-2945107.png'
};

export default function IntegrationsTab() {
    const { getAccessToken, hasPermission } = useAuth();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [apiKey, setApiKey] = useState('');

    const canManage = hasPermission('integrations.edit');

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            const data = await getIntegrations(token);
            setIntegrations(data || []);
        } catch (error) {
            console.error('Failed to load integrations', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (integration: Integration) => {
        if (!canManage) return;
        try {
            const token = await getAccessToken();
            const updated = await updateIntegration(token, integration.id, { is_active: !integration.is_active });
            setIntegrations(prev => prev.map(i => i.id === updated.id ? updated : i));
        } catch (error) {
            console.error('Failed to toggle integration', error);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedIntegration) return;
        try {
            const token = await getAccessToken();
            // Assuming the simple config just needs a generic 'api_key' secret for now
            const secrets = apiKey ? { api_token: apiKey } : undefined;

            await updateIntegration(token, selectedIntegration.id, {
                secrets
            });

            alert('Integration updated successfully');
            setSelectedIntegration(null);
            setApiKey('');
            loadIntegrations();
        } catch (error) {
            console.error('Failed to update integration', error);
            alert('Failed to update');
        }
    };

    if (loading) return <div className="text-gray-400">Loading integrations...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white/5 rounded-lg text-gray-400">
                    No available integrations found. (Did you add them to the database?)
                </div>
            )}

            {integrations.map((integration) => (
                <div key={integration.id} className={`p-6 rounded-xl border transition-all ${integration.is_active ? 'bg-blue-900/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center">
                                {INTEGRATION_LOGOS[integration.provider] ? (
                                    <img src={INTEGRATION_LOGOS[integration.provider]} alt={integration.provider} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-black font-bold text-xs uppercase">{(integration.provider || '').substring(0, 2)}</span>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-white capitalize">{integration.name}</h4>
                                <p className="text-sm text-gray-400">{integration.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs uppercase font-bold ${integration.is_active ? 'text-blue-400' : 'text-gray-500'}`}>
                                    {integration.is_active ? 'Active' : 'Diffused'}
                                </span>
                                {canManage && (
                                    <button
                                        onClick={() => handleToggle(integration)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${integration.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${integration.is_active ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                )}
                            </div>

                            {canManage && (
                                <button
                                    onClick={() => setSelectedIntegration(integration)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                                >
                                    <PencilSquareIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <Modal
                isOpen={!!selectedIntegration}
                onClose={() => setSelectedIntegration(null)}
                title={`Configure ${selectedIntegration?.name}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Enter your API key or secret token to enable this integration.
                        Values are encrypted securely on the server.
                    </p>
                    <Input
                        label="API Key / Token"
                        type="password"
                        value={apiKey || ''}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk_live_..."
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setSelectedIntegration(null)}>Cancel</Button>
                        <Button onClick={handleSaveConfig} style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>Save Configuration</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
