import { useState, useEffect, useRef } from 'react';
import { useMemo } from 'react';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import DealFormModal from '../components/deals/DealFormModal';
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
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';
const DEALS_COLUMN_PREF_KEY = 'docuflow.deals.columns';

export default function DealsPage() {
    const navigate = useNavigate();
    const { getAccessToken, hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({
        cif: '',
        name: '',
        company_name: '',
        brand: '',
        email: '',
        contact_no: '',
        lead_source: '',
        service_amount: '',
        service_closed: '',
        payment_status: '',
        deal_date: '',
        closing_date: '',
        remarks: '',
        department: ''
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
        leadSources: [],
        servicesRequired: []
    });
    const dealLeadSourceMap = useMemo(() => {
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
        cif: true,
        name: true,
        company_name: true,
        brand: true,
        email: true,
        contact_no: true,
        lead_source: true,
        service_amount: true,
        service_closed: true,
        payment_status: true,
        deal_date: true,
        closing_date: true,
        remarks: true,
        department: true
    });
    const [columnOrder, setColumnOrder] = useState<string[]>([
        'sno',
        'cif',
        'name',
        'company_name',
        'brand',
        'email',
        'contact_no',
        'lead_source',
        'service_amount',
        'service_closed',
        'payment_status',
        'deal_date',
        'closing_date',
        'remarks',
        'department'
    ]);
    const [columnPrefsLoaded, setColumnPrefsLoaded] = useState(false);
    const [dragColumnId, setDragColumnId] = useState<string | null>(null);

    const fetchDeals = async (params?: { search?: string }) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/deals`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            setDeals(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch deals:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDeals({ search: searchTerm || undefined });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const token = await getAccessToken();
                const [fieldsRes, optionsRes] = await Promise.all([
                    axios.get(`${API_BASE}/custom-fields`, {
                        params: { module: 'deals' },
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
            setSelectedIds(new Set(deals.map(d => d.id)));
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
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} deals?`)) return;

        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/deals/bulk-delete`, {
                ids: Array.from(selectedIds)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedIds(new Set());
            fetchDeals();
        } catch (error) {
            console.error('Failed to bulk delete deals:', error);
            alert('Failed to delete deals');
        }
    };

    const handleCreateDeal = async (data: any) => {
        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/deals`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            fetchDeals();
        } catch (error) {
            console.error('Failed to create deal:', error);
        }
    };

    const handleUpdateDeal = async (id: string, data: any) => {
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/deals/${id}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            fetchDeals();
        } catch (error) {
            console.error('Failed to update deal:', error);
        }
    };

    const handleSubmitDeal = async (data: any) => {
        if (modalMode === 'edit' && selectedDeal?.id) {
            await handleUpdateDeal(selectedDeal.id, data);
            return;
        }
        await handleCreateDeal(data);
    };

    const openCreate = () => {
        setSelectedDeal(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const openView = (deal: any) => {
        navigate(`/deals/${deal.id}`);
    };

    const openEdit = (deal: any) => {
        setSelectedDeal(deal);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this deal?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/deals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDeals();
        } catch (error) {
            console.error('Failed to delete deal:', error);
        }
    }

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            cif: '',
            name: '',
            company_name: '',
            brand: '',
            email: '',
            contact_no: '',
            lead_source: '',
            service_amount: '',
            service_closed: '',
            payment_status: '',
            deal_date: '',
            closing_date: '',
            remarks: '',
            department: ''
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

    const importDealsFromCsv = async (file: File) => {
        if (!file) return;
        setImportMessage({ type: 'info', text: 'Importing deals...' });
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
                    cif: row.cif || row.cif_no || row.cifno || null,
                    name: row.name || row.title || null,
                    company_name: row.company_name || row.company || null,
                    contact_number: row.contact_number || row.contact || row.phone || null,
                    email: row.email || null,
                    service_amount: row.service_amount || row.value || row.amount || null,
                    deal_date: row.deal_date || row.date || null,
                    closing_date: row.closing_date || row.expected_close_date || null
                };
                if (!payload.name && !payload.company_name && !payload.email) {
                    continue;
                }
                await axios.post(`${API_BASE}/deals`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                imported += 1;
            }
            setImportMessage({ type: 'success', text: `Imported ${imported} deal(s).` });
            fetchDeals({ search: searchTerm || undefined });
        } catch (error) {
            console.error('Failed to import deals:', error);
            setImportMessage({ type: 'error', text: 'Import failed. Please check the CSV format.' });
        }
    };

    const exportDealsToCsv = () => {
        const columns = [
            { key: 'cif', label: 'CIF No' },
            { key: 'deal_date', label: 'Deal Date' },
            { key: 'name', label: 'Name' },
            { key: 'company_name', label: 'Company Name' },
            { key: 'contact_number', label: 'Contact Number' },
            { key: 'email', label: 'Email' },
            { key: 'service_amount', label: 'Service Amount' }
        ];

        const escapeCsv = (value: string) => {
            if (value.includes('"')) value = value.replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('\r')) {
                return `"${value}"`;
            }
            return value;
        };

        const headerLine = columns.map((col) => col.label).join(',');
        const lines = deals.map((deal) => columns.map((col) => escapeCsv(String(deal[col.key] ?? ''))).join(','));
        const csv = [headerLine, ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'deals.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importDealsFromCsv(file);
            event.target.value = '';
        }
    };

    const canCreateDeal = hasPermission('deals.create');
    const canEditDeal = hasPermission('deals.edit');
    const canDeleteDeal = hasPermission('deals.delete');

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingFile(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            importDealsFromCsv(file);
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

    const getDealRawValue = (deal: any, id: string) => {
        if (!deal) return '';
        if (id.startsWith('custom:')) {
            const fieldId = id.replace('custom:', '');
            return deal.custom_data?.[fieldId] ?? '';
        }
        switch (id) {
            case 'cif':
                return deal.cif || '';
            case 'name':
                return deal.name || deal.title || '';
            case 'company_name':
                return deal.company_name || '';
            case 'brand':
                return deal.brand_data?.name || deal.brand || '';
            case 'email':
                return deal.email || '';
            case 'contact_no':
                return deal.contact_number || deal.contactNo || '';
            case 'lead_source':
                if (deal.source_data?.name) return deal.source_data.name;
                if (deal.lead_source?.name) return deal.lead_source.name;
                if (deal.lead_source && typeof deal.lead_source === 'object') return deal.lead_source.name ?? '';
                return dealLeadSourceMap[deal.lead_source] || deal.lead_source || '';
            case 'service_amount':
                return deal.service_amount ?? deal.value ?? '';
            case 'service_closed':
                return deal.service_closed ? 'Yes' : deal.serviceClosed || '';
            case 'payment_status':
                return deal.payment_status || '';
            case 'deal_date':
                return deal.deal_date || deal.created_at || '';
            case 'closing_date':
                return deal.closing_date || deal.expected_close_date || '';
            case 'remarks':
                return deal.remarks || deal.custom_data?.remarks || '';
            case 'department':
                return deal.department || '';
            default:
                return '';
        }
    };

    const customDateFieldIds = new Set(
        customFields.filter((field) => field.field_type === 'date').map((field) => `custom:${field.id}`)
    );

    const formatDealValue = (deal: any, id: string, index: number) => {
        if (id === 'sno') return index + 1;
        const raw = getDealRawValue(deal, id);
        if (id === 'deal_date' || id === 'closing_date' || customDateFieldIds.has(id)) {
            return formatDate(raw);
        }
        if (raw === '' || raw === null || raw === undefined) return '-';
        if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
        if (Array.isArray(raw)) return raw.join(', ');
        if (typeof raw === 'object') return JSON.stringify(raw);
        return raw;
    };

    const dealFilterFields = [
        { id: 'cif', label: 'CIF No', type: 'text' },
        { id: 'name', label: 'Name', type: 'text' },
        { id: 'company_name', label: 'Company Name', type: 'text' },
        {
            id: 'brand',
            label: 'Brand',
            type: 'select',
            options: leadOptions.brands?.map((b: any) => b.name) || []
        },
        { id: 'email', label: 'Email', type: 'text' },
        { id: 'contact_no', label: 'Contact No', type: 'text' },
        {
            id: 'lead_source',
            label: 'Lead Source',
            type: 'select',
            options: leadOptions.leadSources?.map((s: any) => s.name) || []
        },
        { id: 'service_amount', label: 'Service Amount', type: 'number' },
        { id: 'service_closed', label: 'Service Closed', type: 'select', options: ['Yes', 'No'] },
        { id: 'payment_status', label: 'Payment Status', type: 'select', options: ['Pending', 'Paid'] },
        { id: 'deal_date', label: 'Deal Date', type: 'date' },
        { id: 'closing_date', label: 'Closing Date', type: 'date' },
        { id: 'remarks', label: 'Remarks', type: 'text' },
        { id: 'department', label: 'Department', type: 'text' }
    ];

    const baseDealColumns = [
        { id: 'sno', label: 'S.No' },
        { id: 'cif', label: 'CIF No' },
        { id: 'name', label: 'Name' },
        { id: 'company_name', label: 'Company Name' },
        { id: 'brand', label: 'Brand' },
        { id: 'email', label: 'Email' },
        { id: 'contact_no', label: 'Contact No' },
        { id: 'lead_source', label: 'Lead Source' },
        { id: 'service_amount', label: 'Service Amount' },
        { id: 'service_closed', label: 'Service Closed' },
        { id: 'payment_status', label: 'Payment Status' },
        { id: 'deal_date', label: 'Deal Date' },
        { id: 'closing_date', label: 'Closing Date' },
        { id: 'remarks', label: 'Remarks' },
        { id: 'department', label: 'Department' }
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

    const allFilterFields = [...dealFilterFields, ...customFilterFields];

    const customColumns = customFields.map((field) => ({
        id: `custom:${field.id}`,
        label: field.label
    }));

    const allColumns = [...baseDealColumns, ...customColumns];
    const columnIds = allColumns.map((col) => col.id);

    useEffect(() => {
        if (columnPrefsLoaded) return;
        try {
            const stored = localStorage.getItem(DEALS_COLUMN_PREF_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
        if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
            setColumnOrder(() => {
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
            console.error('Failed to load deal column preferences:', error);
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
            localStorage.setItem(DEALS_COLUMN_PREF_KEY, JSON.stringify({
                columnOrder,
                visibleColumns
            }));
        } catch (error) {
            console.error('Failed to save deal column preferences:', error);
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

    const filteredDeals = deals.filter((deal) => deal && typeof deal === 'object').filter((deal) => {
        for (const field of allFilterFields) {
            const value = filters[field.id];
            if (!value) continue;
            const raw = getDealRawValue(deal, field.id);
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
            <Layout title="Deals Management">
                <div className="flex items-center justify-center h-full">
                    <div className="text-white">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Deals Management">
            {/* Page Action Bar */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Header Section */}
                <div className="flex items-center justify-between surface-panel p-4 rounded-xl border border-[var(--surface-border)] shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-white">Deals Management</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage and track your active business deals</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && canDeleteDeal && (
                            <Button variant="danger" icon={TrashIcon} onClick={handleBulkDelete}>
                                Delete ({selectedIds.size})
                            </Button>
                        )}
                        {canCreateDeal && (
                            <Button variant="secondary" icon={ArrowUpTrayIcon} onClick={() => fileInputRef.current?.click()}>Import</Button>
                        )}
                        {canCreateDeal && (
                            <Button variant="secondary" icon={ArrowDownTrayIcon} onClick={exportDealsToCsv}>Export</Button>
                        )}
                        <div className="w-px h-8 bg-gray-200 mx-1"></div>
                        <Button variant="secondary" className="px-3" onClick={() => setIsFilterModalOpen(true)}><FunnelIcon className="w-5 h-5" /></Button>
                        <Button variant="secondary" className="px-3" onClick={() => setIsColumnsModalOpen(true)}><AdjustmentsHorizontalIcon className="w-5 h-5" /></Button>
                        {canCreateDeal && (
                            <Button icon={PlusIcon} onClick={openCreate}>New Deal</Button>
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
                    <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search deals by CIF, company, or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--surface-input)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none shadow-sm"
                    />
                </div>

                {/* Table */}
                <div
                    className="surface-panel rounded-xl border border-[var(--surface-border)] overflow-x-auto relative shadow-sm"

                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                    }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={handleFileDrop}
                >
                    {isDraggingFile && (
                        <div className="absolute inset-0 z-10 bg-white/90 border-2 border-dashed border-primary-500 flex items-center justify-center text-primary-600 font-bold text-sm">
                            Drop CSV file to import deals
                        </div>
                    )}
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-panel)]">
                                <th className="px-6 py-4 w-12 text-left">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 bg-white text-primary-500 focus:ring-offset-white"
                                        checked={deals.length > 0 && selectedIds.size === deals.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {orderedVisibleColumns.map((columnId) => (
                                    <th key={columnId} className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-left">
                                        {columnsById[columnId]?.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {filteredDeals.map((deal, index) => (
                            <tr
                                key={deal.id}
                                className="hover:bg-[var(--surface-elevated)] transition-colors group cursor-pointer"
                                role="button"
                                onClick={() => openView(deal)}
                            >
                                <td className="px-6 py-4" onClick={(event) => event.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 bg-white text-primary-500 focus:ring-offset-white"
                                        checked={selectedIds.has(deal.id)}
                                        onChange={() => handleSelectOne(deal.id)}
                                    />
                                </td>
                                {orderedVisibleColumns.map((columnId) => (
                                    <td key={columnId} className="px-6 py-4 text-sm text-white">
                                        {formatDealValue(deal, columnId, index)}
                                    </td>
                                ))}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            className="text-gray-400 hover:text-white"
                                            title="View"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openView(deal);
                                            }}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        {canEditDeal && (
                                            <button
                                                className="text-gray-400 hover:text-blue-400"
                                                title="Edit"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openEdit(deal);
                                                }}
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDeleteDeal && (
                                            <button
                                                className="text-gray-400 hover:text-red-400"
                                                title="Delete"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleDelete(deal.id);
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
                    {filteredDeals.length === 0 && (
                        <div className="p-8 text-center text-[var(--text-secondary)]">
                            No deals found. Create a new deal to get started.
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filter Deals"
                maxWidth="4xl"
            >
                <div className="grid gap-4 md:grid-cols-3">
                    {allFilterFields.map((field) => (
                        <div key={field.id}>
                            <label className="text-xs font-semibold text-gray-400 uppercase">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    value={filters[field.id] || ''}
                                    onChange={(e) => setFilterValue(field.id, e.target.value)}
                                    className="mt-2 w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
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
                                    className="mt-2 w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
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
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={columnsSearch}
                        onChange={(e) => setColumnsSearch(e.target.value)}
                        placeholder="Search columns..."
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
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
                            className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors ${dragColumnId === column.id ? 'bg-primary-50 border border-primary-200' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm">≡</span>
                                <span className="text-sm font-medium text-gray-700">{column.label}</span>
                            </div>
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-500"
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

            <DealFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitDeal}
                mode={modalMode}
                initialData={selectedDeal}
            />
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
