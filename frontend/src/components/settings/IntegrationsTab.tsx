import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getIntegrations,
    updateIntegration,
    Integration,
    syncSuiteCrm,
    getSuiteCrmStatus,
    syncZoho,
    getZohoStatus,
    syncEspo,
    getEspoStatus,
    syncOro,
    getOroStatus,
    SuiteCrmStatus,
    ZohoStatus,
    EspoStatus,
    OroStatus
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
    const requireToken = async () => {
        const token = await getAccessToken();
        if (!token) {
            throw new Error('Missing authentication token. Please sign in again.');
        }
        return token;
    };

    const [suiteStatus, setSuiteStatus] = useState<SuiteCrmStatus | null>(null);
    const [suiteSyncing, setSuiteSyncing] = useState(false);
    const [suiteLoading, setSuiteLoading] = useState(false);
    const [suiteError, setSuiteError] = useState<string | null>(null);
    const [zohoStatus, setZohoStatus] = useState<ZohoStatus | null>(null);
    const [zohoSyncing, setZohoSyncing] = useState(false);
    const [zohoLoading, setZohoLoading] = useState(false);
    const [zohoError, setZohoError] = useState<string | null>(null);
    const [espStatus, setEspStatus] = useState<EspoStatus | null>(null);
    const [espSyncing, setEspSyncing] = useState(false);
    const [espLoading, setEspLoading] = useState(false);
    const [espError, setEspError] = useState<string | null>(null);
    const [oroStatus, setOroStatus] = useState<OroStatus | null>(null);
    const [oroSyncing, setOroSyncing] = useState(false);
    const [oroLoading, setOroLoading] = useState(false);
    const [oroError, setOroError] = useState<string | null>(null);

    const loadSuiteStatus = async () => {
        setSuiteLoading(true);
        try {
            const token = await requireToken();
            const status = await getSuiteCrmStatus(token);
            setSuiteStatus(status);
            setSuiteError(null);
        } catch (error: any) {
            console.error('Failed to load SuiteCRM status', error);
            setSuiteError(error?.message || 'Unable to load SuiteCRM status');
        } finally {
            setSuiteLoading(false);
        }
    };

    const handleSuiteSync = async () => {
        setSuiteSyncing(true);
        try {
            const token = await requireToken();
            const response = await syncSuiteCrm(token);
            setSuiteStatus((prev) => ({
                lastSyncAt: response.data?.syncedAt || new Date().toISOString(),
                latestLog: prev?.latestLog || null
            }));
            setSuiteError(null);
            loadSuiteStatus();
        } catch (error: any) {
            console.error('Failed to sync SuiteCRM', error);
            setSuiteError(error?.message || 'SuiteCRM sync failed');
        } finally {
            setSuiteSyncing(false);
        }
    };

    const handleZohoSync = async () => {
        setZohoSyncing(true);
        try {
            const token = await requireToken();
            const response = await syncZoho(token);
            setZohoStatus((prev) => ({
                lastSyncAt: response.data?.syncedAt || new Date().toISOString(),
                latestLog: prev?.latestLog || null
            }));
            setZohoError(null);
            loadZohoStatus();
        } catch (error: any) {
            console.error('Failed to sync Zoho CRM', error);
            setZohoError(error?.message || 'Zoho sync failed');
        } finally {
            setZohoSyncing(false);
        }
    };

    const handleEspSync = async () => {
        setEspSyncing(true);
        try {
            const token = await requireToken();
            const response = await syncEspo(token);
            setEspStatus((prev) => ({
                lastSyncAt: response.data?.syncedAt || new Date().toISOString(),
                latestLog: prev?.latestLog || null
            }));
            setEspError(null);
            loadEspStatus();
        } catch (error: any) {
            console.error('Failed to sync EspoCRM', error);
            setEspError(error?.message || 'EspoCRM sync failed');
        } finally {
            setEspSyncing(false);
        }
    };

    const handleOroSync = async () => {
        setOroSyncing(true);
        try {
            const token = await requireToken();
            const response = await syncOro(token);
            setOroStatus((prev) => ({
                lastSyncAt: response.data?.syncedAt || new Date().toISOString(),
                latestLog: prev?.latestLog || null
            }));
            setOroError(null);
            loadOroStatus();
        } catch (error: any) {
            console.error('Failed to sync OroCRM', error);
            setOroError(error?.message || 'OroCRM sync failed');
        } finally {
            setOroSyncing(false);
        }
    };

    useEffect(() => {
        loadIntegrations();
        loadSuiteStatus();
        loadZohoStatus();
        loadEspStatus();
        loadOroStatus();
    }, []);

    const loadZohoStatus = async () => {
        setZohoLoading(true);
        try {
            const token = await requireToken();
            const status = await getZohoStatus(token);
            setZohoStatus(status);
            setZohoError(null);
        } catch (error: any) {
            console.error('Failed to load Zoho status', error);
            setZohoError(error?.message || 'Unable to load Zoho status');
        } finally {
            setZohoLoading(false);
        }
    };

    const loadEspStatus = async () => {
        setEspLoading(true);
        try {
            const token = await requireToken();
            const status = await getEspoStatus(token);
            setEspStatus(status);
            setEspError(null);
        } catch (error: any) {
            console.error('Failed to load EspoCRM status', error);
            setEspError(error?.message || 'Unable to load EspoCRM status');
        } finally {
            setEspLoading(false);
        }
    };

    const loadOroStatus = async () => {
        setOroLoading(true);
        try {
            const token = await requireToken();
            const status = await getOroStatus(token);
            setOroStatus(status);
            setOroError(null);
        } catch (error: any) {
            console.error('Failed to load OroCRM status', error);
            setOroError(error?.message || 'Unable to load OroCRM status');
        } finally {
            setOroLoading(false);
        }
    };

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const token = await requireToken();
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
            const token = await requireToken();
            const updated = await updateIntegration(token, integration.id, { is_active: !integration.is_active });
            setIntegrations(prev => prev.map(i => i.id === updated.id ? updated : i));
        } catch (error) {
            console.error('Failed to toggle integration', error);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedIntegration) return;
        try {
            const token = await requireToken();
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
            <div className="col-span-full p-6 rounded-xl border border-[var(--surface-border)] bg-gradient-to-r from-slate-900/60 to-blue-900/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-blue-400">SuiteCRM Bridge</p>
                        <h3 className="text-2xl font-bold text-white">Sync with SuiteCRM</h3>
                        <p className="text-sm text-gray-400">
                            Trigger a manual sync to pull records from your SuiteCRM instance and replay SuiteCRM webhooks into DocuFlow.
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                        <p>Last sync</p>
                        <p className="text-base text-white">
                            {suiteLoading
                                ? 'Loading...'
                                : suiteStatus?.lastSyncAt
                                    ? new Date(suiteStatus.lastSyncAt).toLocaleString()
                                    : 'Never synced'}
                        </p>
                    </div>
                    <div className="flex items-center justify-end">
                        <Button
                            onClick={handleSuiteSync}
                            disabled={!canManage || suiteSyncing}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        >
                            {suiteSyncing ? 'Syncing...' : 'Sync now'}
                        </Button>
                    </div>
                </div>
                {suiteError && (
                    <p className="text-sm text-red-400">
                        {suiteError}
                    </p>
                )}
            </div>
            <div className="col-span-full p-6 rounded-xl border border-[var(--surface-border)] bg-gradient-to-r from-emerald-900/60 to-green-900/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">Zoho CRM</p>
                        <h3 className="text-2xl font-bold text-white">Sync with Zoho</h3>
                        <p className="text-sm text-gray-400">
                            Pull leads from your Zoho CRM instance and forward any webhook events into DocuFlow.
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                        <p>Last sync</p>
                        <p className="text-base text-white">
                            {zohoLoading
                                ? 'Loading...'
                                : zohoStatus?.lastSyncAt
                                    ? new Date(zohoStatus.lastSyncAt).toLocaleString()
                                    : 'Never synced'}
                        </p>
                    </div>
                    <div className="flex items-center justify-end">
                        <Button
                            onClick={handleZohoSync}
                            disabled={!canManage || zohoSyncing}
                            style={{ backgroundColor: '#059669', color: '#ffffff' }}
                        >
                            {zohoSyncing ? 'Syncing...' : 'Sync now'}
                        </Button>
                    </div>
                </div>
                {zohoError && (
                    <p className="text-sm text-red-400">
                        {zohoError}
                    </p>
                )}
            </div>

            <div className="col-span-full p-6 rounded-xl border border-[var(--surface-border)] bg-gradient-to-r from-amber-900/60 to-yellow-900/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-yellow-400">EspoCRM</p>
                        <h3 className="text-2xl font-bold text-white">Sync with EspoCRM</h3>
                        <p className="text-sm text-gray-400">
                            Pull lead records from EspoCRM and replay its webhook payloads into DocuFlow.
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                        <p>Last sync</p>
                        <p className="text-base text-white">
                            {espLoading
                                ? 'Loading...'
                                : espStatus?.lastSyncAt
                                    ? new Date(espStatus.lastSyncAt).toLocaleString()
                                    : 'Never synced'}
                        </p>
                    </div>
                    <div className="flex items-center justify-end">
                        <Button
                            onClick={handleEspSync}
                            disabled={!canManage || espSyncing}
                            style={{ backgroundColor: '#b45309', color: '#ffffff' }}
                        >
                            {espSyncing ? 'Syncing...' : 'Sync EspoCRM'}
                        </Button>
                    </div>
                </div>
                {espError && (
                    <p className="text-sm text-red-400">
                        {espError}
                    </p>
                )}
            </div>

            <div className="col-span-full p-6 rounded-xl border border-[var(--surface-border)] bg-gradient-to-r from-purple-900/60 to-fuchsia-900/40 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-400">OroCRM</p>
                        <h3 className="text-2xl font-bold text-white">Sync with OroCRM</h3>
                        <p className="text-sm text-gray-400">
                            Import OroCRM lead streams and forward webhook notifications to DocuFlow.
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                        <p>Last sync</p>
                        <p className="text-base text-white">
                            {oroLoading
                                ? 'Loading...'
                                : oroStatus?.lastSyncAt
                                    ? new Date(oroStatus.lastSyncAt).toLocaleString()
                                    : 'Never synced'}
                        </p>
                    </div>
                    <div className="flex items-center justify-end">
                        <Button
                            onClick={handleOroSync}
                            disabled={!canManage || oroSyncing}
                            style={{ backgroundColor: '#9333ea', color: '#ffffff' }}
                        >
                            {oroSyncing ? 'Syncing...' : 'Sync OroCRM'}
                        </Button>
                    </div>
                </div>
                {oroError && (
                    <p className="text-sm text-red-400">
                        {oroError}
                    </p>
                )}
            </div>

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
