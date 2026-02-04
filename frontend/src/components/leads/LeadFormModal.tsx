import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { SparklesIcon, EnvelopeIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import CustomFieldInputs, { CustomField } from '../custom-fields/CustomFieldInputs';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    mode?: 'create' | 'edit' | 'view';
    initialData?: any;
    onImport?: () => void;
    onExport?: () => void;
}

export default function LeadFormModal({ isOpen, onClose, onSubmit, mode = 'create', initialData, onImport, onExport }: LeadFormModalProps) {
    const { getAccessToken } = useAuth();
    const isReadOnly = mode === 'view';
    const [formData, setFormData] = useState({
        companyName: '',
        registrationDate: '',
        email: '',
        closingCycle: '',
        mobile: '',
        closingDate: '',
        remarks: ''
    });
    const [leadSource, setLeadSource] = useState('');
    const [status, setStatus] = useState('new');
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
                    params: { module: 'leads' },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomFields(response.data.data || []);
            } catch (error) {
                console.error('Failed to load custom fields:', error);
            }
        };

        loadCustomFields();
    }, [API_BASE, getAccessToken, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setCustomValues(initialData?.custom_data || {});
            setFormData({
                companyName: initialData?.company_name || initialData?.company || initialData?.name || '',
                registrationDate: initialData?.date || '',
                email: initialData?.email || '',
                closingCycle: initialData?.closing_cycle || initialData?.closingCycle || '',
                mobile: initialData?.mobile_number || initialData?.phone || '',
                closingDate: initialData?.expected_closing || initialData?.closingDate || '',
                remarks: initialData?.remarks || ''
            });
            setLeadSource(initialData?.lead_source || initialData?.source || '');
            setStatus(initialData?.status || 'new');
        }
    }, [isOpen, initialData]);

    // Calculate Closing Cycle automatically
    useEffect(() => {
        if (formData.registrationDate && formData.closingDate) {
            const start = new Date(formData.registrationDate);
            const end = new Date(formData.closingDate);

            // Calculate difference in time
            const diffTime = Math.abs(end.getTime() - start.getTime());
            // Calculate difference in days (divide by 1000 * 60 * 60 * 24)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let cycleString = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;

            // Optional: Format for months if large enough, but days is usually clearer for cycles
            // If the closing date is before registration, it might be invalid, but we'll still show the diff or 0
            if (end < start) {
                // cycleString = "Invalid Date Range"; // Or keep negative/raw days
            }

            setFormData(prev => ({
                ...prev,
                closingCycle: cycleString
            }));
        }
    }, [formData.registrationDate, formData.closingDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        const closingCycleNumber = parseInt(formData.closingCycle, 10);
        onSubmit({
            company_name: formData.companyName,
            registration_date: formData.registrationDate,
            email: formData.email,
            closing_cycle: Number.isNaN(closingCycleNumber) ? null : closingCycleNumber,
            mobile_number: formData.mobile,
            closing_date: formData.closingDate,
            remarks: formData.remarks,
            lead_source: leadSource,
            status,
            custom_data: customValues
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Lead" maxWidth="2xl">
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
                            placeholder="Paste raw notes here... e.g. 'Met John from ABC Corp at Gitex. Need ERP. Phone: 0551234567'"
                            className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 h-20 resize-none shadow-sm"
                        />
                        <button className="bg-primary-600 hover:bg-primary-500 text-white rounded-lg px-4 flex flex-col items-center justify-center gap-1 transition-colors w-24 shadow-sm">
                            <SparklesIcon className="w-5 h-5" />
                            <span className="text-xs font-bold">Auto-Fill</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">1</span>
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Company Name"
                                placeholder="Enter company name"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                disabled={isReadOnly}
                            />
                            <Input
                                label="Registration Date"
                                type="date"
                                value={formData.registrationDate}
                                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Contact Email"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isReadOnly}
                        />
                        <Input
                            label="Closing Cycle"
                            placeholder="e.g. 1 month"
                            value={formData.closingCycle}
                            onChange={(e) => setFormData({ ...formData, closingCycle: e.target.value })}
                            disabled={isReadOnly}
                        />
                        <Input
                            label="Mobile Number"
                            placeholder="+971 50..."
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            disabled={isReadOnly}
                        />
                        <Input
                            label="Closing Date"
                            type="date"
                            value={formData.closingDate}
                            onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                            disabled={isReadOnly}
                        />
                        <Input
                            label="Lead Source"
                            placeholder="e.g. Referral"
                            value={leadSource}
                            onChange={(e) => setLeadSource(e.target.value)}
                            disabled={isReadOnly}
                        />
                        <Input
                            label="Status"
                            placeholder="e.g. New, Qualified"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Remarks */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">2</span>
                            Remarks
                        </h4>
                        <TextArea
                            placeholder="Add any additional notes or details about this lead..."
                            rows={3}
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            disabled={isReadOnly}
                        />
                    </div>

                    {customFields.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">3</span>
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

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-8">
                        <div className="flex gap-2">
                            <Button type="button" variant="secondary" size="sm" icon={ArrowUpTrayIcon} onClick={() => onImport?.()} className="text-primary-400 bg-primary-500/10 border-primary-500/30 hover:bg-primary-500/20">
                                Import Data
                            </Button>
                            <Button type="button" variant="secondary" size="sm" icon={ArrowDownTrayIcon} onClick={() => onExport?.()} className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20">
                                Export Data
                            </Button>
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
            </div>
        </Modal>
    );
}
