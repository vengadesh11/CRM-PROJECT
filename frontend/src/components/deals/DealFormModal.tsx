import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { SparklesIcon, EnvelopeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import CustomFieldInputs, { CustomField } from '../custom-fields/CustomFieldInputs';

interface DealFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode?: 'create' | 'edit' | 'view';
    initialData?: any;
    onImport?: () => void;
    onExport?: () => void;
}

export default function DealFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData, onImport, onExport }: DealFormModalProps) {
    const { getAccessToken } = useAuth();
    const isReadOnly = mode === 'view';
    const [formData, setFormData] = useState({
        cifNo: '', // Auto-generated in UI for now
        name: '',
        companyName: '',
        email: '',
        contactNo: '',
        amount: '0',
        serviceClosed: '',
        dealDate: new Date().toISOString().split('T')[0],
        closingDate: '',
        remarks: '',
        department: ''
    });
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, any>>({});
    const [uploadingFieldIds, setUploadingFieldIds] = useState<Set<string>>(new Set());
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    // Track if we have already initialized form data for the current open session
    const initializedRef = React.useRef(false);
    const prevInitialDataId = React.useRef<string | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!isOpen) {
                initializedRef.current = false;
                return;
            }
            try {
                const token = await getAccessToken();

                // Load Custom Fields
                const cfResponse = await axios.get(`${API_BASE}/custom-fields`, {
                    params: { module: 'deals' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomFields(cfResponse.data.data || []);

                // Load Customers for selection -- Only if we haven't loaded them yet or want to refresh?
                // Ideally we load this once or check if cached. For now, keep loading but don't depend on it for form init if possible.
                const custResponse = await axios.get(`${API_BASE}/customers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomers(custResponse.data.data || []);
            } catch (error) {
                console.error('Failed to load initial deal form data:', error);
            }
        };

        if (isOpen) {
            loadInitialData();
        }
    }, [API_BASE, getAccessToken, isOpen]);

    useEffect(() => {
        if (isOpen) {
            // Check if we need to re-initialize
            // We re-initialize if:
            // 1. We haven't initialized yet for this open session
            // 2. The mode changed
            // 3. The initialData ID changed (switching between deals directly)

            const currentId = initialData?.id || 'new';
            const shouldInit = !initializedRef.current || prevInitialDataId.current !== currentId || mode === 'create';

            if (shouldInit) {
                setCustomValues(initialData?.custom_data || {});

                // Set selected customer if editing or viewing
                let matchedCustomer: any = null;
                // Try to find customer immediately if we have the list, otherwise wait?
                // If customers are empty, we might miss matching. 
                // But we shouldn't block the form display.

                if (mode !== 'create' && initialData?.cif && customers.length > 0) {
                    matchedCustomer = customers.find(c => c.cif === initialData.cif);
                    if (matchedCustomer) {
                        setSelectedCustomerId(matchedCustomer.id);
                    }
                } else if (mode === 'create') {
                    // Check if initialData provided a CIF (e.g. from CustomerDetailView)
                    if (initialData?.cif && customers.length > 0) {
                        matchedCustomer = customers.find(c => c.cif === initialData.cif);
                        if (matchedCustomer) setSelectedCustomerId(matchedCustomer.id);
                    } else {
                        setSelectedCustomerId('');
                    }
                }

                // Boolean Logic Robustness
                const isServiceClosed =
                    String(initialData?.service_closed).toLowerCase() === 'yes' ||
                    initialData?.service_closed === true ||
                    initialData?.serviceClosed === true ||
                    String(initialData?.serviceClosed).toLowerCase() === 'yes';

                setFormData({
                    cifNo: initialData?.cif || matchedCustomer?.cif || '',
                    name: initialData?.name || initialData?.title || '',
                    companyName: initialData?.company_name || matchedCustomer?.company_name || matchedCustomer?.display_name || '',
                    email: initialData?.email || matchedCustomer?.email || '',
                    contactNo: initialData?.contact_number || initialData?.contactNo || matchedCustomer?.mobile || matchedCustomer?.work_phone || '',
                    amount: initialData?.service_amount?.toString?.() || initialData?.value?.toString?.() || '0',
                    serviceClosed: isServiceClosed ? 'Yes' : 'No',
                    dealDate: initialData?.deal_date ? new Date(initialData.deal_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    closingDate: initialData?.closing_date ? new Date(initialData.closing_date).toISOString().split('T')[0] : (initialData?.expected_close_date ? new Date(initialData.expected_close_date).toISOString().split('T')[0] : ''),
                    remarks: initialData?.remarks || initialData?.custom_data?.remarks || '',
                    department: initialData?.department || ''
                });

                initializedRef.current = true;
                prevInitialDataId.current = currentId;
            }
        }
    }, [isOpen, initialData, customers, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        onSubmit({
            name: formData.name,
            title: formData.name, // Keep for backward compatibility if needed
            cif: formData.cifNo,
            company_name: formData.companyName,
            email: formData.email,
            contact_number: formData.contactNo,
            service_amount: parseFloat(formData.amount),
            service_closed: formData.serviceClosed === 'Yes',
            deal_date: formData.dealDate,
            closing_date: formData.closingDate || null,
            remarks: formData.remarks,
            department: formData.department,
            custom_data: {
                ...customValues,
                remarks: formData.remarks // Store remarks in custom_data too as backup
            }
        });
    };

    const handleCustomChange = (fieldId: string, value: any) => {
        setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleCustomImageUpload = async (fieldId: string, file: File) => {
        try {
            const token = await getAccessToken();
            if (!token) return;
            setUploadingFieldIds((prev) => new Set(prev).add(fieldId));
            const formData = new FormData();
            formData.append('file', file);
            formData.append('module', 'deals');
            formData.append('field_id', fieldId);

            const response = await axios.post(`${API_BASE}/uploads`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.url) {
                handleCustomChange(fieldId, response.data.url);
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setUploadingFieldIds((prev) => {
                const next = new Set(prev);
                next.delete(fieldId);
                return next;
            });
        }
    };

    const handleCustomerChange = (customerId: string) => {
        setSelectedCustomerId(customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setFormData(prev => ({
                ...prev,
                cifNo: customer.cif || '',
                companyName: customer.company_name || customer.display_name || '',
                email: customer.email || '',
                contactNo: customer.mobile || customer.work_phone || ''
            }));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Deal" maxWidth="4xl">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="absolute top-4 right-16">
                    <Button variant="secondary" size="sm" icon={EnvelopeIcon} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                        Draft Email
                    </Button>
                </div>

                {/* AI Smart Fill Section */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-primary-600 text-xs font-bold uppercase tracking-wider">
                        <SparklesIcon className="w-4 h-4" />
                        AI Smart Fill
                    </div>
                    <div className="flex gap-2">
                        <textarea
                            placeholder="Ahmed from TechCorp wants an Audit for 15k, closing next month..."
                            className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 h-16 resize-none shadow-sm"
                        />
                        <button className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 flex flex-col items-center justify-center gap-1 transition-colors w-24 shadow-sm">
                            <SparklesIcon className="w-5 h-5" />
                            <span className="text-xs font-bold">Auto-Fill</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Select Customer"
                                    options={customers.map(c => ({
                                        value: c.id,
                                        label: `${c.cif} - ${c.company_name || c.display_name}`
                                    }))}
                                    value={selectedCustomerId}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                    disabled={isReadOnly}
                                />
                                <Input label="CIF No" value={formData.cifNo} readOnly className="!bg-white/5 !text-gray-400 !border-white/10" />
                                <Input label="Deal Name" placeholder="e.g. Audit Service 2024" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={isReadOnly} />
                                <Input label="Company Name" type="text" value={formData.companyName} readOnly className="!bg-white/5 !text-gray-400 !border-white/10" />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isReadOnly}
                                    className=""
                                />
                                <Input
                                    label="Contact No"
                                    type="tel"
                                    value={formData.contactNo}
                                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                                    disabled={isReadOnly}
                                    className={isReadOnly ? "!bg-white/5 !text-gray-400 !border-white/10" : ""}
                                />
                            </div>
                        </div>


                        {/* Financials */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Financials</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Service Amount (AED)" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} disabled={isReadOnly} />
                                <Select
                                    label="Service Closed"
                                    options={[
                                        { value: 'No', label: 'No' },
                                        { value: 'Yes', label: 'Yes' }
                                    ]}
                                    value={formData.serviceClosed}
                                    onChange={(e) => setFormData({ ...formData, serviceClosed: e.target.value })}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Timeline</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Deal Date" type="date" value={formData.dealDate} onChange={(e) => setFormData({ ...formData, dealDate: e.target.value })} disabled={isReadOnly} />
                                <Input label="Closing Date" type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} disabled={isReadOnly} />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Remarks</h4>
                            <TextArea
                                placeholder="Add internal notes or remarks..."
                                rows={3}
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>

                        {customFields.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Custom Fields</h4>
                                <CustomFieldInputs
                                    fields={customFields}
                                    values={customValues}
                                    onChange={handleCustomChange}
                                    onUploadImage={handleCustomImageUpload}
                                    uploadingFieldIds={uploadingFieldIds}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar: Deal Scoring */}
                    <div className="space-y-6">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-white font-bold">
                                <span className="text-primary-600 text-lg">📊</span>
                                Deal Scoring
                            </div>
                            <div className="bg-slate-900/30 rounded-lg p-4 text-center mb-4">
                                <p className="text-xs text-gray-400 mb-2">Analyze deal details to generate a quality score and action plan.</p>
                            </div>
                            <Button className="w-full bg-primary-600 hover:bg-primary-500" icon={SparklesIcon}>
                                <span className="text-white">Calculate Deal Score</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" icon={ArrowUpTrayIcon} onClick={() => onImport?.()} className="text-primary-400 bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20">
                            Import
                        </Button>
                        <Button type="button" variant="secondary" size="sm" icon={ArrowDownTrayIcon} onClick={() => onExport?.()} className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20">
                            Export
                        </Button>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </Button>
                        {!isReadOnly && (
                            <Button type="button" onClick={handleSubmit}>
                                {mode === 'edit' ? 'Update Deal' : 'Create Deal'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
