import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import type { CustomField } from '../components/custom-fields/CustomFieldInputs';
import {
    PlusIcon,
    FunnelIcon,
    AdjustmentsHorizontalIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    Bars3Icon,
    BriefcaseIcon,
    BanknotesIcon,
    UserCircleIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CustomerListTile from '../components/customers/CustomerListTile';
import CustomerDetailSplitView from '../components/customers/CustomerDetailSplitView';
import { MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// dnd-kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const CUSTOMERS_COLUMN_PREF_KEY = 'docuflow.customers.columns';
const DEFAULT_CUSTOMER_VISIBLE_COLUMNS: Record<string, boolean> = {
    cif: true,
    company_name: true,
    email: true,
    mobile: true,
    trn: true,
    type: true
};

interface SortableItemProps {
    id: string;
    label: string;
    checked: boolean;
    onToggle: () => void;
}

function SortableColumnItem({ id, label, checked, onToggle }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 surface-panel border ${isDragging ? 'border-blue-500 shadow-lg' : 'border-white/10'} rounded-xl transition-all`}>
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted hover:text-white">
                <Bars3Icon className="w-4 h-4" />
            </div>
            <label className="flex-1 flex items-center gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onToggle}
                    className="rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-white">{label}</span>
            </label>
        </div>
    );
}

export default function CustomersPage() {
    console.log('[CustomersPage] Component rendering');
    const location = useLocation();
    const { getAccessToken, hasPermission } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'split'>('table');
    const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

    console.log('[CustomersPage] State - customers:', customers.length, 'viewMode:', viewMode);

    // Expanded Filters
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [activeFilterTab, setActiveFilterTab] = useState<'general' | 'business' | 'tax' | 'others'>('general');

    // Filtered customers list for both views
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            // Priority 1: Search Term
            const search = searchTerm.toLowerCase();
            const name = (c.company_name || c.display_name || '').toLowerCase();
            const email = (c.email || '').toLowerCase();
            const mobile = (c.mobile || c.work_phone || '').toLowerCase();
            const cif = (c.cif || '').toLowerCase();

            const matchesSearch = !search ||
                name.includes(search) ||
                email.includes(search) ||
                mobile.includes(search) ||
                cif.includes(search);

            if (!matchesSearch) return false;

            // Priority 2: Advanced Filters
            for (const [key, value] of Object.entries(filters)) {
                if (!value) continue;
                let raw = c[key];
                if (key.startsWith('custom:')) {
                    const fieldId = key.replace('custom:', '');
                    raw = c.custom_data?.[fieldId];
                } else if (key === 'company_name') {
                    raw = (c.company_name || `${c.first_name || ''} ${c.last_name || ''}`);
                }
                if (!String(raw).toLowerCase().includes(value.toLowerCase())) return false;
            }

            return true;
        });
    }, [customers, searchTerm, filters]);

    const activeCustomer = useMemo(() =>
        customers.find(c => c.id === activeCustomerId),
        [customers, activeCustomerId]);

    // Expanded Filters

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    // Default Visible Columns
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_CUSTOMER_VISIBLE_COLUMNS);
    const [columnOrder, setColumnOrder] = useState<string[]>([]);

const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
    []
);

    const canCreateCustomer = hasPermission('customers.create');
    const canEditCustomer = hasPermission('customers.edit');
    const canDeleteCustomer = hasPermission('customers.delete');
    const baseColumns = useMemo(() => [
        { id: 'cif', label: 'CIF', category: 'general' },
        { id: 'type', label: 'Customer Type', category: 'general' },
        { id: 'company_name', label: 'Company/Full Name', category: 'general' },
        { id: 'email', label: 'Email', category: 'general' },
        { id: 'mobile', label: 'Mobile', category: 'general' },
        { id: 'work_phone', label: 'Work Phone', category: 'general' },
        { id: 'trn', label: 'TRN', category: 'tax' },
        { id: 'entity_type', label: 'Entity Type', category: 'business' },
        { id: 'trade_license_number', label: 'License No', category: 'business' },
        { id: 'trade_license_expiry_date', label: 'License Expiry', category: 'business' },
        { id: 'tax_treatment', label: 'Tax Treatment', category: 'tax' },
        { id: 'vat_reporting_period', label: 'VAT Period', category: 'tax' },
        { id: 'corporate_tax_trn', label: 'CT TRN', category: 'tax' },
        { id: 'incorporation_date', label: 'Inc. Date', category: 'business' },
        { id: 'place_of_supply', label: 'Place of Supply', category: 'others' },
        { id: 'currency', label: 'Currency', category: 'others' },
        { id: 'payment_terms', label: 'Payment Terms', category: 'others' },
        { id: 'portal_access', label: 'Portal Access', category: 'others' },
    ], []);

    const allColumns = useMemo(() => {
        const custom = customFields.map(f => ({ id: `custom:${f.id}`, label: f.label, category: 'custom' }));
        return [...baseColumns, ...custom];
    }, [baseColumns, customFields]);

    const columnIds = useMemo(() => allColumns.map(col => col.id), [allColumns]);

    useEffect(() => {
        if (columnOrder.length === 0 && columnIds.length > 0) {
            setColumnOrder(columnIds);
        } else if (columnIds.length > 0) {
            const existing = columnOrder.filter(id => columnIds.includes(id));
            const missing = columnIds.filter(id => !existing.includes(id));
            setColumnOrder([...existing, ...missing]);
        }
    }, [columnIds]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CUSTOMERS_COLUMN_PREF_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.visibleColumns) {
                    setVisibleColumns(prev => ({ ...prev, ...parsed.visibleColumns }));
                }
                if (parsed.columnOrder && Array.isArray(parsed.columnOrder) && parsed.columnOrder.length > 0) {
                    setColumnOrder(parsed.columnOrder);
                }
            }
        } catch (error) {
            console.error('Failed to load column preferences for customers:', error);
        }
    }, []);

    useEffect(() => {
        const missing = columnIds.filter(id => !(id in visibleColumns));
        if (missing.length > 0) {
            setVisibleColumns(prev => {
                const next = { ...prev };
                missing.forEach(id => {
                    next[id] = true;
                });
                return next;
            });
        }
    }, [columnIds, visibleColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setColumnOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const fetchCustomers = async (params?: { search?: string }) => {
        try {
            console.log('[CustomersPage] Fetching customers with params:', params);
            const token = await getAccessToken();
            console.log('[CustomersPage] Token obtained:', token ? 'Yes' : 'No');
            const response = await axios.get(`${API_BASE}/customers`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            console.log('[CustomersPage] Response received:', response.data);
            console.log('[CustomersPage] Customers count:', response.data.data?.length || 0);
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error('[CustomersPage] Failed to fetch customers:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers({ search: searchTerm || undefined });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const loadCustomFields = async () => {
            try {
                const token = await getAccessToken();
                const response = await axios.get(`${API_BASE}/custom-fields`, {
                    params: { module: 'customers' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomFields(response.data.data || []);
            } catch (error) {
                console.error('Failed to load customer custom fields:', error);
            }
        };
        loadCustomFields();
    }, [getAccessToken, API_BASE]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(customers.map(c => c.id)));
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
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} customers?`)) return;

        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/customers/bulk-delete`, {
                ids: Array.from(selectedIds)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedIds(new Set());
            fetchCustomers();
        } catch (error) {
            console.error('Failed to bulk delete customers:', error);
            alert('Failed to delete customers');
        }
    };

    useEffect(() => {
        if (location.state?.convertFromLead) {
            const leadData = location.state.convertFromLead;
            setSelectedCustomer({
                company_name: leadData.company_name,
                email: leadData.email,
                mobile: leadData.mobile,
                remarks: leadData.remarks
            });
            setModalMode('create');
            setIsModalOpen(true);
            // Clear state so it doesn't re-open on refresh or navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleSubmitCustomer = async (data: any) => {
        try {
            const token = await getAccessToken();
            if (modalMode === 'edit' && selectedCustomer?.id) {
                await axios.put(`${API_BASE}/customers/${selectedCustomer.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/customers`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Failed to save customer:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/customers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCustomers();
        } catch (error) {
            console.error('Failed to delete customer:', error);
        }
    };

    const persistCustomerColumnPreferences = () => {
        try {
            localStorage.setItem(CUSTOMERS_COLUMN_PREF_KEY, JSON.stringify({
                columnOrder,
                visibleColumns
            }));
        } catch (error) {
            console.error('Failed to persist customer column preferences:', error);
        }
    };

    const handleSaveCustomerColumns = () => {
        persistCustomerColumnPreferences();
        setIsColumnsModalOpen(false);
    };

    const formatCustomerValue = (customer: any, id: string) => {
        let raw = customer[id];
        if (id.startsWith('custom:')) {
            const fieldId = id.replace('custom:', '');
            raw = customer.custom_data?.[fieldId];
        }

        if (id === 'cif') return <span className="font-bold text-blue-400">#{raw || '---'}</span>;
        if (id === 'company_name') return (customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`).trim();
        if (id === 'type') return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${raw === 'business' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{raw}</span>;

        if (raw === null || raw === undefined || raw === '') return '-';
        if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
        if (id.includes('date') || id.includes('_at')) {
            try { return new Date(raw).toLocaleDateString(); } catch { return raw; }
        }
        return String(raw);
    };


    const orderedVisibleColumns = columnOrder.filter(id => visibleColumns[id]);
    const columnsById = allColumns.reduce<Record<string, any>>((acc, col) => ({ ...acc, [col.id]: col }), {});

    return (
        <Layout title="Customers">
            {viewMode === 'table' ? (
                <div className="flex flex-col gap-6 mb-8">
                    {/* Table Header Section */}
                    <div className="flex items-center justify-between surface-panel p-4 rounded-xl border border-[var(--surface-border)] shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">Customers</h2>
                                <p className="text-sm text-muted mt-1">Total: {filteredCustomers.length}</p>
                            </div>
                            <div className="flex-1 max-w-sm">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search customers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="!pl-9 !py-2"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedIds.size > 0 && canDeleteCustomer && (
                                <Button variant="danger" icon={TrashIcon} onClick={handleBulkDelete}>
                                    Delete ({selectedIds.size})
                                </Button>
                            )}
                            <Button variant="secondary" className="px-3" onClick={() => setIsFilterModalOpen(true)} title="Advanced Filters">
                                <FunnelIcon className="w-5 h-5" />
                            </Button>
                            <Button variant="secondary" className="px-3" onClick={() => setIsColumnsModalOpen(true)} title="Customize Columns">
                                <AdjustmentsHorizontalIcon className="w-5 h-5" />
                            </Button>
                            {canCreateCustomer && (
                                <Button icon={PlusIcon} onClick={() => { setSelectedCustomer(null); setModalMode('create'); setIsModalOpen(true); }}>
                                    Add Customer
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="surface-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="px-6 py-4 w-12 text-left">
                                            <input
                                                type="checkbox"
                                                className="rounded border-white/20 bg-black/20 text-blue-500 focus:ring-offset-0"
                                                checked={customers.length > 0 && selectedIds.size === customers.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        {orderedVisibleColumns.map(colId => (
                                            <th key={colId} className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-left whitespace-nowrap">
                                                {columnsById[colId]?.label}
                                            </th>
                                        ))}
                                        <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredCustomers.map(customer => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => {
                                                setActiveCustomerId(customer.id);
                                                setViewMode('split');
                                            }}
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-white/20 bg-black/20 text-blue-500 focus:ring-offset-0"
                                                    checked={selectedIds.has(customer.id)}
                                                    onChange={() => handleSelectOne(customer.id)}
                                                />
                                            </td>
                                            {orderedVisibleColumns.map(colId => (
                                                <td key={colId} className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                                                    {formatCustomerValue(customer, colId)}
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="text-gray-400 hover:text-blue-400" title="View" onClick={() => { setSelectedCustomer(customer); setModalMode('view'); setIsModalOpen(true); }}><EyeIcon className="w-4 h-4" /></button>
                                                    {canEditCustomer && (
                                                        <button className="text-gray-400 hover:text-blue-400" title="Edit" onClick={() => { setSelectedCustomer(customer); setModalMode('edit'); setIsModalOpen(true); }}><PencilSquareIcon className="w-4 h-4" /></button>
                                                    )}
                                                    {canDeleteCustomer && (
                                                        <button className="text-gray-400 hover:text-red-400" title="Delete" onClick={() => handleDelete(customer.id)}><TrashIcon className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <tr>
                                            <td colSpan={orderedVisibleColumns.length + 2} className="px-6 py-12 text-center text-gray-400 italic">No customers found matching your criteria</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Split View Layout */
                <div className="fixed inset-0 z-[40] flex mt-16 bg-[var(--surface-page)]">
                    {/* Left Sidebar List */}
                    <div className="w-80 md:w-96 border-r border-[var(--surface-border)] flex flex-col h-full bg-[var(--surface-panel)]">
                        <div className="p-6 pb-2">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className="p-1 px-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
                                    </button>
                                </div>
                                <Button
                                    className="!p-2 !rounded-lg hover:!bg-blue-500 shadow-lg shadow-blue-600/20"
                                    style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                    onClick={() => { setSelectedCustomer(null); setModalMode('create'); setIsModalOpen(true); }}
                                >
                                    <PlusIcon className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                            <div className="relative mb-4">
                                <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredCustomers.map(customer => (
                                <CustomerListTile
                                    key={customer.id}
                                    customer={customer}
                                    isActive={activeCustomerId === customer.id}
                                    onClick={() => setActiveCustomerId(customer.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Detail Pane */}
                    <div className="flex-1 overflow-hidden">
                        {activeCustomer ? (
                            <CustomerDetailSplitView
                                customer={activeCustomer}
                                onEdit={() => { setSelectedCustomer(activeCustomer); setModalMode('edit'); setIsModalOpen(true); }}
                                onDelete={() => handleDelete(activeCustomer.id)}
                                onClose={() => setViewMode('table')}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10 text-center bg-[var(--surface-panel)]">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <UserCircleIcon className="w-8 h-8 opacity-40" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--text-secondary)]">No Customer Selected</h3>
                                <p className="text-sm max-w-xs mt-2 opacity-60">Select a customer from the list on the left to view their detailed information and history.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Advanced Filter Modal */}
            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Advanced Filters" maxWidth="4xl">
                <div className="flex items-center border-b border-white/10 mb-6 sticky top-0 bg-[var(--surface-panel)] z-10">
                    {[
                        { id: 'general', label: 'General', icon: UserCircleIcon },
                        { id: 'business', label: 'Business', icon: BriefcaseIcon },
                        { id: 'tax', label: 'Tax', icon: BanknotesIcon },
                        { id: 'others', label: 'Financials/Others', icon: GlobeAltIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilterTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${activeFilterTab === tab.id ? 'border-blue-600 text-blue-400 bg-blue-500/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeFilterTab === 'general' && (
                            <>
                                <Input label="CIF" value={filters.cif || ''} onChange={(e) => setFilters({ ...filters, cif: e.target.value })} />
                                <Select label="Type" options={[{ value: '', label: 'All' }, { value: 'business', label: 'Business' }, { value: 'individual', label: 'Individual' }]} value={filters.type || ''} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
                                <Input label="Name" value={filters.company_name || ''} onChange={(e) => setFilters({ ...filters, company_name: e.target.value })} />
                                <Input label="Email" value={filters.email || ''} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
                                <Input label="Mobile" value={filters.mobile || ''} onChange={(e) => setFilters({ ...filters, mobile: e.target.value })} />
                                <Input label="Work Phone" value={filters.work_phone || ''} onChange={(e) => setFilters({ ...filters, work_phone: e.target.value })} />
                                <Select label="Language" options={[{ value: '', label: 'All' }, { value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' }]} value={filters.language || ''} onChange={(e) => setFilters({ ...filters, language: e.target.value })} />
                            </>
                        )}
                        {activeFilterTab === 'business' && (
                            <>
                                <Select label="Entity Type" options={[{ value: '', label: 'All' }, { value: 'LLC', label: 'LLC' }, { value: 'Sole Establishment', label: 'Sole Establishment' }]} value={filters.entity_type || ''} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })} />
                                <Input label="License Number" value={filters.trade_license_number || ''} onChange={(e) => setFilters({ ...filters, trade_license_number: e.target.value })} />
                                <Select label="Authority" options={[{ value: '', label: 'All' }, { value: 'DED Dubai', label: 'DED Dubai' }, { value: 'ADED Abu Dhabi', label: 'ADED Abu Dhabi' }]} value={filters.trade_license_authority || ''} onChange={(e) => setFilters({ ...filters, trade_license_authority: e.target.value })} />
                                <Input label="Inc. Date" type="date" value={filters.incorporation_date || ''} onChange={(e) => setFilters({ ...filters, incorporation_date: e.target.value })} />
                                <Input label="License Expiry" type="date" value={filters.trade_license_expiry_date || ''} onChange={(e) => setFilters({ ...filters, trade_license_expiry_date: e.target.value })} />
                                <Select label="Freezone" options={[{ value: '', label: 'All' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]} value={filters.is_freezone || ''} onChange={(e) => setFilters({ ...filters, is_freezone: e.target.value })} />
                            </>
                        )}
                        {activeFilterTab === 'tax' && (
                            <>
                                <Input label="TRN" value={filters.trn || ''} onChange={(e) => setFilters({ ...filters, trn: e.target.value })} />
                                <Select label="Tax Treatment" options={[{ value: '', label: 'All' }, { value: 'vat_registered', label: 'VAT Registered' }, { value: 'not_vat_registered', label: 'Not VAT Registered' }]} value={filters.tax_treatment || ''} onChange={(e) => setFilters({ ...filters, tax_treatment: e.target.value })} />
                                <Select label="VAT Period" options={[{ value: '', label: 'All' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]} value={filters.vat_reporting_period || ''} onChange={(e) => setFilters({ ...filters, vat_reporting_period: e.target.value })} />
                                <Input label="Corporate TRN" value={filters.corporate_tax_trn || ''} onChange={(e) => setFilters({ ...filters, corporate_tax_trn: e.target.value })} />
                                <Input label="Business Reg No" value={filters.business_registration_number || ''} onChange={(e) => setFilters({ ...filters, business_registration_number: e.target.value })} />
                            </>
                        )}
                        {activeFilterTab === 'others' && (
                            <>
                                <Input label="Place of Supply" value={filters.place_of_supply || ''} onChange={(e) => setFilters({ ...filters, place_of_supply: e.target.value })} />
                                <Select label="Payment Terms" options={[{ value: '', label: 'All' }, { value: 'net_30', label: 'Net 30' }, { value: 'net_60', label: 'Net 60' }]} value={filters.payment_terms || ''} onChange={(e) => setFilters({ ...filters, payment_terms: e.target.value })} />
                                <Select label="Portal Access" options={[{ value: '', label: 'All' }, { value: 'true', label: 'Granted' }, { value: 'false', label: 'No Access' }]} value={filters.portal_access || ''} onChange={(e) => setFilters({ ...filters, portal_access: e.target.value })} />
                                <Select label="Currency" options={[{ value: '', label: 'All' }, { value: 'AED', label: 'AED' }, { value: 'USD', label: 'USD' }]} value={filters.currency || ''} onChange={(e) => setFilters({ ...filters, currency: e.target.value })} />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                    <button type="button" onClick={() => setFilters({})} className="text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors">Clear All Filters</button>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setIsFilterModalOpen(false)}>Close</Button>
                        <Button onClick={() => setIsFilterModalOpen(false)} className="px-8 shadow-lg shadow-primary-600/20">Apply Filters</Button>
                    </div>
                </div>
            </Modal>

            {/* Drag and Drop Columns Modal */}
            <Modal isOpen={isColumnsModalOpen} onClose={() => setIsColumnsModalOpen(false)} title="Customize Columns" maxWidth="md">
                <p className="text-xs text-gray-400 mb-6 bg-white/5 p-3 rounded-lg border border-white/10 italic">
                    Drag the handle <Bars3Icon className="w-3 h-3 inline-block" /> to reorder columns. Toggle checkboxes to show/hide.
                </p>

                <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                            {columnOrder.map((id) => (
                                <SortableColumnItem
                                    key={id}
                                    id={id}
                                    label={columnsById[id]?.label || id}
                                    checked={visibleColumns[id] || false}
                                    onToggle={() => setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }))}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
                    <Button onClick={handleSaveCustomerColumns} variant="primary" className="px-10">Save Configuration</Button>
                </div>
            </Modal>

            <CustomerFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitCustomer}
                mode={modalMode}
                initialData={selectedCustomer}
            />
        </Layout>
    );
}
