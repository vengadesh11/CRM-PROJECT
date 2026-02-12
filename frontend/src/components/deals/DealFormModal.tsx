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
}



interface DealOptions {
    brands: { id: string; name: string }[];
    services: { id: string; name: string }[];
    users: { id: string; first_name: string; last_name: string; email: string }[];
    leadSources: { id: string; name: string }[];
    servicesRequired: { id: string; name: string }[];
}

export default function DealFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData }: DealFormModalProps) {
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
        department: '',
        brandId: '',
        leadSource: '',
        serviceId: ''
    });
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, any>>({});
    const [uploadingFieldIds, setUploadingFieldIds] = useState<Set<string>>(new Set());
    const [customers, setCustomers] = useState<any[]>([]);
    const [dealOptions, setDealOptions] = useState<DealOptions>({
        brands: [],
        services: [],
        users: [],
        leadSources: [],
        servicesRequired: []
    });
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const importInputRef = React.useRef<HTMLInputElement>(null);
    const optionsToSelect = (items: { id: string; name: string }[]) =>
        [{ value: '', label: 'Select...' }, ...items.map(item => ({ value: item.id, label: item.name }))];

    const handleIndividualExport = () => {
        // 1. Prepare data object with all fields flattened
        const flatData: Record<string, any> = {
            cifNo: formData.cifNo,
            name: formData.name,
            companyName: formData.companyName,
            email: formData.email,
            contactNo: formData.contactNo,
            amount: formData.amount,
            serviceClosed: formData.serviceClosed,
            dealDate: formData.dealDate,
            closingDate: formData.closingDate,
            remarks: formData.remarks,
            department: formData.department,
            brandId: formData.brandId,
            leadSource: formData.leadSource,
            serviceId: formData.serviceId
        };

        // Add custom fields with prefix to avoid collisions
        Object.keys(customValues).forEach(key => {
            flatData[`custom_${key}`] = customValues[key];
        });

        // 2. Generate CSV Content
        const headers = Object.keys(flatData);
        // Escape values for CSV (handle commas, quotes, newlines)
        const csvRow = headers.map(header => {
            const value = flatData[header] === null || flatData[header] === undefined ? '' : String(flatData[header]);
            return `"${value.replace(/"/g, '""')}"`;
        }).join(',');

        const csvContent = `${headers.join(',')}\n${csvRow}`;

        // 3. Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deal_data_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleIndividualImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) return;

                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) return;

                const headers = lines[0].split(',').map(h => h.trim());

                // Custom CSV Parser
                const parseCSVRow = (row: string) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < row.length; i++) {
                        const char = row[i];
                        if (char === '"') {
                            if (inQuotes && row[i + 1] === '"') {
                                current += '"';
                                i++;
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

                const values = parseCSVRow(lines[1]);
                const importedData: Record<string, any> = {};
                headers.forEach((header, index) => {
                    if (index < values.length) {
                        importedData[header] = values[index];
                    }
                });

                // Update State
                setFormData(prev => ({
                    ...prev,
                    cifNo: importedData.cifNo || prev.cifNo,
                    name: importedData.name || prev.name,
                    companyName: importedData.companyName || prev.companyName,
                    email: importedData.email || prev.email,
                    contactNo: importedData.contactNo || prev.contactNo,
                    amount: importedData.amount || prev.amount,
                    serviceClosed: importedData.serviceClosed || prev.serviceClosed,
                    dealDate: importedData.dealDate || prev.dealDate,
                    closingDate: importedData.closingDate || prev.closingDate,
                    remarks: importedData.remarks || prev.remarks,
                    department: importedData.department || prev.department,
                    brandId: importedData.brandId || prev.brandId,
                    leadSource: importedData.leadSource || prev.leadSource,
                    serviceId: importedData.serviceId || prev.serviceId,
                }));

                // Attempt to match customer if CIF is imported
                if (importedData.cifNo && customers.length > 0) {
                    const matched = customers.find(c => c.cif === importedData.cifNo);
                    if (matched) setSelectedCustomerId(matched.id);
                }

                // Extract custom fields
                const newCustomValues: Record<string, any> = {};
                Object.keys(importedData).forEach(key => {
                    if (key.startsWith('custom_')) {
                        const originalKey = key.replace('custom_', '');
                        newCustomValues[originalKey] = importedData[key];
                    }
                });

                setCustomValues(prev => ({ ...prev, ...newCustomValues }));

                if (importInputRef.current) importInputRef.current.value = '';
            } catch (error) {
                console.error('Failed to parse imported deal CSV', error);
            }
        };
        reader.readAsText(file);
    };

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    // Track if we have already initialized form data for the current open session
    const initializedRef = React.useRef(false);
    const prevInitialDataId = React.useRef<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadInitialData = async () => {
            try {
                const token = await getAccessToken();

                const results = await Promise.allSettled([
                    axios.get(`${API_BASE}/custom-fields`, { params: { module: 'deals' }, headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE}/customers`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE}/deals/options`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const fieldsResult = results[0];
                const customersResult = results[1];
                const optionsResult = results[2];

                if (fieldsResult.status === 'fulfilled') {
                    setCustomFields(fieldsResult.value.data.data || []);
                } else {
                    console.error('Failed to load custom fields:', fieldsResult.reason);
                }

                if (customersResult.status === 'fulfilled') {
                    setCustomers(customersResult.value.data.data || []);
                } else {
                    console.error('Failed to load customers:', customersResult.reason);
                }

                if (optionsResult.status === 'fulfilled') {
                    setDealOptions(optionsResult.value.data.data || {
                        brands: [],
                        services: [],
                        users: [],
                        leadSources: [],
                        servicesRequired: []
                    });
                } else {
                    console.error('Failed to load deal options:', optionsResult.reason);
                }
            } catch (error) {
                console.error('Failed to load initial deal form data:', error);
            }
        };

        loadInitialData();
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
                    department: initialData?.department || '',
                    brandId: initialData?.brand_id || initialData?.brand || '',
                    leadSource: initialData?.lead_source || '',
                    serviceId: initialData?.service || initialData?.service_required_id || ''
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
            brand: formData.brandId || null, // Changed from brand_id to brand to match controller expected body
            lead_source: formData.leadSource || null,
            service: formData.serviceId || null, // Changed from service_required_id to service
            custom_data: {
                ...customValues,
                remarks: formData.remarks
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

    const [aiPrompt, setAiPrompt] = useState('');
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [isDrafting, setIsDrafting] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const handleAutoFill = async () => {
        if (!aiPrompt) return;
        try {
            setIsAutoFilling(true);
            const token = await getAccessToken();
            const response = await axios.post(`${API_BASE}/ai/deals/smart-fill`,
                { text: aiPrompt },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success && response.data.data) {
                const aiData = response.data.data;
                setFormData(prev => ({
                    ...prev,
                    name: aiData.name || prev.name,
                    amount: aiData.amount?.toString() || prev.amount,
                    remarks: aiData.remarks || prev.remarks,
                    closingDate: aiData.closing_date || prev.closingDate
                }));
                setAiPrompt('');
            }
        } catch (error) {
            console.error('Failed to auto-fill deal:', error);
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleCalculateScore = async () => {
        try {
            setIsScoring(true);
            const token = await getAccessToken();
            const response = await axios.post(`${API_BASE}/ai/deals/score`,
                { dealData: formData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                setAnalysisResult({
                    score: response.data.score,
                    analysis: response.data.analysis
                });
            }
        } catch (error) {
            console.error('Failed to score deal:', error);
        } finally {
            setIsScoring(false);
        }
    };

    const handleDraftEmail = async () => {
        try {
            setIsDrafting(true);
            const token = await getAccessToken();
            const response = await axios.post(`${API_BASE}/ai/deals/draft-email`,
                { dealData: formData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success && response.data.draft) {
                // For now, we'll just alert the draft. In a real app, this might open an editor.
                alert(response.data.draft);
            }
        } catch (error) {
            console.error('Failed to draft email:', error);
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Deal" maxWidth="4xl">
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="absolute top-4 right-16">
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={EnvelopeIcon}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        onClick={handleDraftEmail}
                        disabled={isDrafting}
                    >
                        {isDrafting ? 'Drafting...' : 'Draft Email'}
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
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 h-16 resize-none shadow-sm"
                        />
                        <button
                            className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 flex flex-col items-center justify-center gap-1 transition-colors w-24 shadow-sm disabled:opacity-50"
                            onClick={handleAutoFill}
                            disabled={isAutoFilling || !aiPrompt}
                        >
                            <SparklesIcon className={`w-5 h-5 ${isAutoFilling ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-bold">{isAutoFilling ? 'Filling...' : 'Auto-Fill'}</span>
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

                        {/* Deal Details (Brand, Source, Service) */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Deal Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select
                                    label="Brand"
                                    options={optionsToSelect(dealOptions.brands)}
                                    value={formData.brandId}
                                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                    disabled={isReadOnly}
                                />
                                <Select
                                    label="Lead Source"
                                    options={optionsToSelect(dealOptions.leadSources)}
                                    value={formData.leadSource}
                                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                                    disabled={isReadOnly}
                                />
                                <Select
                                    label="Service"
                                    options={optionsToSelect(dealOptions.servicesRequired.length ? dealOptions.servicesRequired : dealOptions.services)}
                                    value={formData.serviceId}
                                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                                    disabled={isReadOnly}
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
                                {analysisResult ? (
                                    <div className="space-y-2">
                                        <div className="text-3xl font-black text-primary-500">{analysisResult.score}/100</div>
                                        <p className="text-xs text-gray-400">{analysisResult.analysis}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 mb-2">Analyze deal details to generate a quality score and action plan.</p>
                                )}
                            </div>
                            <Button
                                className="w-full bg-primary-600 hover:bg-primary-500"
                                icon={SparklesIcon}
                                onClick={handleCalculateScore}
                                disabled={isScoring}
                            >
                                <span className="text-white">{isScoring ? 'Analyzing...' : 'Calculate Deal Score'}</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" icon={ArrowUpTrayIcon} onClick={() => importInputRef.current?.click()} className="text-primary-400 bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20">
                            Import
                        </Button>
                        <Button type="button" variant="secondary" size="sm" icon={ArrowDownTrayIcon} onClick={handleIndividualExport} className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20">
                            Export
                        </Button>
                        <input
                            type="file"
                            ref={importInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleIndividualImport}
                        />
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
