import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../contexts/AuthContext';
import {
    AdjustmentsHorizontalIcon,
    Cog6ToothIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon
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
    const [activeTab, setActiveTab] = useState<'sales' | 'custom'>('custom');
    const [activeModule, setActiveModule] = useState<ModuleKey>('leads');
    const [fields, setFields] = useState<CustomField[]>([]);
    const [loadingFields, setLoadingFields] = useState(false);
    const [salesFields, setSalesFields] = useState<Record<ModuleKey, CustomField[]>>({
        leads: [],
        deals: [],
        customers: []
    });

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
        loadFields(activeModule);
    }, [activeModule, API_BASE, getAccessToken]);

    const loadSalesFields = async () => {
        try {
            const token = await getAccessToken();
            const [leadsRes, dealsRes] = await Promise.all([
                axios.get(`${API_BASE}/custom-fields`, {
                    params: { module: 'leads' },
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE}/custom-fields`, {
                    params: { module: 'deals' },
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setSalesFields((prev) => ({
                ...prev,
                leads: leadsRes.data.data || [],
                deals: dealsRes.data.data || []
            }));
        } catch (error) {
            console.error('Failed to load sales fields:', error);
        }
    };

    useEffect(() => {
        loadSalesFields();
    }, [API_BASE, getAccessToken]);

    const resetForm = () => {
        setFieldType('text');
        setLabel('');
        setPlaceholder('');
        setOptions('');
        setRequired(false);
        setEditingFieldId(null);
    };

    const handleSave = async () => {
        if (!label.trim()) return;
        try {
            const token = await getAccessToken();
            const payload = {
                module: activeModule,
                label: label.trim(),
                field_type: fieldType,
                required,
                placeholder: placeholder.trim() || null,
                options: ['dropdown', 'radio'].includes(fieldType)
                    ? options.split(',').map((opt) => opt.trim()).filter(Boolean)
                    : null
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
            loadSalesFields();
        } catch (error) {
            console.error('Failed to save custom field:', error);
        }
    };

    const handleEdit = (field: CustomField) => {
        setEditingFieldId(field.id);
        setFieldType(field.field_type);
        setLabel(field.label);
        setPlaceholder(field.placeholder || '');
        setOptions(field.options?.join(', ') || '');
        setRequired(field.required);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this custom field? This may affect existing data.')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/custom-fields/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadFields(activeModule);
            loadSalesFields();
        } catch (error) {
            console.error('Failed to delete custom field:', error);
        }
    };

    const renderPreview = () => {
        if (fieldType === 'textarea') {
            return (
                <TextArea
                    placeholder={placeholder || 'Placeholder text...'}
                    rows={3}
                    value=""
                    onChange={() => null}
                />
            );
        }

        if (fieldType === 'dropdown') {
            return (
                <Select
                    label={label || 'Field Label'}
                    options={(options ? options.split(',') : ['Option 1', 'Option 2']).map((opt) => ({
                        value: opt.trim(),
                        label: opt.trim()
                    }))}
                    value=""
                    onChange={() => null}
                />
            );
        }

        if (fieldType === 'radio') {
            return (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">{label || 'Field Label'}</label>
                    <div className="flex flex-wrap gap-3">
                        {(options ? options.split(',') : ['Option 1', 'Option 2']).map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-white">
                                <input type="radio" name="preview" className="text-primary-600 focus:ring-primary-500" />
                                {opt.trim()}
                            </label>
                        ))}
                    </div>
                </div>
            );
        }

        if (fieldType === 'checkbox') {
            return (
                <label className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" className="rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-500" />
                    {label || 'Field Label'}
                </label>
            );
        }

        if (fieldType === 'image') {
            return (
                <div className="border border-dashed border-[var(--surface-border)] rounded-xl bg-[var(--surface-input)] p-4 text-sm text-[var(--text-secondary)] text-center">
                    Upload image
                </div>
            );
        }

        return (
            <Input
                label={label || 'Field Label'}
                type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                placeholder={placeholder || 'Placeholder text...'}
                value=""
                onChange={() => null}
            />
        );
    };

    const moduleTabs: { key: ModuleKey; label: string }[] = [
        { key: 'leads', label: 'Leads' },
        { key: 'deals', label: 'Deals' },
        { key: 'customers', label: 'Customers' }
    ];

    const fieldTypeOptions = [
        { value: 'text', label: 'Input Text' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'number', label: 'Number' },
        { value: 'date', label: 'Date' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'radio', label: 'Radio Button' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'image', label: 'Upload Image' }
    ];

    return (
        <Layout title="Settings">
            <div className="flex flex-col gap-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
                    <p className="text-muted">Configure and customize your Lead, Deal and Customers attributes</p>
                </div>

                <div className="flex items-center justify-center">
                    <div className="surface-panel p-1 inline-flex gap-1">
                        <button
                            onClick={() => setActiveTab('sales')}
                            style={activeTab === 'sales' ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                            className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'sales'
                                ? 'shadow-md'
                                : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Cog6ToothIcon className="w-4 h-4" />
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
                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                            Custom Fields
                        </button>
                    </div>
                </div>

                {activeTab === 'sales' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(['leads', 'deals'] as ModuleKey[]).map((module) => (
                            <div key={module} className="surface-panel p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-blue-400">{module} module</div>
                                        <h3 className="text-lg font-bold text-white capitalize">Sales {module}</h3>
                                    </div>
                                </div>
                                {salesFields[module].length === 0 ? (
                                    <div className="text-sm text-muted">No custom fields available yet.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {salesFields[module].map((field) => (
                                            <div key={field.id} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 flex items-center justify-between">
                                                <span>{field.label}</span>
                                                <span className="text-xs font-bold uppercase text-muted">{field.field_type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'custom' && (
                    <>
                        <div className="flex items-center justify-center">
                            <div className="surface-panel p-1 inline-flex gap-1">
                                {moduleTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveModule(tab.key)}
                                        style={activeModule === tab.key ? { backgroundColor: '#2563eb', color: '#ffffff' } : {}}
                                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeModule === tab.key
                                            ? 'shadow-md'
                                            : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 text-xs font-bold text-blue-300 bg-blue-500/20 rounded-lg uppercase tracking-wider">
                                    {activeModule} module
                                </span>
                                <h3 className="text-lg font-bold text-white">Fields Configuration</h3>
                            </div>
                            {canEditSettings && <Button icon={PlusIcon} style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>Create Field</Button>}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="surface-panel p-6 space-y-4">
                                <div className="text-white font-bold">
                                    {editingFieldId ? 'Update Field Configuration' : 'New Field Configuration'}
                                </div>
                                <Select
                                    label="Field Type"
                                    options={fieldTypeOptions}
                                    value={fieldType}
                                    onChange={(e) => setFieldType(e.target.value as FieldType)}
                                />
                                <Input
                                    label="Field Label"
                                    placeholder="e.g. Referral Source"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                />
                                {fieldType !== 'checkbox' && fieldType !== 'image' && (
                                    <Input
                                        label="Placeholder"
                                        placeholder="e.g. Enter source..."
                                        value={placeholder}
                                        onChange={(e) => setPlaceholder(e.target.value)}
                                    />
                                )}
                                {['dropdown', 'radio'].includes(fieldType) && (
                                    <Input
                                        label="Options"
                                        placeholder="Option 1, Option 2, Option 3"
                                        value={options}
                                        onChange={(e) => setOptions(e.target.value)}
                                    />
                                )}
                                <label className="flex items-center gap-2 text-sm text-white">
                                    <input
                                        type="checkbox"
                                        checked={required}
                                        onChange={(e) => setRequired(e.target.checked)}
                                        className="rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-500"
                                    />
                                    Required Field
                                </label>
                                <div className="flex gap-3">
                                    <Button className="flex-1" onClick={handleSave} disabled={!canEditSettings} style={{ backgroundColor: '#2563eb', color: '#ffffff' }}>
                                        {editingFieldId ? 'Update Field' : 'Save Field'}
                                    </Button>
                                    <Button variant="secondary" className="flex-1" onClick={resetForm} disabled={!canEditSettings}>
                                        {editingFieldId ? 'Cancel' : 'Reset'}
                                    </Button>
                                </div>
                            </div>

                            <div className="surface-panel p-6">
                                <div className="flex items-center gap-2 text-white font-bold mb-4">
                                    <span className="text-green-400 text-xs">●</span>
                                    Live Preview
                                </div>
                                <div className="border border-dashed border-white/10 rounded-2xl p-6 min-h-[240px] flex items-center justify-center bg-black/20">
                                    <div className="w-full">{renderPreview()}</div>
                                </div>
                                <p className="text-xs text-muted text-center mt-4 italic">
                                    This is how the field will appear in forms.
                                </p>
                            </div>
                        </div>

                        <div className="surface-panel p-6">
                            <div className="text-white font-bold mb-4">Existing Fields</div>
                            {loadingFields ? (
                                <div className="text-sm text-muted">Loading fields...</div>
                            ) : fields.length === 0 ? (
                                <div className="text-sm text-muted">No custom fields created for {activeModule} yet.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {fields.map((field) => (
                                        <div key={field.id} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 flex items-center justify-between group hover:border-blue-500/50 hover:bg-white/10 transition-all">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">{field.label}</span>
                                                <span className="text-[10px] px-2 py-0.5 font-bold uppercase bg-white/10 rounded text-muted">{field.field_type}</span>
                                            </div>
                                            {canEditSettings && (
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(field)}
                                                        className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(field.id)}
                                                        className="p-1.5 text-muted hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
