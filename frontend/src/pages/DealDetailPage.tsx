import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import DealFormModal from '../components/deals/DealFormModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';

const formatDateLabel = (value?: string) => {
    if (!value) return null;
    try {
        return new Date(value).toISOString().split('T')[0];
    } catch {
        return null;
    }
};

const DetailRow = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">{value || '-'}</span>
    </div>
);

export default function DealDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getAccessToken } = useAuth();
    const [deal, setDeal] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [leadOptions, setLeadOptions] = useState<{ brands: any[]; leadSources: any[]; leadOwners: any[]; users: any[] }>({
        brands: [],
        leadSources: [],
        leadOwners: [],
        users: []
    });
    const [serviceOptions, setServiceOptions] = useState<any[]>([]);

    const fetchDealDetail = useCallback(async () => {
        if (!id) {
            setDeal(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/deals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeal(response.data.data || response.data || null);
        } catch (error) {
            console.error('Failed to load deal details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, getAccessToken]);

    const fetchDealsList = useCallback(async () => {
        setListLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/deals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeals(response.data.data || []);
        } catch (error) {
            console.error('Failed to load deals list:', error);
        } finally {
            setListLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchDealDetail();
    }, [fetchDealDetail]);

    useEffect(() => {
        fetchDealsList();
    }, [fetchDealsList]);

    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const token = await getAccessToken();
                const [optionsRes, servicesRes] = await Promise.all([
                    axios.get(`${API_BASE}/leads/options`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE}/sales-settings/service-required`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                const optionsData = optionsRes.data.data || {};
                setLeadOptions({
                    brands: optionsData.brands || [],
                    leadSources: optionsData.leadSources || [],
                    leadOwners: optionsData.leadOwners || optionsData.users || [],
                    users: optionsData.users || []
                });
                if (servicesRes.data?.data) {
                    setServiceOptions(servicesRes.data.data);
                }
            } catch (error) {
                console.error('Failed to load deal lookup data:', error);
            }
        };
        fetchLookups();
    }, [getAccessToken]);

    const dealBrandMap = useMemo(() => {
        const map: Record<string, string> = {};
        leadOptions.brands.forEach((entry) => {
            if (entry?.id && entry?.name) {
                map[entry.id] = entry.name;
            }
        });
        return map;
    }, [leadOptions.brands]);

    const dealLeadSourceMap = useMemo(() => {
        const map: Record<string, string> = {};
        leadOptions.leadSources.forEach((entry) => {
            if (entry?.id && entry?.name) {
                map[entry.id] = entry.name;
            }
        });
        return map;
    }, [leadOptions.leadSources]);

    const dealOwnerMap = useMemo(() => {
        const map: Record<string, string> = {};
        [...leadOptions.leadOwners, ...leadOptions.users].forEach((entry) => {
            if (entry?.id) {
                const label = entry?.name || `${entry?.first_name || ''} ${entry?.last_name || ''}`.trim();
                if (label) map[entry.id] = label;
            }
        });
        return map;
    }, [leadOptions.leadOwners, leadOptions.users]);

    const serviceMap = useMemo(() => {
        const map: Record<string, string> = {};
        serviceOptions.forEach((entry) => {
            if (entry?.id && entry?.name) {
                map[entry.id] = entry.name;
            }
        });
        return map;
    }, [serviceOptions]);

    const filteredDeals = useMemo(() => {
        const query = searchTerm.toLowerCase();
        if (!query) return deals;
        return deals.filter((item) => {
            const text = `${item.name || item.company_name || ''} ${item.service || ''}`.toLowerCase();
            return text.includes(query);
        });
    }, [deals, searchTerm]);

    const handleSelectDeal = (dealId: string) => {
        if (!dealId || dealId === id) return;
        navigate(`/deals/${dealId}`);
    };

    const handleUpdateDeal = async (data: any) => {
        if (!deal?.id) return;
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/deals/${deal.id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await Promise.all([fetchDealDetail(), fetchDealsList()]);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Failed to update deal details:', error);
        }
    };

    const handleDeleteDeal = async () => {
        if (!deal?.id) return;
        if (!window.confirm('Delete this deal?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/deals/${deal.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchDealsList();
            navigate('/deals');
        } catch (error) {
            console.error('Failed to delete deal:', error);
        }
    };

    const selectedDealId = deal?.id;
    const currentDealOwnerName = deal
        ? dealOwnerMap[deal.lead_owner_id] ||
          dealOwnerMap[deal.lead_owner] ||
          (typeof deal.lead_owner === 'object' ? deal.lead_owner?.name : deal.lead_owner) ||
          undefined
        : undefined;
    const currentServiceName = deal
        ? serviceMap[deal.service] ||
          serviceMap[deal.service_required] ||
          serviceMap[deal.service_required_id] ||
          (typeof deal.service === 'object' ? deal.service?.name : deal.service) ||
          deal.service_name ||
          undefined
        : undefined;
    const currentDealBrandName = deal
        ? dealBrandMap[deal.brand || deal.brand_id] ||
          (typeof deal.brand === 'object' ? deal.brand?.name : deal.brand) ||
          deal.brand_data?.name ||
          undefined
        : undefined;
    const currentDealLeadSourceName = deal
        ? dealLeadSourceMap[deal.lead_source] ||
          dealLeadSourceMap[deal.source] ||
          (typeof deal.lead_source === 'object' ? deal.lead_source?.name : deal.lead_source) ||
          (typeof deal.source === 'object' ? deal.source?.name : deal.source) ||
          undefined
        : undefined;

    return (
        <Layout title="Deal Details">
            <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
                <div className="space-y-4 rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-4 shadow-lg">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Deals</p>
                        <p className="text-lg font-semibold text-white">{filteredDeals.length} total</p>
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search deals..."
                        className="bg-gray-900/60 border border-white/10 text-sm text-white placeholder:text-white/50"
                    />
                    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                        {listLoading ? (
                            <p className="text-sm text-gray-400">Loading deals...</p>
                        ) : filteredDeals.length === 0 ? (
                            <p className="text-sm text-gray-500">No deals available.</p>
                        ) : (
                            filteredDeals.map((item) => {
                                const serviceLabel = serviceMap[item.service] || item.service || item.description || '—';
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectDeal(item.id)}
                                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${item.id === selectedDealId ? 'border-blue-500 bg-white/5 shadow-lg shadow-blue-500/30' : 'border-white/10 bg-white/5 hover:border-white/40'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-semibold text-white">{item.name || item.company_name || 'Untitled deal'}</span>
                                            <span className="text-xs uppercase tracking-[0.4em] text-gray-400">{(item.status || 'New').slice(0, 12)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{serviceLabel}</p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
                                onClick={() => navigate('/deals')}
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                Back to Deals
                            </button>
                            <h1 className="text-2xl font-bold text-white">{deal?.name || deal?.company_name || 'Deal Details'}</h1>
                        </div>
                        {loading ? (
                            <div className="text-gray-400">Loading deal...</div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-5">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Status</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-200 border border-white/10 text-[10px] uppercase tracking-[0.3em]">
                                                {deal?.status || 'New'}
                                            </span>
                                            {formatDateLabel(deal?.deal_date || deal?.created_at) && (
                                                <span className="text-sm text-gray-400">Added {formatDateLabel(deal?.deal_date || deal?.created_at)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button size="sm" variant="secondary" icon={PencilSquareIcon} onClick={() => setIsEditModalOpen(true)}>Edit</Button>
                                        <Button size="sm" variant="secondary" className="!bg-red-500/10 !border-red-500/30 !text-red-400" icon={TrashIcon} onClick={handleDeleteDeal}>Delete</Button>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-emerald-900 p-6 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.45em] text-emerald-200">Opportunity Snapshot</p>
                                            <p className="mt-2 text-sm text-gray-200">Review key deal context before you act.</p>
                                        </div>
                                        <Button size="sm" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">Analyze</Button>
                                    </div>
                                    <div className="mt-6 flex justify-center">
                                        <Button className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">Run Deal Audit</Button>
                                    </div>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-3 bg-[var(--surface-panel)] border border-white/5 rounded-2xl p-5">
                                    <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Contact Information</p>
                                    <DetailRow label="CIF" value={deal?.cif} />
                                    <DetailRow label="Company" value={deal?.company_name || deal?.name} />
                                    <DetailRow label="Email" value={deal?.email} />
                                    <DetailRow label="Brand" value={currentDealBrandName} />
                                    <DetailRow label="Lead Owner" value={currentDealOwnerName} />
                                </div>
                                <div className="space-y-3 bg-[var(--surface-panel)] border border-white/5 rounded-2xl p-5">
                                    <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Deal Details</p>
                                    <DetailRow label="Amount" value={deal?.service_amount ? `AED ${deal.service_amount}` : '—'} />
                                    <DetailRow label="Lead Source" value={currentDealLeadSourceName} />
                                    <DetailRow label="Service" value={currentServiceName} />
                                    <DetailRow label="Payment Status" value={deal?.payment_status} />
                                    <DetailRow label="Closing Date" value={formatDateLabel(deal?.closing_date || deal?.expected_close_date) ?? undefined} />
                                </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <DealFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateDeal}
                mode="edit"
                initialData={deal}
            />
        </Layout>
    );
}
