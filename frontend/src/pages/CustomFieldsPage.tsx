import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../contexts/AuthContext';
import WebhooksTab from '../components/settings/WebhooksTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import ApiEndpointsTab from '../components/settings/ApiEndpointsTab';
import BillingTab from '../components/settings/BillingTab';
import SalesSettingsTab from '../components/settings/SalesSettingsTab';
import {
    AdjustmentsHorizontalIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    GlobeAltIcon,
    PuzzlePieceIcon,
    CodeBracketIcon,
    CreditCardIcon,
    TagIcon
} from '@heroicons/react/24/outline';

type ModuleKey = 'leads' | 'deals' | 'customers';
type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'dropdown'
    | 'radio'
    | 'checkbox'
    | 'image';

interface CustomField {
    id: string;
    label: string;
    field_type: FieldType;
    required: boolean;
    placeholder?: string | null;
    options?: string[] | null;
    field_order?: number | null;
}

export default function CustomFieldsPage() {
    const { getAccessToken, hasPermission } = useAuth();
    const [activeTab, setActiveTab] = useState<'sales-settings' | 'custom' | 'integrations' | 'webhooks' | 'developer' | 'billing'>('sales-settings');
    const [activeModule, setActiveModule] = useState<ModuleKey>('leads');
    const [fields, setFields] = useState<CustomField[]>([]);
    const [loadingFields, setLoadingFields] = useState(false);
    const [fieldType, setFieldType] = useState<FieldType>('text');
    const [label, setLabel] = useState('');
    const [placeholder, setPlaceholder] = useState('');
    const [options, setOptions] = useState('');
    const [required, setRequired] = useState(false);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    const canEditSettings = hasPermission('settings.edit');
    const canViewWebhooks = hasPermission('webhooks.view');
    const canViewIntegrations = hasPermission('integrations.view');

    const loadFields = async (module: ModuleKey) => {
        try {
            setLoadingFields(true);
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/custom-fields`, {
                params: { module },
                headers: { Authorization: `Bearer ${token}` }
            });
            setFields(response.data.data || []);
        } catch (error) {
            console.error('Failed to load custom fields:', error);
        } finally {
            setLoadingFields(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'custom') {
            loadFields(activeModule);
        }
    }, [activeModule, API_BASE, getAccessToken, activeTab]);


    const resetForm = () => {
        setEditingFieldId(null);
        setLabel('');
        setFieldType('text');
        setPlaceholder('');
        setOptions('');
        setRequired(false);
    };

    const handleSave = async () => {
        if (!label) {
            alert('Label is required');
            return;
        }

        try {
            const token = await getAccessToken();
            const payload = {
                module: activeModule,
                label,
                field_type: fieldType,
                required,
                placeholder,
                options: ['dropdown', 'radio'].includes(fieldType)
                    ? options.split(',').map((opt) => opt.trim()).filter(Boolean)
                    : null,
                field_order: fields.length
            };

            if (editingFieldId) {
                await axios.put(`${API_BASE}/custom-fields/${editingFieldId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/custom-fields`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            resetForm();
            loadFields(activeModule);
        } catch (error) {
            console.error('Failed to save field:', error);
            alert('Failed to save field');
        }
    };

    const handleEdit = (field: CustomField) => {
        setEditingFieldId(field.id);
        setLabel(field.label);
        setFieldType(field.field_type);
        setPlaceholder(field.placeholder || '');
        setOptions(field.options?.join(', ') || '');
        setRequired(field.required);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this field? Data stored in this field will be lost.')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/custom-fields/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadFields(activeModule);
        } catch (error) {
            console.error('Failed to delete field:', error);
            alert('Failed to delete field');
        }
    };

    const moduleTabs = [
        { id: 'leads', label: 'Leads' },
        { id: 'deals', label: 'Deals' },
        { id: 'customers', label: 'Customers' }
    ];

    const fieldTypeOptions = [
        { value: 'text', label: 'Text' },
        { value: 'textarea', label: 'Message / Text Area' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'dropdown', label: 'Dropdown List' },
        { value: 'radio', label: 'Radio Buttons' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'image', label: 'Image Upload' }
    ];

    return (
        <Layout title="Settings">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                        <p className="text-gray-400 mt-1">Manage system configuration and custom fields.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Main Tabs */}
                    <div className="flex items-center gap-4 border-b border-gray-800 pb-1 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('sales-settings')}
                            style={activeTab === 'sales-settings' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sales-settings'
                                ? 'shadow-md'
                                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <TagIcon className="w-5 h-5" />
                            Sales Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('custom')}
                            style={activeTab === 'custom' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'custom'
                                ? 'shadow-md'
                                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                            Custom Fields
                        </button>
                        {canViewIntegrations && (
                            <button
                                onClick={() => setActiveTab('integrations')}
                                style={activeTab === 'integrations' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                                className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'integrations'
                                    ? 'shadow-md'
                                    : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <GlobeAltIcon className="w-5 h-5" />
                                Integrations
                            </button>
                        )}
                        {canViewWebhooks && (
                            <button
                                onClick={() => setActiveTab('webhooks')}
                                style={activeTab === 'webhooks' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                                className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'webhooks'
                                    ? 'shadow-md'
                                    : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <PuzzlePieceIcon className="w-5 h-5" />
                                Webhooks
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('developer')}
                            style={activeTab === 'developer' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'developer'
                                ? 'shadow-md'
                                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CodeBracketIcon className="w-5 h-5" />
                            Api Integrations
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            style={activeTab === 'billing' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'billing'
                                ? 'shadow-md'
                                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <CreditCardIcon className="w-5 h-5" />
                            Billing
                        </button>
                    </div>

                    {/* CONTENT AREA */}
                    {activeTab === 'sales-settings' && (
                        <SalesSettingsTab />
                    )}

                    {activeTab === 'custom' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Field List */}
                            <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-[var(--surface-border)] flex items-center gap-4 bg-[var(--surface-ground)]">
                                    {moduleTabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveModule(tab.id as ModuleKey)}
                                            style={activeModule === tab.id ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeModule === tab.id
                                                ? 'shadow-sm'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4">
                                    {loadingFields ? (
                                        <div className="text-gray-400 text-center py-8">Loading fields...</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {fields.length === 0 && (
                                                <div className="text-gray-400 text-center py-8 italic bg-black/20 rounded-lg">
                                                    No custom fields found for {activeModule}. Create one!
                                                </div>
                                            )}
                                            {fields.map((field) => (
                                                <div key={field.id} className="group p-4 rounded-lg bg-[var(--surface-ground)] border border-[var(--surface-border)] hover:border-blue-500/30 transition-all flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-white flex items-center gap-2">
                                                            {field.label}
                                                            {field.required && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 rounded">*</span>}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{field.field_type}</p>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(field)}
                                                            className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                                                            disabled={!canEditSettings}
                                                        >
                                                            <PencilSquareIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(field.id)}
                                                            className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                                                            disabled={!canEditSettings}
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Form */}
                            <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] shadow-sm p-6 h-fit sticky top-6">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <PlusIcon className="w-5 h-5 text-blue-500" />
                                    {editingFieldId ? 'Edit Field' : 'Create New Field'}
                                </h3>

                                <div className="space-y-4">
                                    <Input
                                        label="Label"
                                        placeholder="e.g. Budget size"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                    />

                                    <Select
                                        label="Type"
                                        value={fieldType}
                                        onChange={(e) => setFieldType(e.target.value as FieldType)}
                                        options={fieldTypeOptions}
                                    />

                                    {(fieldType === 'dropdown' || fieldType === 'radio') && (
                                        <TextArea
                                            label="Options (comma separated)"
                                            placeholder="Small, Medium, Large"
                                            value={options}
                                            onChange={(e) => setOptions(e.target.value)}
                                        />
                                    )}

                                    <Input
                                        label="Placeholder"
                                        placeholder="Helper text..."
                                        value={placeholder}
                                        onChange={(e) => setPlaceholder(e.target.value)}
                                    />

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="req"
                                            checked={required}
                                            onChange={(e) => setRequired(e.target.checked)}
                                            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="req" className="text-sm text-gray-300">Required Field</label>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        {editingFieldId && (
                                            <Button variant="secondary" onClick={resetForm} className="flex-1">Cancel</Button>
                                        )}
                                        {canEditSettings && <Button icon={PlusIcon} style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="flex-1" onClick={handleSave}>
                                            {editingFieldId ? 'Update Field' : 'Save Field'}
                                        </Button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Integrations Tab Content */}
                    {activeTab === 'integrations' && canViewIntegrations && (
                        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] p-6">
                            <IntegrationsTab />
                        </div>
                    )}

                    {/* Webhooks Tab Content */}
                    {activeTab === 'webhooks' && canViewWebhooks && (
                        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] p-6">
                            <WebhooksTab />
                        </div>
                    )}

                    {/* Developer Tab Content */}
                    {activeTab === 'developer' && (
                        <ApiEndpointsTab />
                    )}

                    {/* Billing Tab Content */}
                    {activeTab === 'billing' && (
                        <div className="bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] p-6">
                            <BillingTab />
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
