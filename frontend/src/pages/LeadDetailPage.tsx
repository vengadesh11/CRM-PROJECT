import { useCallback, useEffect, useMemo, useState, ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    TrashIcon,
    EnvelopeIcon,
    PhoneIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import LeadFormModal from '../components/leads/LeadFormModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';

const formatDateLabel = (value?: string) => {
    if (!value) return null;
    try {
        return new Date(value).toISOString().split('T')[0];
    } catch {
        return null;
    }
};

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: string | number; icon?: ComponentType<{ className?: string }> }) => (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-white">{value || '—'}</span>
        </div>
    </div>
);

export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getAccessToken } = useAuth();
    const [lead, setLead] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [leadOptions, setLeadOptions] = useState<{ brands: any[]; leadSources: any[]; leadOwners: any[]; users: any[] }>({
        brands: [],
        leadSources: [],
        leadOwners: [],
        users: []
    });

    const fetchLeadDetail = useCallback(async () => {
        if (!id) {
            setLead(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/leads/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLead(response.data.data || response.data || null);
        } catch (error) {
            console.error('Failed to fetch lead details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, getAccessToken]);

    const fetchLeadsList = useCallback(async () => {
        setListLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeads(response.data.data || []);
        } catch (error) {
            console.error('Failed to load lead list:', error);
        } finally {
            setListLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchLeadDetail();
    }, [fetchLeadDetail]);

    useEffect(() => {
        fetchLeadsList();
    }, [fetchLeadsList]);

    useEffect(() => {
        const fetchLookup = async () => {
            try {
                const token = await getAccessToken();
                const response = await axios.get(`${API_BASE}/leads/options`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const optionsData = response.data.data || {};
                setLeadOptions({
                    brands: optionsData.brands || [],
                    leadSources: optionsData.leadSources || [],
                    leadOwners: optionsData.leadOwners || optionsData.users || [],
                    users: optionsData.users || []
                });
            } catch (error) {
                console.error('Failed to load lead lookup data:', error);
            }
        };
        fetchLookup();
    }, [getAccessToken]);

    const leadBrandMap = useMemo(() => {
        const map: Record<string, string> = {};
        leadOptions.brands.forEach((entry) => {
            if (entry?.id && entry?.name) {
                map[entry.id] = entry.name;
            }
        });
        return map;
    }, [leadOptions.brands]);

    const leadSourceMap = useMemo(() => {
        const map: Record<string, string> = {};
        leadOptions.leadSources.forEach((entry) => {
            if (entry?.id && entry?.name) {
                map[entry.id] = entry.name;
            }
        });
        return map;
    }, [leadOptions.leadSources]);

    const leadOwnerMap = useMemo(() => {
        const map: Record<string, string> = {};
        [...leadOptions.leadOwners, ...leadOptions.users].forEach((entry) => {
            if (entry?.id) {
                const label = entry?.name || `${entry?.first_name || ''} ${entry?.last_name || ''}`.trim();
                if (label) map[entry.id] = label;
            }
        });
        return map;
    }, [leadOptions.leadOwners, leadOptions.users]);

    const filteredLeads = useMemo(() => {
        const query = searchTerm.toLowerCase();
        if (!query) return leads;
        return leads.filter((item) => {
            const text = `${item.company_name || item.name || ''} ${item.email || ''}`.toLowerCase();
            return text.includes(query);
        });
    }, [leads, searchTerm]);

    const handleSelectLead = (leadId: string) => {
        if (!leadId) return;
        if (leadId === id) return;
        navigate(`/leads/${leadId}`);
    };

    const handleUpdateLead = async (data: any) => {
        if (!lead || !lead.id) return;
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/leads/${lead.id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await Promise.all([fetchLeadDetail(), fetchLeadsList()]);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Failed to update lead details:', error);
        }
    };

    const handleDeleteLead = async () => {
        if (!lead?.id) return;
        if (!window.confirm('Delete this lead?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/leads/${lead.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchLeadsList();
            navigate('/leads');
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    };

    const currentBrandName = lead
        ? leadBrandMap[lead.brand_id || lead.brand] ||
          (typeof lead.brand === 'object' ? lead.brand?.name : lead.brand) ||
          undefined
        : undefined;
    const currentLeadSourceName = lead
        ? leadSourceMap[lead.lead_source] ||
          leadSourceMap[lead.source] ||
          (typeof lead.lead_source === 'object' ? lead.lead_source?.name : lead.lead_source) ||
          (typeof lead.source === 'object' ? lead.source?.name : lead.source) ||
          undefined
        : undefined;
    const currentLeadOwnerName = lead
        ? leadOwnerMap[lead.lead_owner_id] ||
          leadOwnerMap[lead.lead_owner] ||
          (typeof lead.lead_owner === 'object' ? lead.lead_owner?.name : lead.lead_owner) ||
          undefined
        : undefined;

    const selectedLeadId = lead?.id;

    return (
        <Layout title="Lead Details">
            <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
                <div className="space-y-4 rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-4 shadow-lg">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Leads</p>
                        <p className="text-lg font-semibold text-white">{filteredLeads.length} total</p>
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search leads..."
                        className="bg-gray-900/60 border border-white/10 text-sm text-white placeholder:text-white/50"
                    />
                    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                        {listLoading ? (
                            <p className="text-sm text-gray-400">Loading leads...</p>
                        ) : filteredLeads.length === 0 ? (
                            <p className="text-sm text-gray-500">No leads available.</p>
                        ) : (
                            filteredLeads.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectLead(item.id)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${item.id === selectedLeadId ? 'border-blue-500 bg-white/5 shadow-lg shadow-blue-500/30' : 'border-white/10 bg-white/5 hover:border-white/40'}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-white">{item.company_name || item.name || 'Untitled lead'}</span>
                                        <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">{(item.status || 'New').slice(0, 12)}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{item.email || item.mobile_number || '—'}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
                                onClick={() => navigate('/leads')}
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                Back to Leads
                            </button>
                            <h1 className="text-2xl font-bold text-white">{lead?.company_name || lead?.name || 'Lead Details'}</h1>
                        </div>
                        {loading ? (
                            <div className="text-gray-400">Loading lead...</div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--surface-panel)] p-5">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Status</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-white/5 text-gray-200 border border-white/10 uppercase tracking-[0.3em] text-[10px]">
                                                {lead?.status || 'New'}
                                            </span>
                                            {formatDateLabel(lead?.registration_date || lead?.created_at) && (
                                                <span className="text-sm text-gray-400">Added {formatDateLabel(lead?.registration_date || lead?.created_at)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button size="sm" variant="secondary" icon={PencilSquareIcon} onClick={() => setIsEditModalOpen(true)}>Edit</Button>
                                        <Button size="sm" variant="secondary" className="!bg-red-500/10 !border-red-500/30 !text-red-400" icon={TrashIcon} onClick={handleDeleteLead}>Delete</Button>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900 to-indigo-900 p-6 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.45em] text-purple-300">AI Insights</p>
                                            <p className="mt-2 text-sm text-gray-200">
                                                Get AI-powered insights on this lead's quality and conversion probability.
                                            </p>
                                        </div>
                                        <Button size="sm" className="bg-white/10 text-white border border-white/20 hover:bg-white/20">Analyze Lead</Button>
                                    </div>
                                    <div className="mt-6 flex justify-center">
                                        <Button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">Generate Analysis</Button>
                                    </div>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-3">
                                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Contact Information</p>
                                        <DetailRow label="Email Address" value={lead?.email} icon={EnvelopeIcon} />
                                        <DetailRow label="Mobile Number" value={lead?.mobile_number || lead?.phone} icon={PhoneIcon} />
                                        <DetailRow label="Lead Owner" value={currentLeadOwnerName || lead?.lead_owner} />
                                        <DetailRow label="Status" value={lead?.status} />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Professional Details</p>
                                        <DetailRow label="Company" value={lead?.company_name || lead?.name} icon={BuildingOffice2Icon} />
                                        <DetailRow label="Brand" value={currentBrandName} />
                                        <DetailRow label="Lead Source" value={currentLeadSourceName} />
                                        <DetailRow label="Closing Cycle" value={lead?.closing_cycle} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <LeadFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateLead}
                mode="edit"
                initialData={lead}
            />
        </Layout>
    );
}
