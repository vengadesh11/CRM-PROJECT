import { useState, useEffect } from 'react';
import {
    PencilSquareIcon,
    TrashIcon,
    ArrowLeftIcon,
    IdentificationIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
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
    const [serviceCategories, setServiceCategories] = useState([
        'Audit Report',
        'Book Keeping',
        'CT Filling',
        'Registration',
        'VAT Filling'
    ]);

    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [dealInitialData, setDealInitialData] = useState<any>(null);
    const [customerDeals, setCustomerDeals] = useState<any[]>([]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch Deals
    useEffect(() => {
        const fetchDeals = async () => {
            if (activeTab === 'Deal' && customer?.cif) {
                try {
                    const token = await getAccessToken();
                    // Assuming endpoint supports filtering by CIF or we filter client side
                    // If endpoint is /deals, we might need a query param. 
                    // Using generic endpoint and filtering for now based on implementation plan assumption 
                    // or standard REST practice.
                    const response = await axios.get(`http://localhost:3001/api/crm/deals`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data && Array.isArray(response.data.data)) {
                        const filteredDeals = response.data.data.filter((d: any) => d.cif === customer.cif);
                        setCustomerDeals(filteredDeals);
                    }
                } catch (error) {
                    console.error("Failed to fetch deals", error);
                }
            }
        };
        fetchDeals();
    }, [activeTab, customer, getAccessToken]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setServiceCategories((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleCreateDeal = (serviceName: string) => {
        setDealInitialData({
            name: serviceName,
            cif: customer.cif,
            company_name: customer.company_name || customer.display_name,
            // Pre-fill other fields if necessary
        });
        setIsDealModalOpen(true);
    };

    const handleDealSubmit = async (data: any) => {
        // Here we would normally call the API to create the deal
        // For now, we will just close the modal and maybe show a success message or refresh logic
        // The DealFormModal props expects onSubmit to handle the API call usually, OR return data for parent to handle.
        // Looking at DealFormModal: onSubmit(data) -> Parent handles it.

        try {
            // We need to actually create the deal here if DealFormModal doesn't do it internally.
            // But DealFormModal logic: onSubmit(data) -> Parent handles it.
            // So we need to call API here.

            // ... API call logic ...
            console.log("Creating deal:", data);

            const token = await getAccessToken();
            await axios.post(`http://localhost:3001/api/crm/deals`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh deals
            const response = await axios.get(`http://localhost:3001/api/crm/deals`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && Array.isArray(response.data.data)) {
                const filteredDeals = response.data.data.filter((d: any) => d.cif === customer.cif);
                setCustomerDeals(filteredDeals);
            }

            setIsDealModalOpen(false);
        } catch (error) {
            console.error("Error creating deal", error);
        }
    };

    const [editingService, setEditingService] = useState<string | null>(null);
    const [editServiceName, setEditServiceName] = useState('');
    const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

    // Initialize expanded state with all services open by default
    useEffect(() => {
        setExpandedServices(new Set(serviceCategories));
    }, [serviceCategories]); // Re-initialize if categories change

    // Toggle Expand/Collapse
    const toggleExpand = (serviceName: string) => {
        setExpandedServices(prev => {
            const next = new Set(prev);
            if (next.has(serviceName)) {
                next.delete(serviceName);
            } else {
                next.add(serviceName);
            }
            return next;
        });
    };

    // Service Actions
    const handleEditService = (serviceName: string) => {
        setEditingService(serviceName);
        setEditServiceName(serviceName);
    };

    const handleSaveServiceRename = () => {
        if (editingService && editServiceName && editServiceName !== editingService) {
            setServiceCategories(items => items.map(item => item === editingService ? editServiceName : item));
        }
        setEditingService(null);
        setEditServiceName('');
    };

    const handleDeleteService = (serviceName: string) => {
        if (confirm(`Are you sure you want to delete "${serviceName}"?`)) {
            setServiceCategories(items => items.filter(item => item !== serviceName));
        }
    };

    if (!customer) {
        return (
            <div className="flex-1 bg-[var(--surface-page)] flex items-center justify-center text-gray-400">
                Select a customer to view details
            </div>
        );
    }

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
        onEdit,
        onDelete
    }: {
        service: string,
        deals: any[],
        isExpanded: boolean,
        onToggle: () => void,
        onCreate: (s: string) => void,
        onEdit: (s: string) => void,
        onDelete: (s: string) => void
    }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
        } = useSortable({ id: service });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
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

                        <span className="font-bold text-white text-sm">{service}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(service)}
                            className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Edit Service Name"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete(service)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Service"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="h-4 w-px bg-gray-200 mx-1"></div>
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
                {isExpanded && deals.length > 0 && (
                    <div className="bg-black/20 p-2 space-y-2">
                        {deals.map((deal) => (
                            <div key={deal.id} className="bg-[var(--surface-panel)] border border-white/10 rounded-lg p-3 ml-12 flex justify-between items-center group hover:border-primary-500/50 transition-colors">
                                <div>
                                    <h5 className="text-sm font-semibold text-white">{deal.name}</h5>
                                    <p className="text-xs text-gray-400">{new Date(deal.created_at || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${deal.service_closed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {deal.service_closed ? 'Closed' : 'Open'}
                                </span>
                            </div>
                        ))}
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
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary-600 mb-2">
                                <IdentificationIcon className="w-4 h-4" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Contact Information</h2>
                            </div>
                            <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm">
                                <DetailItem label="CIF NUMBER" value={customer.cif} />
                                <DetailItem label="EMAIL" value={customer.email} />
                                <DetailItem label="MOBILE" value={customer.mobile} />
                                <DetailItem label="WORK PHONE" value={customer.work_phone} />
                            </div>
                        </div>

                        {/* Tax & Financials */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-yellow-600 mb-2">
                                <BanknotesIcon className="w-4 h-4" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Tax & Financials</h2>
                            </div>
                            <div className="bg-[var(--surface-panel)] border border-white/10 rounded-2xl p-6 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <div className="border-l-2 border-primary-500 pl-4 py-1">
                                            <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-4">VAT Information</h3>
                                            <DetailItem
                                                label="TAX TREATMENT"
                                                value={customer.tax_treatment === 'vat_registered' ? 'VAT Registered' : 'Not VAT Registered'}
                                            />
                                            <DetailItem label="TRN" value={customer.trn} />
                                            <DetailItem label="VAT REG. DATE" value={customer.vat_registered_date} />
                                        </div>
                                    </div>
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
                                        key={service}
                                        service={service}
                                        deals={customerDeals.filter(d => d.name === service)} // Simple string matching for now
                                        isExpanded={expandedServices.has(service)}
                                        onToggle={() => toggleExpand(service)}
                                        onCreate={handleCreateDeal}
                                        onEdit={handleEditService}
                                        onDelete={handleDeleteService}
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
                mode="create"
            />

            {/* Service Edit Modal */}
            <Modal
                isOpen={!!editingService}
                onClose={() => setEditingService(null)}
                title="Edit Service"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <Input
                        label="Service Name"
                        value={editServiceName}
                        onChange={(e) => setEditServiceName(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setEditingService(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveServiceRename}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
