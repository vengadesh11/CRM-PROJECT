import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    TagIcon
} from '@heroicons/react/24/outline';

interface SalesSettingItem {
    id: string;
    name: string;
    is_active: boolean;
}

const CATEGORIES = [
    { id: 'lead-sources', label: 'Lead Sources' },
    { id: 'lead-owners', label: 'Lead Owners' },
    { id: 'service-required', label: 'Services Required' },
    { id: 'payment-statuses', label: 'Payment Statuses' },
    { id: 'service-closed-statuses', label: 'Service Closed Statuses' },
    { id: 'brands', label: 'Brands' },
    { id: 'lead-status', label: 'Lead Status' },
    { id: 'lead-qualifications', label: 'Lead Qualifications' }
];

export default function SalesSettingsTab() {
    const { getAccessToken, hasPermission } = useAuth();
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
    const [items, setItems] = useState<SalesSettingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SalesSettingItem | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    const canEditSettings = hasPermission('settings.edit');

    const fetchItems = async (category: string) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/sales-settings/${category}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems(activeCategory);
    }, [activeCategory]);

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        try {
            const token = await getAccessToken();
            const payload: any = { name: formData.name };

            if (editingItem) {
                await axios.put(`${API_BASE}/sales-settings/${activeCategory}/${editingItem.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/sales-settings/${activeCategory}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({ name: '' });
            fetchItems(activeCategory);
        } catch (error) {
            console.error('Failed to save item:', error);
            alert('Failed to save item');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/sales-settings/${activeCategory}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchItems(activeCategory);
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    const openModal = (item?: SalesSettingItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name
            });
        } else {
            setEditingItem(null);
            setFormData({ name: '' });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Categories */}
            <div className="lg:col-span-1 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] overflow-hidden h-fit">
                <div className="p-4 bg-[var(--surface-ground)] border-b border-[var(--surface-border)]">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Configuration</h3>
                </div>
                <div className="p-2 space-y-1">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${activeCategory === cat.id
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {cat.label}
                            {activeCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Items List */}
            <div className="lg:col-span-3 bg-[var(--surface-card)] rounded-xl border border-[var(--surface-border)] p-6 min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {CATEGORIES.find(c => c.id === activeCategory)?.label}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Manage options for this dropdown category</p>
                    </div>
                    {canEditSettings && (
                        <Button icon={PlusIcon} onClick={() => openModal()}>
                            Add New
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-400">Loading items...</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.length === 0 && (
                            <div className="text-center py-12 bg-[var(--surface-ground)] rounded-xl border border-[var(--surface-border)] border-dashed">
                                <TagIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No items found. Create your first one!</p>
                            </div>
                        )}
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 bg-[var(--surface-ground)] rounded-lg border border-[var(--surface-border)] hover:border-blue-500/30 transition-all group"
                            >
                                <div>
                                    <span className="text-white font-medium">{item.name}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {canEditSettings && (
                                        <>
                                            <button
                                                onClick={() => openModal(item)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Item' : 'Add New Item'}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter name..."
                        autoFocus
                    />


                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
