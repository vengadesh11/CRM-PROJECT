import { useState, useEffect, useCallback } from 'react';
import {
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    IdentificationIcon,
    BanknotesIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import DealFormModal from '../deals/DealFormModal';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CustomerDetailSplitViewProps {
    customer: any;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export default function CustomerDetailSplitView({ customer, onEdit, onDelete, onClose }: CustomerDetailSplitViewProps) {
    const { getAccessToken, hasPermission } = useAuth();
    const canEditCustomer = hasPermission('customers.edit');
    const canDeleteCustomer = hasPermission('customers.delete');
    const [activeTab, setActiveTab] = useState<'Overview' | 'Deal'>('Overview');

    // Service Categories State for DnD
    const [serviceCategories, setServiceCategories] = useState<{ id: string; name: string }[]>([]);

    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [dealModalMode, setDealModalMode] = useState<'create' | 'edit'>('create');
    const [dealInitialData, setDealInitialData] = useState<any>(null);
    const [customerDeals, setCustomerDeals] = useState<any[]>([]);


    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch Services and initialize expanded state
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const token = await getAccessToken();
                const response = await axios.get(`http://localhost:3001/api/crm/sales-settings/service-required`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && Array.isArray(response.data.data)) {
                    setServiceCategories(response.data.data);
                    setExpandedServices(new Set(response.data.data.map((s: any) => s.id)));
                }
            } catch (error) {
                console.error("Failed to fetch services", error);
            }
        };
        fetchServices();
    }, [getAccessToken]);

    const fetchDeals = useCallback(async () => {
        if (activeTab === 'Deal' && customer?.cif) {
            try {
                const token = await getAccessToken();
                const response = await axios.get(`http://localhost:3001/api/crm/deals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && Array.isArray(response.data.data)) {
                    const filteredDeals = response.data.data.filter((d: any) => d.cif === customer.cif);
                    setCustomerDeals(filteredDeals);
                } else {
                    setCustomerDeals([]);
                }
            } catch (error) {
                console.error("Failed to fetch deals", error);
            }
        } else {
            setCustomerDeals([]);
        }
    }, [activeTab, customer, getAccessToken]);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setServiceCategories((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleCreateDeal = (service: { id: string, name: string }) => {
        setDealInitialData({
            name: service.name,
            cif: customer.cif,
            company_name: customer.company_name || customer.display_name,
            service: service.id, // Pre-fill the service ID
        });
        setDealModalMode('create');
        setIsDealModalOpen(true);
    };
    const handleEditDeal = (deal: any) => {
        setDealInitialData(deal);
        setDealModalMode('edit');
        setIsDealModalOpen(true);
    };

    const handleDeleteDeal = async (deal: any) => {
        if (!confirm(`Are you sure you want to delete the deal "${deal.name}"?`)) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`http://localhost:3001/api/crm/deals/${deal.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDeals();
        } catch (error) {
            console.error("Failed to delete deal", error);
        }
    };


    const handleDealSubmit = async (data: any) => {
        try {
            const token = await getAccessToken();

            if (dealModalMode === 'edit' && dealInitialData?.id) {
                // UPDATE existing deal
                await axios.put(`http://localhost:3001/api/crm/deals/${dealInitialData.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                // CREATE new deal
                await axios.post(`http://localhost:3001/api/crm/deals`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // Refresh deals
            await fetchDeals();

            setIsDealModalOpen(false);
        } catch (error) {
            console.error("Error saving deal", error);
        }
    };




    const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

    // Toggle Expand/Collapse
    const toggleExpand = (serviceId: string) => {
        setExpandedServices(prev => {
            const next = new Set(prev);
            if (next.has(serviceId)) {
                next.delete(serviceId);
            } else {
                next.add(serviceId);
            }
            return next;
        });
    };

    if (!customer) {
        return (
            <div className="flex-1 bg-[var(--surface-page)] flex items-center justify-center text-gray-400">
                Select a customer to view details
            </div>
        );
    }

    const formatValue = (value: string | number | null | undefined) => {
        if (value === undefined || value === null || value === '') return '-';
        return typeof value === 'number' ? value.toString() : value;
    };

    const formatDate = (value: string | null | undefined) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString();
    };

    const formatContactPersons = (persons: any[] | null | undefined) => {
        if (!Array.isArray(persons) || persons.length === 0) return '-';
        return persons.map(person => {
            if (person.name) return person.name;
            const fullname = `${person.first_name || ''} ${person.last_name || ''}`.trim();
            return fullname || person.email || '-';
        }).filter(Boolean).join(', ');
    };

    const DetailItem = ({ label, value }: { label: string; value: string }) => (
        <div className="flex flex-col py-3 border-b border-white/10 last:border-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">{label}</span>
            <span className="text-sm text-white font-medium">{value || '-'}</span>
        </div>
    );

    // Sortable Item Component
    const SortableServiceItem = ({
        service,
        deals,
        isExpanded,
        onToggle,
        onCreate,
        onViewDeal,
        onEditDeal,
        onDeleteDeal
    }: {
        service: { id: string; name: string },
        deals: any[],
        isExpanded: boolean,
        onToggle: () => void,
        onCreate: (s: { id: string; name: string }) => void,
        onViewDeal: (deal: any) => void,
        onEditDeal: (deal: any) => void,
        onDeleteDeal: (deal: any) => void
    }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
        } = useSortable({ id: service.id }); // Use service.id as DnD id

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };

        const formatDealDate = (value: string | null | undefined) => {
            if (!value) return '-';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleDateString();
        };

        const formatCurrency = (value: number | string | null | undefined) => {
            if (value === undefined || value === null || value === '') return '-';
            const numeric = typeof value === 'number' ? value : Number(value);
            if (Number.isNaN(numeric)) return '-';
            return `AED ${numeric.toFixed(2)}`;
        };

        const getStatusBadge = (deal: any) => {
            if (deal.service_closed) {
                return { label: 'Closed', classes: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' };
            }
            const statusText = deal.payment_status || 'Pending';
            return { label: statusText, classes: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30' };
        };


        return (
            <div ref={setNodeRef} style={style} className="bg-[var(--surface-panel)] border border-white/10 rounded-xl overflow-hidden shadow-sm mb-3">
                {/* Header */}
                <div className="p-4 flex items-center justify-between bg-[var(--surface-elevated)] border-b border-white/10">
                    <div className="flex items-center gap-4">
                        {/* Drag Handle */}
                        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </div>

                        {/* Expand/Collapse Toggle */}
                        <button
                            onClick={onToggle}
                            className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-all ${isExpanded ? 'rotate-90' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        <span className="font-bold text-white text-sm">{service.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onCreate(service)}
                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                            className="hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg border border-blue-500 hover:border-blue-400 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <span className="text-lg leading-none font-light text-white">+</span> New
                        </button>
                    </div>
                </div>

                {/* Deals List */}
                {isExpanded && (
                    <div className="bg-black/20 p-4 space-y-3 rounded-b-xl border-t border-white/10">
                        <div className="grid grid-cols-[1.2fr,1.4fr,1fr,0.8fr,0.8fr] text-[11px] text-gray-400 uppercase tracking-[0.3em] border-b border-white/10 pb-3">
                            <span>DATE</span>
                            <span>BRAND</span>
                            <span>AMOUNT</span>
                            <span>STATUS</span>
                            <span className="text-right">ACTIONS</span>
                        </div>
                        {deals.length === 0 ? (
                            <div className="text-sm text-gray-400 px-4 py-3 rounded-lg border border-white/5 text-center">
                                No deals yet for this service.
                            </div>
                        ) : (
                            deals.map((deal) => {
                                const statusBadge = getStatusBadge(deal);
                                const dealDate = deal.deal_date || deal.created_at || customer.created_at;
                                return (
                                    <div
                                        key={deal.id}
                                        className="grid grid-cols-[1.2fr,1.4fr,1fr,0.8fr,0.8fr] gap-3 items-center text-sm text-white px-4 py-3 rounded-lg border border-white/10 hover:border-blue-500/40 transition-colors"
                                    >
                                        <span className="font-semibold">{formatDealDate(dealDate)}</span>
                                        <span className="text-gray-300">
                                            {deal.brand_data?.name || deal.brand || '-'}
                                        </span>
                                        <span className="text-emerald-400 font-semibold">
                                            {formatCurrency(deal.service_amount)}
                                        </span>
                                        <span>
                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-bold ${statusBadge.classes}`}>
                                                {statusBadge.label}
                                            </span>
                                        </span>
                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                            <button
                                                onClick={() => onViewDeal(deal)}
                                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                                title="View Deal"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditDeal(deal)}
                                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                                title="Edit Deal"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteDeal(deal)}
                                                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                                title="Delete Deal"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 bg-[var(--surface-page)] flex flex-col h-full overflow-hidden text-white">
            {/* Header */}
            <div className="p-8 pb-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase max-w-2xl">
                                {customer.company_name || customer.display_name}
                            </h1>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                                <span className="text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-md tracking-widest leading-none border border-white/10 shadow-sm">
                                    {customer.cif || 'NO-CIF'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canEditCustomer && (
                            <Button
                                variant="secondary"
                                className="!bg-white/5 !border-white/10 hover:!bg-white/10 !text-white px-5 shadow-sm"
                                icon={PencilSquareIcon}
                                onClick={onEdit}
                            >
                                Edit
                            </Button>
                        )}
                        {canDeleteCustomer && (
                            <Button
                                variant="secondary"
                                className="!bg-red-500/10 !border-red-500/30 hover:!bg-red-500/20 !text-red-400 px-5"
                                icon={TrashIcon}
                                onClick={onDelete}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 mt-10 border-b border-white/10">
                    {['Overview', 'Deal'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${activeTab === tab
                                ? 'text-primary-600'
                                : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary-600 mb-2">
                        <IdentificationIcon className="w-4 h-4" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Contact Information</h2>
                    </div>
                    <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm space-y-1">
                        <DetailItem label="CIF NUMBER" value={formatValue(customer.cif)} />
                        <DetailItem label="EMAIL" value={formatValue(customer.email)} />
                        <DetailItem label="MOBILE" value={formatValue(customer.mobile)} />
                        <DetailItem label="WORK PHONE" value={formatValue(customer.work_phone)} />
                        <DetailItem label="CONTACT PERSON(S)" value={formatContactPersons(customer.contact_persons)} />
                        <DetailItem label="BILLING ADDRESS" value={formatValue(customer.billing_address)} />
                        <DetailItem label="SHIPPING ADDRESS" value={formatValue(customer.shipping_address)} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-purple-500 mb-2">
                            <IdentificationIcon className="w-4 h-4" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Business Details</h2>
                        </div>
                        <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm space-y-1">
                            <DetailItem label="ENTITY TYPE" value={formatValue(customer.entity_type)} />
                            <DetailItem label="ENTITY SUB TYPE" value={formatValue(customer.entity_sub_type)} />
                            <DetailItem label="INCORPORATION DATE" value={formatDate(customer.incorporation_date)} />
                            <DetailItem label="TRADE LICENSE AUTHORITY" value={formatValue(customer.trade_license_authority)} />
                            <DetailItem label="TRADE LICENSE NUMBER" value={formatValue(customer.trade_license_number)} />
                            <DetailItem label="TRADE LICENSE ISSUE" value={formatDate(customer.trade_license_issue_date)} />
                            <DetailItem label="TRADE LICENSE EXPIRY" value={formatDate(customer.trade_license_expiry_date)} />
                            <DetailItem label="BUSINESS ACTIVITY" value={formatValue(customer.business_activity)} />
                            <DetailItem label="FREEZONE" value={customer.is_freezone ? (customer.freezone_name || 'Yes') : 'No'} />
                            <DetailItem label="SHARE CAPITAL" value={formatValue(customer.share_capital)} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-yellow-600 mb-2">
                        <BanknotesIcon className="w-4 h-4" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Tax & Financials</h2>
                    </div>
                    <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm space-y-1">
                        <DetailItem label="TAX TREATMENT" value={customer.tax_treatment === 'vat_registered' ? 'VAT Registered' : 'Not VAT Registered'} />
                        <DetailItem label="TRN" value={formatValue(customer.trn)} />
                        <DetailItem label="VAT REG. DATE" value={formatDate(customer.vat_registered_date)} />
                        <DetailItem label="VAT REPORTING" value={formatValue(customer.vat_reporting_period)} />
                        <DetailItem label="PAYMENT TERMS" value={formatValue(customer.payment_terms)} />
                        <DetailItem label="OPENING BALANCE" value={formatValue(customer.opening_balance)} />
                        <DetailItem label="PLACE OF SUPPLY" value={formatValue(customer.place_of_supply)} />
                        <DetailItem label="BUSINESS REG. NUMBER" value={formatValue(customer.business_registration_number)} />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-purple-500 mb-2">
                            <IdentificationIcon className="w-4 h-4" />
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Corporate Tax Information</h2>
                        </div>
                        <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm space-y-1">
                            <DetailItem label="CORPORATE TAX TREATMENT" value={formatValue(customer.corporate_tax_treatment)} />
                            <DetailItem label="CT TRN" value={formatValue(customer.corporate_tax_trn)} />
                            <DetailItem label="CT REG. DATE" value={formatDate(customer.corporate_tax_registered_date)} />
                            <DetailItem label="CT PERIOD" value={formatValue(customer.corporate_tax_period)} />
                            <DetailItem label="FIRST CT PERIOD START" value={formatDate(customer.first_corporate_tax_period_start)} />
                            <DetailItem label="FIRST CT PERIOD END" value={formatDate(customer.first_corporate_tax_period_end)} />
                            <DetailItem label="CT FILING DUE" value={formatDate(customer.corporate_tax_filing_due_date)} />
                        </div>
                    </div>
                </div>
            </div>
                )}

                {activeTab === 'Deal' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Service Categories</h2>
                            <button className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                                Go to transactions <span aria-hidden="true">&rarr;</span>
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={serviceCategories}
                                strategy={verticalListSortingStrategy}
                            >
                                {serviceCategories.map((service) => (
                                <SortableServiceItem
                                    key={service.id}
                                    service={service}
                                    deals={customerDeals.filter(d => d.service === service.id)}
                                    isExpanded={expandedServices.has(service.id)}
                                    onToggle={() => toggleExpand(service.id)}
                                    onCreate={handleCreateDeal}
                                    onViewDeal={handleEditDeal}
                                    onEditDeal={handleEditDeal}
                                    onDeleteDeal={handleDeleteDeal}
                                />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </div>

            {/* Deal Form Modal */}
            <DealFormModal
                isOpen={isDealModalOpen}
                onClose={() => setIsDealModalOpen(false)}
                onSubmit={handleDealSubmit}
                initialData={dealInitialData}
                mode={dealModalMode}
            />



        </div>
    );
}
