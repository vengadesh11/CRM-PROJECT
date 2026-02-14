import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { SparklesIcon, EnvelopeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import CustomFieldInputs, { CustomField } from '../custom-fields/CustomFieldInputs';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode?: 'create' | 'edit' | 'view';
    initialData?: any;
}

interface LeadOptions {
    brands: { id: string; name: string }[];
    leadStatuses: { id: string; name: string }[];
    qualifications: { id: string; name: string; score: number }[];
    users: { id: string; first_name: string; last_name: string; email: string }[];
    leadSources: { id: string; name: string }[];
    servicesRequired: { id: string; name: string }[];
    leadOwners: { id: string; name: string }[];
}

export default function LeadFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData }: LeadFormModalProps) {
    const { getAccessToken } = useAuth();
    const isReadOnly = mode === 'view';
    const API_BASE = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm', []);

    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, any>>({});
    const [uploadingFieldIds, setUploadingFieldIds] = useState<Set<string>>(new Set());
    const [leadOptions, setLeadOptions] = useState<LeadOptions>({
        brands: [],
        leadStatuses: [],
        qualifications: [],
        users: [],
        leadSources: [],
        servicesRequired: [],
        leadOwners: []
    });

    const [formData, setFormData] = useState({
        companyName: '',
        registrationDate: new Date().toISOString().split('T')[0],
        email: '',
        mobile: '',
        leadSource: '',
        status: 'new',
        brandId: '',
        leadOwnerId: '',
        qualificationId: '',
        serviceId: '',
        lastContact: '',
        closingCycle: '',
        closingDate: '',
        remarks: ''
    });

    const statusOptions = useMemo(() => {
        if (!leadOptions.leadStatuses || leadOptions.leadStatuses.length === 0) {
            return [
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'nurturing', label: 'Nurturing' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' }
            ];
        }
        return leadOptions.leadStatuses.map(s => ({ value: s.name.toLowerCase(), label: s.name }));
    }, [leadOptions.leadStatuses]);
    const [leadScore, setLeadScore] = useState(0);
    const [aiSmartFillText, setAiSmartFillText] = useState('');
    const importInputRef = React.useRef<HTMLInputElement>(null);

    const fetchLeadQualificationFallback = async (token: string) => {
        try {
            const response = await axios.get(`${API_BASE}/sales-settings/lead-qualifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.success) {
                return response.data.data || [];
            }
            console.warn('Lead qualification fallback returned unexpected payload:', response.data);
        } catch (error) {
            console.error('Failed to load fallback lead qualifications:', error);
        }
        return [];
    };

    // Fetch Options
    useEffect(() => {
        if (!isOpen) return;
        const fetchOptions = async () => {
            try {
                const token = await getAccessToken();
                const results = await Promise.allSettled([
                    axios.get(`${API_BASE}/custom-fields`, { params: { module: 'leads' }, headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_BASE}/leads/options`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const fieldsResult = results[0];
                const optionsResult = results[1];

                if (fieldsResult.status === 'fulfilled') {
                    setCustomFields(fieldsResult.value.data.data || []);
                } else {
                    console.error('Failed to load custom fields:', fieldsResult.reason);
                }

                if (optionsResult.status === 'fulfilled') {
                    let leadOptionsData = optionsResult.value.data.data || {
                        brands: [],
                        leadStatuses: [],
                        qualifications: [],
                        users: [],
                        leadSources: [],
                        servicesRequired: [],
                        leadOwners: []
                    };

                    if (!leadOptionsData.qualifications || leadOptionsData.qualifications.length === 0) {
                        leadOptionsData = {
                            ...leadOptionsData,
                            qualifications: await fetchLeadQualificationFallback(token)
                        };
                    }

                    setLeadOptions(leadOptionsData);
                } else {
                    console.error('Failed to load lead options:', optionsResult.reason);
                    const fallbackQualifications = await fetchLeadQualificationFallback(token);
                    setLeadOptions(prev => ({
                        ...prev,
                        qualifications: fallbackQualifications
                    }));
                }
            } catch (error) {
                console.error('Unexpected error loading lead form data:', error);
            }
        };
        fetchOptions();
    }, [isOpen, API_BASE, getAccessToken]);

    // Initialize Data
    useEffect(() => {
        if (isOpen) {
            setFormData({
                companyName: initialData?.company_name || initialData?.company || '',
                registrationDate: initialData?.registration_date ? new Date(initialData.registration_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                email: initialData?.email || '',
                mobile: initialData?.mobile_number || '',
                leadSource: initialData?.lead_source || '',
                status: initialData?.status || 'new',
                brandId: initialData?.brand_id || '',
                leadOwnerId: initialData?.lead_owner_id || '',
                qualificationId: initialData?.lead_qualification_id || '',
                serviceId: initialData?.service_required_id || '',
                lastContact: initialData?.last_contact ? new Date(initialData.last_contact).toISOString().split('T')[0] : '',
                closingCycle: initialData?.closing_cycle || '',
                closingDate: initialData?.expected_closing ? new Date(initialData.expected_closing).toISOString().split('T')[0] : '',
                remarks: initialData?.remarks || ''
            });
            setCustomValues(initialData?.custom_data || {});
            setLeadScore(initialData?.lead_score || 0); // Assuming lead_score might be part of lead data in future
        }
    }, [isOpen, initialData]);

    // Calculate Closing Cycle
    useEffect(() => {
        if (formData.registrationDate && formData.closingDate) {
            const start = new Date(formData.registrationDate);
            const end = new Date(formData.closingDate);
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
                const cycleString = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                setFormData(prev => ({ ...prev, closingCycle: cycleString }));
            }
        }
    }, [formData.registrationDate, formData.closingDate]);

    const handleCalculateScore = () => {
        let score = 0;
        if (formData.email) score += 10;
        if (formData.mobile) score += 10;
        if (formData.companyName) score += 10;
        if (formData.leadSource) score += 5;

        // Qualification score
        const qual = leadOptions.qualifications.find(q => q.id === formData.qualificationId);
        if (qual) score += qual.score;

        // Service potential (mock)
        if (formData.serviceId) score += 15;

        setLeadScore(score);
    };

    const handleAiAutoFill = () => {
        if (!aiSmartFillText) return;
        // Mock parsing logic
        const companyMatch = aiSmartFillText.match(/(?:from|at)\s+([A-Z][a-z0-9\s]+?)(?=\s+(?:at|need|phone|\.|$))/i);
        const emailMatch = aiSmartFillText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = aiSmartFillText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/);

        setFormData(prev => ({
            ...prev,
            companyName: companyMatch ? companyMatch[1].trim() : prev.companyName,
            email: emailMatch ? emailMatch[0] : prev.email,
            mobile: phoneMatch ? phoneMatch[0] : prev.mobile,
            remarks: prev.remarks ? prev.remarks + '\n' + aiSmartFillText : aiSmartFillText
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        const closingCycleNumber = parseInt(formData.closingCycle) || 0;

        onSubmit({
            company_name: formData.companyName,
            registration_date: formData.registrationDate,
            email: formData.email,
            mobile_number: formData.mobile,
            lead_source: formData.leadSource,
            status: formData.status,
            brand_id: formData.brandId || null,
            lead_owner_id: formData.leadOwnerId || null,
            lead_qualification_id: formData.qualificationId || null,
            service_required_id: formData.serviceId || null,
            last_contact: formData.lastContact || null,
            closing_cycle: closingCycleNumber,
            expected_closing: formData.closingDate || null,
            remarks: formData.remarks,
            custom_data: customValues
        });
    };

    const handleCustomImageUpload = async (fieldId: string, file: File) => {
        try {
            const token = await getAccessToken();
            if (!token) return;
            setUploadingFieldIds((prev) => new Set(prev).add(fieldId));
            const formData = new FormData();
            formData.append('file', file);
            formData.append('module', 'leads');
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

    const handleCustomChange = (fieldId: string, value: any) => {
        setCustomValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleIndividualExport = () => {
        // 1. Prepare data object with all fields flattened
        const flatData: Record<string, any> = {
            companyName: formData.companyName,
            registrationDate: formData.registrationDate,
            email: formData.email,
            closingCycle: formData.closingCycle,
            mobile: formData.mobile,
            closingDate: formData.closingDate,
            remarks: formData.remarks,
            leadSource: formData.leadSource,
            status: formData.status,
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
        a.download = `lead_data_${new Date().getTime()}.csv`;
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

                // Simple CSV Parser
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) return; // Need headers and at least one row

                const headers = lines[0].split(',').map(h => h.trim());

                // Parse the row handling quotes (simplified regex split for standard CSVs)
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

                // Parse the row using our custom parser
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
                    companyName: importedData.companyName || prev.companyName,
                    registrationDate: importedData.registrationDate || prev.registrationDate,
                    email: importedData.email || prev.email,
                    closingCycle: importedData.closingCycle || prev.closingCycle,
                    mobile: importedData.mobile || prev.mobile,
                    closingDate: importedData.closingDate || prev.closingDate,
                    remarks: importedData.remarks || prev.remarks,
                    leadSource: importedData.leadSource || prev.leadSource,
                    status: importedData.status || prev.status
                }));

                // Extract custom fields
                const newCustomValues: Record<string, any> = {};
                Object.keys(importedData).forEach(key => {
                    if (key.startsWith('custom_')) {
                        const originalKey = key.replace('custom_', '');
                        newCustomValues[originalKey] = importedData[key];
                    }
                });

                setCustomValues(prev => ({ ...prev, ...newCustomValues }));

                // Clear input
                if (importInputRef.current) importInputRef.current.value = '';
            } catch (error) {
                console.error('Failed to parse imported lead CSV', error);
            }
        };
        reader.readAsText(file);
    };

    const optionsToSelect = (items: { id: string; name: string }[]) =>
        [{ value: '', label: 'Select...' }, ...items.map(i => ({ value: i.id, label: i.name }))];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Lead' : 'Create New Lead'} maxWidth="5xl">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header Actions */}
                        <div className="flex justify-end mb-2">
                            <Button variant="secondary" size="sm" icon={EnvelopeIcon} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                                Draft Email
                            </Button>
                        </div>

                        {/* AI Smart Fill */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-primary-600 text-xs font-bold uppercase tracking-wider">
                                <SparklesIcon className="w-4 h-4" />
                                AI Smart Fill
                            </div>
                            <div className="flex gap-2">
                                <TextArea
                                    placeholder="Paste raw notes here... e.g. 'Met John from ABC Corp at Gitex. Need ERP. Phone: 0551234567'"
                                    value={aiSmartFillText}
                                    onChange={(e) => setAiSmartFillText(e.target.value)}
                                    className="h-20 resize-none text-sm"
                                />
                                <button type="button" onClick={handleAiAutoFill} className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 flex flex-col items-center justify-center gap-1 transition-colors w-24 shadow-sm h-20">
                                    <SparklesIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold">Auto-Fill</span>
                                </button>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">1</span>
                                Basic Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Company Name" placeholder="Enter company name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} disabled={isReadOnly} />
                                <Input label="Registration Date" type="date" value={formData.registrationDate} onChange={e => setFormData({ ...formData, registrationDate: e.target.value })} disabled={isReadOnly} />
                                <Input label="Contact Email" type="email" placeholder="name@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={isReadOnly} />
                                <Input label="Mobile Number" placeholder="+971 50..." value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} disabled={isReadOnly} />
                            </div>
                        </div>

                        {/* Sales & Lead Details */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">2</span>
                                Sales & Lead Details
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <Select label="Brand" options={optionsToSelect(leadOptions.brands)} value={formData.brandId} onChange={e => setFormData({ ...formData, brandId: e.target.value })} disabled={isReadOnly} />
                                <Select label="Lead Source" options={optionsToSelect(leadOptions.leadSources)} value={formData.leadSource} onChange={e => setFormData({ ...formData, leadSource: e.target.value })} disabled={isReadOnly} />
                                <Select
                                    label="Lead Owner"
                                    options={[
                                        { value: '', label: 'Select Owner' },
                                        ...(leadOptions.leadOwners && leadOptions.leadOwners.length > 0
                                            ? leadOptions.leadOwners.map((o: { id: string; name: string }) => ({ value: o.id, label: o.name }))
                                            : leadOptions.users.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })))
                                    ]}
                                    value={formData.leadOwnerId}
                                    onChange={e => setFormData({ ...formData, leadOwnerId: e.target.value })}
                                    disabled={isReadOnly}
                                />

                                <Select
                                    label="Status"
                                    options={[{ value: '', label: 'Select Status' }, ...statusOptions]}
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    disabled={isReadOnly}
                                />
                                <Select label="Qualification" options={optionsToSelect(leadOptions.qualifications)} value={formData.qualificationId} onChange={e => setFormData({ ...formData, qualificationId: e.target.value })} disabled={isReadOnly} />
                                <Select
                                    label="Service Required"
                                    options={optionsToSelect(leadOptions.servicesRequired)}
                                    value={formData.serviceId}
                                    onChange={e => setFormData({ ...formData, serviceId: e.target.value })}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">3</span>
                                Timeline
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Last Contact" type="date" value={formData.lastContact} onChange={e => setFormData({ ...formData, lastContact: e.target.value })} disabled={isReadOnly} />
                                <Input label="Closing Cycle" placeholder="e.g. 1 month" value={formData.closingCycle} onChange={e => setFormData({ ...formData, closingCycle: e.target.value })} disabled={isReadOnly} />
                                <Input label="Closing Date" type="date" value={formData.closingDate} onChange={e => setFormData({ ...formData, closingDate: e.target.value })} disabled={isReadOnly} />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">4</span>
                                Remarks
                            </h4>
                            <TextArea placeholder="Add any additional notes or details about this lead..." rows={3} value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} disabled={isReadOnly} />
                        </div>

                        {/* Custom Fields */}
                        {customFields.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">5</span>
                                    Custom Fields
                                </h4>
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

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Lead Scoring Card */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CalculatorIcon className="w-5 h-5 text-primary-400" />
                                Lead Scoring
                            </h3>

                            <div className="bg-slate-900/50 rounded-lg p-6 border border-dashed border-slate-700 mb-6 flex flex-col items-center justify-center text-center">
                                {leadScore > 0 ? (
                                    <>
                                        <div className="text-4xl font-bold text-primary-400 mb-2">{leadScore}</div>
                                        <div className="text-sm text-gray-400">Current Lead Score</div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">Analyze lead details to generate a quality score and action plan.</p>
                                )}
                            </div>

                            <Button type="button" onClick={handleCalculateScore} className="w-full justify-center bg-purple-600 hover:bg-purple-500 border-none text-white font-bold py-3 shadow-lg shadow-purple-900/20">
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Calculate Lead Score
                            </Button>

                            <div className="mt-6 border-t border-slate-700 pt-6">
                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Details Summary</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Completeness</span>
                                        <span className="text-gray-300">
                                            {Object.values(formData).filter(v => v).length} / {Object.keys(formData).length} fields
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quality Tier</span>
                                        <span className={`font-bold ${leadScore > 80 ? 'text-emerald-400' : leadScore > 50 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {leadScore > 80 ? 'Hot' : leadScore > 50 ? 'Warm' : 'Cold'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" size="sm" icon={ArrowUpTrayIcon} onClick={() => importInputRef.current?.click()} className="text-primary-400 bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20">
                            Import Data
                        </Button>
                        <Button type="button" variant="secondary" size="sm" icon={ArrowDownTrayIcon} onClick={handleIndividualExport} className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20">
                            Export Data
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
                            <Button type="submit">
                                {mode === 'edit' ? 'Update Lead' : 'Create Lead'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
