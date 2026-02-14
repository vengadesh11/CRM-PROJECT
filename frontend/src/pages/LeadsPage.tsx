import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import LeadFormModal from '../components/leads/LeadFormModal';
import Modal from '../components/ui/Modal';
import type { CustomField } from '../components/custom-fields/CustomFieldInputs';
import {
    PlusIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowPathRoundedSquareIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';
const LEADS_COLUMN_PREF_KEY = 'docuflow.leads.columns';

export default function LeadsPage() {
    const navigate = useNavigate();
    const { getAccessToken, hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({
        registration_date: '',
        company_name: '',
        email: '',
        closing_cycle: '',
        mobile_number: '',
        closing_date: '',
        remarks: '',
        department: '',
        status: '',
        lead_source: ''
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
    const [columnsSearch, setColumnsSearch] = useState('');
    const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [leadOptions, setLeadOptions] = useState<any>({
        brands: [],
        services: [],
        qualifications: [],
        users: [],
        leadSources: [],
        servicesRequired: []
    });
    const leadSourceMap = useMemo(() => {
        const map: Record<string, string> = {};
        (leadOptions.leadSources || []).forEach((source: any) => {
            if (source?.id && source?.name) {
                map[source.id] = source.name;
            }
        });
        return map;
    }, [leadOptions.leadSources]);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        sno: true,
        registration_date: true,
        company_name: true,
        email: true,
        closing_cycle: true,
        mobile_number: true,
        closing_date: true,
        remarks: true,
        department: true
    });
    const [columnOrder, setColumnOrder] = useState<string[]>([
        'sno',
        'registration_date',
        'company_name',
        'email',
        'closing_cycle',
        'mobile_number',
        'closing_date',
        'remarks',
        'department'
    ]);
    const [columnPrefsLoaded, setColumnPrefsLoaded] = useState(false);
    const [dragColumnId, setDragColumnId] = useState<string | null>(null);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [leadToConvert, setLeadToConvert] = useState<any | null>(null);

    const canCreateLead = hasPermission('leads.create');
    const canEditLead = hasPermission('leads.edit');
    const canDeleteLead = hasPermission('leads.delete');

    const fetchLeads = async (params?: { search?: string; status?: string; source?: string }) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/leads`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setLeads(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads({
                search: searchTerm || undefined,
                status: filters.status || undefined,
                source: filters.lead_source || undefined
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filters.status, filters.lead_source]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const token = await getAccessToken();
                const [fieldsRes, optionsRes] = await Promise.all([
                    axios.get(`${API_BASE}/custom-fields`, {
                        params: { module: 'leads' },
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE}/leads/options`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setCustomFields(fieldsRes.data.data || []);
                const optionsData = optionsRes.data.data || {};
                setLeadOptions({
                    brands: optionsData.brands || [],
                    services: optionsData.services || [],
                    qualifications: optionsData.qualifications || [],
                    users: optionsData.users || [],
                    leadSources: optionsData.leadSources || [],
                    servicesRequired: optionsData.servicesRequired || []
                });
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            }
        };
        fetchMetadata();
    }, [API_BASE, getAccessToken]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(leads.map(l => l.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} leads?`)) return;

        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/leads/bulk-delete`, {
                ids: Array.from(selectedIds)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedIds(new Set());
            fetchLeads();
        } catch (error) {
            console.error('Failed to bulk delete leads:', error);
            alert('Failed to delete leads');
        }
    };

    const handleCreateLead = async (data: any) => {
        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/leads`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            fetchLeads();
        } catch (error) {
            console.error('Failed to create lead:', error);
        }
    };

    const handleUpdateLead = async (id: string, data: any) => {
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/leads/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            fetchLeads();
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    };

    const handleSubmitLead = async (data: any) => {
        if (modalMode === 'edit' && selectedLead?.id) {
            await handleUpdateLead(selectedLead.id, data);
            return;
        }
        await handleCreateLead(data);
    };

    const openCreate = () => {
        setSelectedLead(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const openView = (lead: any) => {
        navigate(`/leads/${lead.id}`);
    };

    const openEdit = (lead: any) => {
        setSelectedLead(lead);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this lead?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/leads/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeads();
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    };

    const handleConvertConfirm = () => {
        if (!leadToConvert) return;
        setIsConvertModalOpen(false);
        navigate('/customers', {
            state: {
                convertFromLead: {
                    company_name: leadToConvert.company_name || leadToConvert.company || leadToConvert.name || '',
                    email: leadToConvert.email || '',
                    mobile: leadToConvert.mobile_number || leadToConvert.phone || '',
                    remarks: leadToConvert.remarks || ''
                }
            }
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            registration_date: '',
            company_name: '',
            email: '',
            closing_cycle: '',
            mobile_number: '',
            closing_date: '',
            remarks: '',
            department: '',
            status: '',
            lead_source: ''
        });
    };

    const setFilterValue = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const splitCsvLine = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };

    const parseCsv = (text: string) => {
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length === 0) return [];
        const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
        return lines.slice(1).map((line) => {
            const values = splitCsvLine(line);
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = (values[index] || '').trim();
            });
            return row;
        });
    };

    const importLeadsFromCsv = async (file: File) => {
        if (!file) return;
        setImportMessage({ type: 'info', text: 'Importing leads...' });
        try {
            const text = await file.text();
            const rows = parseCsv(text);
            if (rows.length === 0) {
                setImportMessage({ type: 'error', text: 'No rows found in CSV.' });
                return;
            }

            const token = await getAccessToken();
            let imported = 0;
            for (const row of rows) {
                const payload = {
                    company_name: row.company_name || row.company || row.companyname || row.name || null,
                    mobile_number: row.mobile_number || row.mobile || row.phone || row.contact_number || row.contact || null,
                    email: row.email || null,
                    lead_source: row.lead_source || row.source || null,
                    status: row.status || 'new'
                };
                if (!payload.company_name && !payload.email && !payload.mobile_number) {
                    continue;
                }
                await axios.post(`${API_BASE}/leads`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                imported += 1;
            }
            setImportMessage({ type: 'success', text: `Imported ${imported} lead(s).` });
            fetchLeads({
                search: searchTerm || undefined,
                status: filters.status || undefined,
                source: filters.lead_source || undefined
            });
        } catch (error) {
            console.error('Failed to import leads:', error);
            setImportMessage({ type: 'error', text: 'Import failed. Please check the CSV format.' });
        }
    };

    const exportLeadsToCsv = () => {
        const columns = [
            { key: 'company_name', label: 'Company Name' },
            { key: 'mobile_number', label: 'Mobile Number' },
            { key: 'email', label: 'Email' },
            { key: 'lead_source', label: 'Lead Source' },
            { key: 'status', label: 'Status' },
            { key: 'created_at', label: 'Created At' }
        ];

        const escapeCsv = (value: string) => {
            if (value.includes('"')) value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('\r')) {
                return `"${value}"`;
            }
            return value;
        };

        const headerLine = columns.map((col) => col.label).join(',');
        const lines = leads.map((lead) => columns.map((col) => escapeCsv(String(lead[col.key] ?? ''))).join(','));
        const csv = [headerLine, ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'leads.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importLeadsFromCsv(file);
            event.target.value = '';
        }
    };

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingFile(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            importLeadsFromCsv(file);
        }
    };

    const toggleColumn = (id: string) => {
        setVisibleColumns((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleColumnDragStart = (id: string) => {
        setDragColumnId(id);
    };

    const handleColumnDrop = (targetId: string) => {
        if (!dragColumnId || dragColumnId === targetId) return;
        setColumnOrder((prev) => {
            const next = [...prev];
            const fromIndex = next.indexOf(dragColumnId);
            const toIndex = next.indexOf(targetId);
            if (fromIndex === -1 || toIndex === -1) return prev;
            next.splice(fromIndex, 1);
            next.splice(toIndex, 0, dragColumnId);
            return next;
        });
        setDragColumnId(null);
    };

    const toDateOnly = (value?: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
    };

    const getLeadRawValue = (lead: any, id: string) => {
        if (!lead) return '';
        if (id.startsWith('custom:')) {
            const fieldId = id.replace('custom:', '');
            return lead.custom_data?.[fieldId] ?? '';
        }
        switch (id) {
            case 'registration_date':
                return lead.registration_date || lead.registrationDate || lead.date || lead.created_at || '';
            case 'company_name':
                return lead.company_name || lead.company || lead.name || '';
            case 'email':
                return lead.email || '';
            case 'closing_cycle':
                return lead.closing_cycle || lead.closingCycle || '';
            case 'mobile_number':
                return lead.mobile_number || lead.phone || '';
            case 'closing_date':
                return lead.expected_closing || lead.closingDate || lead.expected_close_date || '';
            case 'remarks':
                return lead.remarks || '';
            case 'department':
                return lead.department || '';
            case 'status':
                return lead.status || '';
            case 'lead_source':
                if (lead.source_data?.name) return lead.source_data.name;
                if (lead.lead_source?.name) return lead.lead_source.name;
                if (lead.lead_source && typeof lead.lead_source === 'object') return lead.lead_source.name ?? '';
                return leadSourceMap[lead.lead_source] || lead.lead_source || lead.source || '';
            default:
                return '';
        }
    };

    const customDateFieldIds = new Set(
        customFields.filter((field) => field.field_type === 'date').map((field) => `custom:${field.id}`)
    );

    const formatLeadValue = (lead: any, id: string, index: number) => {
        if (id === 'sno') return index + 1;
        const raw = getLeadRawValue(lead, id);
        if (id === 'registration_date' || id === 'closing_date' || customDateFieldIds.has(id)) {
            return formatDate(raw);
        }
        if (raw === '' || raw === null || raw === undefined) return '-';
        if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
        if (Array.isArray(raw)) return raw.join(', ');
        if (typeof raw === 'object') return JSON.stringify(raw);
        return raw;
    };

    const leadFilterFields = [
        { id: 'registration_date', label: 'Registration Date', type: 'date' },
        { id: 'company_name', label: 'Company Name', type: 'text' },
        { id: 'email', label: 'Contact Email', type: 'text' },
        { id: 'closing_cycle', label: 'Closing Cycle', type: 'text' },
        { id: 'mobile_number', label: 'Mobile Number', type: 'text' },
        { id: 'closing_date', label: 'Closing Date', type: 'date' },
        { id: 'remarks', label: 'Remarks', type: 'text' },
        { id: 'department', label: 'Department', type: 'select', options: ['Sales', 'Marketing', 'Operations'] },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: ['New', 'Contacted', 'Qualified', 'Nurturing', 'Converted', 'Lost']
        },
        {
            id: 'lead_source',
            label: 'Lead Source',
            type: 'select',
            options: leadOptions.leadSources?.map((s: any) => s.name) || []
        },
        {
            id: 'brand',
            label: 'Brand',
            type: 'select',
            options: leadOptions.brands?.map((b: any) => b.name) || []
        },
        {
            id: 'lead_owner',
            label: 'Lead Owner',
            type: 'select',
            options: leadOptions.leadOwners?.length > 0
                ? leadOptions.leadOwners.map((o: any) => o.name)
                : leadOptions.users?.map((u: any) => `${u.first_name} ${u.last_name}`) || []
        }
    ];

    const baseLeadColumns = [
        { id: 'sno', label: 'S.No' },
        { id: 'registration_date', label: 'Registration Date' },
        { id: 'company_name', label: 'Company Name' },
        { id: 'email', label: 'Contact Email' },
        { id: 'closing_cycle', label: 'Closing Cycle' },
        { id: 'mobile_number', label: 'Mobile Number' },
        { id: 'closing_date', label: 'Closing Date' },
        { id: 'remarks', label: 'Remarks' },
        { id: 'department', label: 'Department' },
        { id: 'status', label: 'Status' },
        { id: 'lead_source', label: 'Lead Source' }
    ];

    const customFilterFields = customFields.map((field) => ({
        id: `custom:${field.id}`,
        label: field.label,
        type: field.field_type === 'date'
            ? 'date'
            : field.field_type === 'number'
                ? 'number'
                : field.field_type === 'dropdown' || field.field_type === 'radio' || field.field_type === 'checkbox'
                    ? 'select'
                    : 'text',
        options: field.field_type === 'checkbox' ? ['Yes', 'No'] : field.options || undefined
    }));

    const allFilterFields = [...leadFilterFields, ...customFilterFields];

    const customColumns = customFields.map((field) => ({
        id: `custom:${field.id}`,
        label: field.label
    }));

    const allColumns = [...baseLeadColumns, ...customColumns];
    const columnIds = allColumns.map((col) => col.id);

    useEffect(() => {
        if (columnPrefsLoaded) return;
        try {
            const stored = localStorage.getItem(LEADS_COLUMN_PREF_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
                setColumnOrder((prev) => {
                    const filtered = parsed.columnOrder.filter((id: string) => columnIds.includes(id));
                    const missing = columnIds.filter((id) => !filtered.includes(id));
                    return [...filtered, ...missing];
                });
            }
            if (parsed.visibleColumns && typeof parsed.visibleColumns === 'object') {
                setVisibleColumns((prev) => {
                    const next: Record<string, boolean> = { ...prev, ...parsed.visibleColumns };
                    columnIds.forEach((id) => {
                        if (next[id] === undefined) next[id] = true;
                    });
                    Object.keys(next).forEach((id) => {
                        if (!columnIds.includes(id)) delete next[id];
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error('Failed to load lead column preferences:', error);
        }
        setColumnPrefsLoaded(true);
    }, [columnIds]);

    useEffect(() => {
        setColumnOrder((prev) => {
            if (prev.length === 0) return columnIds;
            const existing = prev.filter((id) => columnIds.includes(id));
            const missing = columnIds.filter((id) => !existing.includes(id));
            return [...existing, ...missing];
        });
        setVisibleColumns((prev) => {
            const next: Record<string, boolean> = { ...prev };
            columnIds.forEach((id) => {
                if (next[id] === undefined) next[id] = false;
            });
            Object.keys(next).forEach((id) => {
                if (!columnIds.includes(id)) delete next[id];
            });
            return next;
        });
    }, [customFields.length]);

    useEffect(() => {
        if (!columnPrefsLoaded) return;
        try {
            localStorage.setItem(LEADS_COLUMN_PREF_KEY, JSON.stringify({
                columnOrder,
                visibleColumns
            }));
        } catch (error) {
            console.error('Failed to save lead column preferences:', error);
        }
    }, [columnOrder, visibleColumns, columnPrefsLoaded]);

    const columnsById = allColumns.reduce<Record<string, { id: string; label: string }>>((acc, column) => {
        acc[column.id] = column;
        return acc;
    }, {});

    const orderedColumns = columnOrder.filter((id) => columnsById[id]);
    const filteredColumns = orderedColumns
        .map((id) => columnsById[id])
        .filter((col) => col.label.toLowerCase().includes(columnsSearch.toLowerCase()));

    const orderedVisibleColumns = orderedColumns.filter((id) => visibleColumns[id]);

    const filteredLeads = leads.filter((lead) => lead && typeof lead === 'object').filter((lead) => {
        for (const field of allFilterFields) {
            const value = filters[field.id];
            if (!value) continue;
            const raw = getLeadRawValue(lead, field.id);
            if (field.type === 'date') {
                if (toDateOnly(raw) !== value) return false;
                continue;
            }
            if (field.type === 'select' && value.toLowerCase() === 'all') continue;
            const normalized = raw === true ? 'yes' : raw === false ? 'no' : String(raw ?? '');
            const text = normalized.toLowerCase();
            if (!text.includes(value.toLowerCase())) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <Layout title="Leads Management">
                <div className="flex items-center justify-center h-full">
                    <div className="text-white">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Leads Management">
            {/* Page Action Bar */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Header Section */}
                <div className="flex items-center justify-between surface-panel p-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Leads Management</h2>
                        <p className="text-sm text-muted mt-1">Total leads: {leads.length}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && canDeleteLead && (
                            <Button variant="danger" icon={TrashIcon} onClick={handleBulkDelete}>
                                Delete ({selectedIds.size})
                            </Button>
                        )}
                        {canCreateLead && (
                            <Button variant="secondary" icon={ArrowUpTrayIcon} onClick={() => fileInputRef.current?.click()}>Import</Button>
                        )}
                        {canCreateLead && (
                            <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={exportLeadsToCsv}>Export</Button>
                        )}
                        <div className="w-px h-8 bg-gray-200 mx-1"></div>
                        <Button variant="secondary" className="px-3" onClick={() => setIsFilterModalOpen(true)}><FunnelIcon className="w-5 h-5" /></Button>
                        <Button variant="secondary" className="px-3" onClick={() => setIsColumnsModalOpen(true)}><AdjustmentsHorizontalIcon className="w-5 h-5" /></Button>
                        {canCreateLead && (
                            <Button icon={PlusIcon} onClick={openCreate}>Add Lead</Button>
                        )}
                    </div>
                </div>

                {importMessage && (
                    <div className={`rounded-lg px-4 py-3 text-sm border ${importMessage.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : importMessage.type === 'error'
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}>
                        {importMessage.text}
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
                    <input
                        type="text"
                        placeholder="Search leads by company or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--surface-input)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder-[var(--text-muted)]"
                    />
                </div>

                {/* Table */}
                <div
                    className="surface-panel overflow-x-auto relative"

                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                >
                    {isDraggingFile && (
                        <div className="absolute inset-0 z-10 bg-dark-900/80 border-2 border-dashed border-primary-500 flex items-center justify-center text-primary-300 text-sm">
                            Drop CSV file to import leads
                        </div>
                    )}
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-800/50">
                                <th className="px-6 py-4 w-12 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/20 bg-black/20 text-blue-500 focus:ring-offset-0"
                                        checked={leads.length > 0 && selectedIds.size === leads.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {orderedVisibleColumns.map((columnId) => (
                                    <th key={columnId} className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-left">
                                        {columnsById[columnId]?.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {filteredLeads.map((lead, index) => (
                            <tr
                                key={lead.id}
                                className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                role="button"
                                onClick={() => openView(lead)}
                            >
                                <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/20 bg-black/20 text-blue-500 focus:ring-offset-0"
                                        checked={selectedIds.has(lead.id)}
                                        onChange={() => handleSelectOne(lead.id)}
                                    />
                                </td>
                                {orderedVisibleColumns.map((columnId) => (
                                    <td key={columnId} className="px-6 py-4 text-sm text-white">
                                        {formatLeadValue(lead, columnId, index)}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="text-gray-400 hover:text-emerald-500"
                                            title="Convert to Customer"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setLeadToConvert(lead);
                                                setIsConvertModalOpen(true);
                                            }}
                                        >
                                            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="text-gray-400 hover:text-white"
                                            title="View"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openView(lead);
                                            }}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        {canEditLead && (
                                            <button
                                                className="text-gray-400 hover:text-blue-400"
                                                title="Edit"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openEdit(lead);
                                                }}
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDeleteLead && (
                                            <button
                                                className="text-gray-400 hover:text-red-400"
                                                title="Delete"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(lead.id);
                                                }}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-center bg-slate-900/50 rounded-b-xl">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Showing <span className="text-white font-medium">1</span> to <span className="text-white font-medium">{filteredLeads.length}</span> of <span className="text-white font-medium">{filteredLeads.length}</span> leads</span>
                        <div className="h-4 w-px bg-white/10 mx-2"></div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-50 transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <button className="w-8 h-8 rounded-lg bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-900/20">1</button>
                            <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-50 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>


            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filter Leads"
                maxWidth="4xl"
            >
                <div className="grid gap-4 md:grid-cols-3">
                    {allFilterFields.map((field) => (
                        <div key={field.id}>
                            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.3em]">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    value={filters[field.id] || ''}
                                    onChange={(e) => setFilterValue(field.id, e.target.value)}
                                    className="mt-3 w-full rounded-2xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-white placeholder-white/60 shadow-inner focus:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    {(field.options || []).map((option: string) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                                    value={filters[field.id] || ''}
                                    onChange={(e) => setFilterValue(field.id, e.target.value)}
                                    placeholder="Contains..."
                                    className="mt-3 w-full rounded-2xl border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-white placeholder-white/60 shadow-inner focus:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={resetFilters}>Reset</Button>
                    <Button variant="secondary" onClick={() => setIsFilterModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsFilterModalOpen(false)}>Search</Button>
                </div>
            </Modal>

            <Modal
                isOpen={isColumnsModalOpen}
                onClose={() => setIsColumnsModalOpen(false)}
                title="Customize Columns"
                maxWidth="lg"
            >
                <div className="text-xs text-gray-400 mb-3">
                    {Object.values(visibleColumns).filter(Boolean).length} of {allColumns.length} Selected
                </div>
                <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={columnsSearch}
                        onChange={(e) => setColumnsSearch(e.target.value)}
                        placeholder="Search columns..."
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                </div>
                <div className="max-h-72 overflow-y-auto pr-2">
                    {filteredColumns.map((column) => (
                        <div
                            key={column.id}
                            draggable
                            onDragStart={() => handleColumnDragStart(column.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleColumnDrop(column.id)}
                            onDragEnd={() => setDragColumnId(null)}
                            className={`flex items-center justify-between py-2 px-2 rounded-lg hover:bg-dark-800 ${dragColumnId === column.id ? 'bg-dark-800' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 text-sm">≡</span>
                                <span className="text-sm text-white">{column.label}</span>
                            </div>
                            <input
                                type="checkbox"
                                className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-offset-dark-900"
                                checked={visibleColumns[column.id]}
                                onChange={() => toggleColumn(column.id)}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={() => setIsColumnsModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => setIsColumnsModalOpen(false)}>Save</Button>
                </div>
            </Modal>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitLead}
                mode={modalMode}
                initialData={selectedLead}
            />

            {/* Convert to Customer Confirmation Modal */}
            <Modal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                title=""
                maxWidth="md"
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <ExclamationTriangleIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Convert to Customer?</h3>
                    <p className="text-gray-500 mb-8 leading-relaxed max-w-sm">
                        Are you sure you want to convert this lead into a customer? This will pre-fill the customer registration form with current lead information.
                    </p>
                    <div className="flex items-center gap-4 w-full">
                        <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsConvertModalOpen(false)}>No</Button>
                        <Button variant="primary" className="flex-1 py-3" onClick={handleConvertConfirm}>Yes</Button>
                    </div>
                </div>
            </Modal>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileInputChange}
            />
        </Layout>
    );
}
