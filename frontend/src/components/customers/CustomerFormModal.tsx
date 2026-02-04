import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import CustomFieldInputs, { CustomField } from '../custom-fields/CustomFieldInputs';
import {
    SparklesIcon,
    BriefcaseIcon,
    BanknotesIcon,
    UserGroupIcon,
    ChatBubbleLeftEllipsisIcon,
    PlusIcon,
    TrashIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode?: 'create' | 'edit' | 'view';
    initialData?: any;
}

type TabType = 'business' | 'tax' | 'contacts' | 'remarks';

export default function CustomerFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData }: CustomerFormModalProps) {
    const { getAccessToken } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('business');
    const [isExtracting, setIsExtracting] = useState(false);

    const [formData, setFormData] = useState<any>({
        type: 'business',
        salutation: 'Mr.',
        first_name: '',
        last_name: '',
        company_name: '',
        display_name: '',
        email: '',
        work_phone: '',
        mobile: '',
        currency: 'AED',
        language: 'en',
        billing_address: '',
        shipping_address: '',
        remarks: '',
        entity_type: '',
        entity_sub_type: '',
        incorporation_date: '',
        trade_license_authority: '',
        trade_license_number: '',
        trade_license_issue_date: '',
        trade_license_expiry_date: '',
        business_activity: '',
        is_freezone: false,
        freezone_name: '',
        shareholders: [],
        authorised_signatories: '',
        share_capital: '',
        tax_treatment: 'vat_registered',
        trn: '',
        vat_registered_date: '',
        first_vat_filing_period: '',
        vat_filing_due_date: '',
        vat_reporting_period: 'monthly',
        corporate_tax_treatment: 'registered',
        corporate_tax_trn: '',
        corporate_tax_registered_date: '',
        corporate_tax_period: '',
        first_corporate_tax_period_start: '',
        first_corporate_tax_period_end: '',
        corporate_tax_filing_due_date: '',
        business_registration_number: '',
        place_of_supply: 'Dubai',
        opening_balance: 0,
        payment_terms: 'net_30',
        portal_access: false,
        contact_persons: []
    });

    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customValues, setCustomValues] = useState<Record<string, any>>({});
    const [uploadingFieldIds, setUploadingFieldIds] = useState<Set<string>>(new Set());

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    useEffect(() => {
        const loadCustomFields = async () => {
            if (!isOpen) return;
            try {
                const token = await getAccessToken();
                const response = await axios.get(`${API_BASE}/custom-fields`, {
                    params: { module: 'customers' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomFields(response.data.data || []);
            } catch (error) {
                console.error('Failed to load custom fields:', error);
            }
        };

        loadCustomFields();
    }, [API_BASE, getAccessToken, isOpen]);

    const isReadOnly = mode === 'view';

    useEffect(() => {
        if (isOpen && mode !== 'create') {
            setFormData({
                ...formData,
                ...initialData,
                customer_type: initialData?.type || initialData?.customer_type || 'business',
            });
            setCustomValues(initialData?.custom_data || {});
        } else if (isOpen && mode === 'create') {
            // Reset form for new customer, but check for conversion data
            setFormData({
                type: initialData?.type || 'business',
                salutation: initialData?.salutation || 'Mr.',
                first_name: initialData?.first_name || '',
                last_name: initialData?.last_name || '',
                company_name: initialData?.company_name || '',
                display_name: initialData?.display_name || initialData?.company_name || '',
                email: initialData?.email || '',
                work_phone: initialData?.work_phone || '',
                mobile: initialData?.mobile || '',
                currency: 'AED',
                language: 'en',
                billing_address: initialData?.billing_address || '',
                shipping_address: initialData?.shipping_address || '',
                remarks: initialData?.remarks || '',
                entity_type: '',
                entity_sub_type: '',
                incorporation_date: '',
                trade_license_authority: '',
                trade_license_number: '',
                trade_license_issue_date: '',
                trade_license_expiry_date: '',
                business_activity: '',
                is_freezone: false,
                freezone_name: '',
                shareholders: [],
                authorised_signatories: '',
                share_capital: '',
                tax_treatment: 'vat_registered',
                trn: '',
                vat_registered_date: '',
                first_vat_filing_period: '',
                vat_filing_due_date: '',
                vat_reporting_period: 'monthly',
                corporate_tax_treatment: 'registered',
                corporate_tax_trn: '',
                corporate_tax_registered_date: '',
                corporate_tax_period: '',
                first_corporate_tax_period_start: '',
                first_corporate_tax_period_end: '',
                corporate_tax_filing_due_date: '',
                business_registration_number: '',
                place_of_supply: 'Dubai',
                opening_balance: 0,
                payment_terms: 'net_30',
                portal_access: false,
                contact_persons: []
            });
            setCustomValues({});
            setActiveTab('business');
        }
    }, [isOpen, initialData, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        onSubmit({
            ...formData,
            custom_data: customValues
        });
    };

    const handleAIExtract = async (file: File) => {
        setIsExtracting(true);
        try {
            const token = await getAccessToken();
            const payload = new FormData();
            payload.append('file', file);

            const response = await axios.post(`${API_BASE}/customers/extract`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data?.success) {
                const extracted = response.data.data;
                setFormData((prev: any) => ({
                    ...prev,
                    ...extracted,
                    company_name: extracted.company_name || prev.company_name,
                    display_name: extracted.company_name || prev.display_name
                }));
            }
        } catch (error) {
            console.error('AI Extraction failed:', error);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleCustomChange = (fieldId: string, value: any) => {
        setCustomValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleCustomImageUpload = async (fieldId: string, file: File) => {
        try {
            const token = await getAccessToken();
            if (!token) return;
            setUploadingFieldIds((prev) => new Set(prev).add(fieldId));
            const payload = new FormData();
            payload.append('file', file);
            payload.append('module', 'customers');
            payload.append('field_id', fieldId);

            const response = await axios.post(`${API_BASE}/uploads`, payload, {
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

    const addShareholder = () => {
        setFormData((prev: any) => ({
            ...prev,
            shareholders: [...(prev.shareholders || []), { owner_type: 'Individual', name: '', nationality: '', shareholding: '' }]
        }));
    };

    const removeShareholder = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            shareholders: prev.shareholders.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateShareholder = (index: number, field: string, value: any) => {
        const updated = [...formData.shareholders];
        updated[index] = { ...updated[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, shareholders: updated }));
    };

    const addContactPerson = () => {
        setFormData((prev: any) => ({
            ...prev,
            contact_persons: [...(prev.contact_persons || []), { salutation: 'Mr.', first_name: '', last_name: '', email: '', mobile: '', designation: '' }]
        }));
    };

    const removeContactPerson = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            contact_persons: prev.contact_persons.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateContactPerson = (index: number, field: string, value: any) => {
        const updated = [...formData.contact_persons];
        updated[index] = { ...updated[index], [field]: value };
        setFormData((prev: any) => ({ ...prev, contact_persons: updated }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? "New Customer" : mode === 'edit' ? "Edit Customer" : "Customer Details"} maxWidth="4xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
                {/* Header Profile Section */}
                <div className="pb-6 border-b border-gray-100 mb-6 w-full">
                    <div className="flex items-start gap-5">
                        <div className="mt-1 w-14 h-14 shrink-0 rounded-full bg-primary-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl shadow-sm">
                            {formData.company_name?.[0] || formData.first_name?.[0] || 'C'}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-primary-600 transition-colors">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'business'}
                                            onChange={() => setFormData({ ...formData, type: 'business' })}
                                            className="peer h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    Business
                                </label>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-primary-600 transition-colors">
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            checked={formData.type === 'individual'}
                                            onChange={() => setFormData({ ...formData, type: 'individual' })}
                                            className="peer h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    Individual
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {formData.type === 'business' ? (
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Company Name *"
                                            value={formData.company_name}
                                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value, display_name: e.target.value })}
                                            required
                                            disabled={isReadOnly}
                                            className="w-full"
                                            placeholder="Enter registered company name..."
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <Select
                                            label="Salutation"
                                            options={[{ value: 'Mr.', label: 'Mr.' }, { value: 'Ms.', label: 'Ms.' }, { value: 'Mrs.', label: 'Mrs.' }]}
                                            value={formData.salutation}
                                            onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="First Name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="Last Name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            disabled={isReadOnly}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center border-b border-gray-100 mb-6 overflow-x-auto scrollbar-hide">
                    <button
                        type="button"
                        onClick={() => setActiveTab('business')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'business' ? 'border-primary-600 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <BriefcaseIcon className="w-4 h-4" />
                        Business Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('tax')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'tax' ? 'border-primary-600 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <BanknotesIcon className="w-4 h-4" />
                        Tax & Financials
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('contacts')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'contacts' ? 'border-primary-600 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <UserGroupIcon className="w-4 h-4" />
                        Contact Persons
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('remarks')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'remarks' ? 'border-primary-600 text-primary-600 bg-primary-50/50' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        Remarks
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {activeTab === 'business' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Document Upload & AI Extraction */}
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-600"></div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-700 rounded-lg shadow-sm">
                                            <ArrowUpTrayIcon className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-gray-900">Document Upload</h5>
                                            <p className="text-xs text-gray-500">Upload Trade License to auto-fill details using AI</p>
                                        </div>
                                    </div>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-700 border border-slate-600 text-white shadow-sm cursor-pointer transition-all hover:border-primary-500 hover:bg-slate-600 ${isExtracting ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <SparklesIcon className="w-4 h-4" />
                                        {isExtracting ? 'Analyzing...' : 'Auto-Fill with AI'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => e.target.files?.[0] && handleAIExtract(e.target.files[0])}
                                            disabled={isExtracting || isReadOnly}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="Document Type"
                                        options={[{ value: 'Trade License', label: 'Trade License' }, { value: 'MOA', label: 'MOA' }, { value: 'VAT Certificate', label: 'VAT Certificate' }]}
                                        disabled={isReadOnly}
                                    />
                                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-3 text-center text-sm text-gray-400 hover:border-primary-400 transition-all cursor-pointer bg-slate-900/30">
                                        Click to upload document
                                    </div>
                                </div>
                            </div>

                            {/* Entity Details */}
                            <div>
                                <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BriefcaseIcon className="w-4 h-4" />
                                    Entity Details
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Entity Type"
                                        options={[{ value: 'LLC', label: 'LLC' }, { value: 'Sole Establishment', label: 'Sole Establishment' }, { value: 'Civil Company', label: 'Civil Company' }]}
                                        value={formData.entity_type}
                                        onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="Date of Incorporation"
                                        type="date"
                                        value={formData.incorporation_date}
                                        onChange={(e) => setFormData({ ...formData, incorporation_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="Trade License Number"
                                        value={formData.trade_license_number}
                                        onChange={(e) => setFormData({ ...formData, trade_license_number: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Select
                                        label="Trade License Authority"
                                        options={[{ value: 'DED Dubai', label: 'DED Dubai' }, { value: 'ADED Abu Dhabi', label: 'ADED Abu Dhabi' }, { value: 'DDA', label: 'DDA' }]}
                                        value={formData.trade_license_authority}
                                        onChange={(e) => setFormData({ ...formData, trade_license_authority: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="License Issue Date"
                                        type="date"
                                        value={formData.trade_license_issue_date}
                                        onChange={(e) => setFormData({ ...formData, trade_license_issue_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="License Expiry Date"
                                        type="date"
                                        value={formData.trade_license_expiry_date}
                                        onChange={(e) => setFormData({ ...formData, trade_license_expiry_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="mt-6">
                                    <TextArea
                                        label="Business Activity Details"
                                        placeholder="(As per Trade License)"
                                        rows={2}
                                        value={formData.business_activity}
                                        onChange={(e) => setFormData({ ...formData, business_activity: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>

                            {/* Shareholding Details */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4" />
                                        Owner/Shareholding Details
                                    </h5>
                                    {!isReadOnly && (
                                        <button type="button" onClick={addShareholder} className="text-primary-600 text-xs font-bold hover:underline flex items-center gap-1">
                                            <PlusIcon className="w-3 h-3" /> Add Shareholder
                                        </button>
                                    )}
                                </div>
                                <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-700/50 text-gray-300 font-bold uppercase text-[10px]">
                                            <tr>
                                                <th className="px-4 py-3">Owner Type</th>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Nationality</th>
                                                <th className="px-4 py-3">Share %</th>
                                                {!isReadOnly && <th className="px-4 py-3"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.shareholders.map((s: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="px-2 py-2">
                                                        <select
                                                            className="w-full bg-transparent border-none text-sm focus:ring-0"
                                                            value={s.owner_type}
                                                            onChange={(e) => updateShareholder(idx, 'owner_type', e.target.value)}
                                                            disabled={isReadOnly}
                                                        >
                                                            <option>Individual</option>
                                                            <option>Corporate</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Full Name"
                                                            className="w-full bg-transparent border-none text-sm focus:ring-0"
                                                            value={s.name}
                                                            onChange={(e) => updateShareholder(idx, 'name', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Nationality"
                                                            className="w-full bg-transparent border-none text-sm focus:ring-0"
                                                            value={s.nationality}
                                                            onChange={(e) => updateShareholder(idx, 'nationality', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 w-24">
                                                        <input
                                                            type="number"
                                                            placeholder="%"
                                                            className="w-full bg-transparent border-none text-sm focus:ring-0"
                                                            value={s.shareholding}
                                                            onChange={(e) => updateShareholder(idx, 'shareholding', e.target.value)}
                                                            disabled={isReadOnly}
                                                        />
                                                    </td>
                                                    {!isReadOnly && (
                                                        <td className="px-2 py-2 text-right">
                                                            <button type="button" onClick={() => removeShareholder(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            {formData.shareholders.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400 italic">No shareholders added yet</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tax' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* VAT Details */}
                            <div>
                                <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BanknotesIcon className="w-4 h-4" />
                                    VAT Treatment & Registration
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Tax Treatment *"
                                        options={[
                                            { value: 'vat_registered', label: 'VAT Registered' },
                                            { value: 'not_vat_registered', label: 'Not VAT Registered' },
                                            { value: 'non_taxable', label: 'Non-Taxable' }
                                        ]}
                                        value={formData.tax_treatment}
                                        onChange={(e) => setFormData({ ...formData, tax_treatment: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="TRN (Tax Registration Number)"
                                        placeholder="100XXXXXXXXXXXX"
                                        value={formData.trn}
                                        onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="VAT Registered Date"
                                        type="date"
                                        value={formData.vat_registered_date}
                                        onChange={(e) => setFormData({ ...formData, vat_registered_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Select
                                        label="VAT Reporting Period"
                                        options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }]}
                                        value={formData.vat_reporting_period}
                                        onChange={(e) => setFormData({ ...formData, vat_reporting_period: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>

                            {/* Corporate Tax Details */}
                            <div>
                                <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <BanknotesIcon className="w-4 h-4" />
                                    Corporate Tax Information
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Corporate Tax Status"
                                        options={[{ value: 'registered', label: 'Registered' }, { value: 'exempt', label: 'Exempt' }, { value: 'pending', label: 'Pending' }]}
                                        value={formData.corporate_tax_treatment}
                                        onChange={(e) => setFormData({ ...formData, corporate_tax_treatment: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="Corporate Tax TRN"
                                        value={formData.corporate_tax_trn}
                                        onChange={(e) => setFormData({ ...formData, corporate_tax_trn: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="CT Registration Date"
                                        type="date"
                                        value={formData.corporate_tax_registered_date}
                                        onChange={(e) => setFormData({ ...formData, corporate_tax_registered_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <Input
                                        label="CT Filing Due Date"
                                        type="date"
                                        value={formData.corporate_tax_filing_due_date}
                                        onChange={(e) => setFormData({ ...formData, corporate_tax_filing_due_date: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                                    <UserGroupIcon className="w-4 h-4" />
                                    Key Contact Persons
                                </h5>
                                {!isReadOnly && (
                                    <button type="button" onClick={addContactPerson} className="text-primary-600 text-xs font-bold hover:underline flex items-center gap-1">
                                        <PlusIcon className="w-3 h-3" /> Add Contact
                                    </button>
                                )}
                            </div>

                            {formData.contact_persons.map((c: any, idx: number) => (
                                <div key={idx} className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 shadow-sm relative group">
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => removeContactPerson(idx)}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Select
                                            label="Salutation"
                                            options={[{ value: 'Mr.', label: 'Mr.' }, { value: 'Ms.', label: 'Ms.' }, { value: 'Mrs.', label: 'Mrs.' }]}
                                            value={c.salutation}
                                            onChange={(e) => updateContactPerson(idx, 'salutation', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="First Name"
                                            value={c.first_name}
                                            onChange={(e) => updateContactPerson(idx, 'first_name', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="Last Name"
                                            value={c.last_name}
                                            onChange={(e) => updateContactPerson(idx, 'last_name', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={c.email}
                                            onChange={(e) => updateContactPerson(idx, 'email', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="Mobile Number"
                                            value={c.mobile}
                                            onChange={(e) => updateContactPerson(idx, 'mobile', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        <Input
                                            label="Designation"
                                            value={c.designation}
                                            onChange={(e) => updateContactPerson(idx, 'designation', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            ))}

                            {formData.contact_persons.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                                        <UserGroupIcon className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <div className="text-sm text-gray-500">No contact persons added yet</div>
                                    <button type="button" onClick={addContactPerson} className="text-primary-600 text-sm font-bold hover:underline">Click to add one</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'remarks' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                    Internal Notes & Custom Data
                                </h5>
                                <TextArea
                                    label="General Remarks"
                                    placeholder="Add any internal notes, history, or special instructions..."
                                    rows={4}
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    disabled={isReadOnly}
                                />
                            </div>

                            {customFields.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-4">Module Custom Fields</h5>
                                    <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 shadow-sm">
                                        <CustomFieldInputs
                                            fields={customFields}
                                            values={customValues}
                                            onChange={handleCustomChange}
                                            onUploadImage={handleCustomImageUpload}
                                            uploadingFieldIds={uploadingFieldIds}
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6 shrink-0">
                    <div className="text-xs text-gray-400 font-medium">
                        {formData.cif && <span className="mr-4">CIF: <span className="text-gray-900 font-bold">{formData.cif}</span></span>}
                        {formData.created_at && <span>Created: <span className="text-gray-900 font-bold">{new Date(formData.created_at).toLocaleDateString()}</span></span>}
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} size="lg">
                            {isReadOnly ? 'Close' : 'Cancel'}
                        </Button>
                        {!isReadOnly && (
                            <Button type="submit" size="lg" className="px-10 shadow-lg shadow-primary-600/20">
                                {mode === 'edit' ? 'Update Customer' : 'Save Customer'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
