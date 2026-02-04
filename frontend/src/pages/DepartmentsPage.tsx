import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Department {
    id: string;
    name: string;
}

interface UserRecord {
    id: string;
    department_id: string;
}

export default function DepartmentsPage() {
    const { getAccessToken, hasPermission } = useAuth();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/crm',
        []
    );

    const fetchDepartments = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        } finally {
            setLoading(false);
        }
    }, [API_BASE, getAccessToken]);

    const fetchUsers = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [API_BASE, getAccessToken]);

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, [fetchDepartments, fetchUsers]);

    const handleCreate = async () => {
        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/departments`, { name }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            setName('');
            fetchDepartments();
        } catch (error) {
            console.error('Failed to create department:', error);
        }
    };

    const handleUpdate = async () => {
        if (!editingId) return;
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/departments/${editingId}`, { name }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            setName('');
            setEditingId(null);
            setIsEditMode(false);
            fetchDepartments();
        } catch (error) {
            console.error('Failed to update department:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/departments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDepartments();
        } catch (error) {
            console.error('Failed to delete department:', error);
        }
    };

    const openCreate = () => {
        setIsEditMode(false);
        setEditingId(null);
        setName('');
        setIsModalOpen(true);
    };

    const openEdit = (dept: Department) => {
        setIsEditMode(true);
        setEditingId(dept.id);
        setName(dept.name);
        setIsModalOpen(true);
    };

    const usersByDepartment = users.reduce<Record<string, number>>((acc, user) => {
        const deptId = user.department_id || 'none';
        acc[deptId] = (acc[deptId] || 0) + 1;
        return acc;
    }, {});

    if (loading) {
        return (
            <Layout title="Departments">
                <div className="flex items-center justify-center h-full">
                    <div className="text-white">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Departments">
            <div className="surface-panel overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-bold text-white">Departments</h2>
                        <p className="text-sm text-gray-400">Total departments: {departments.length}</p>
                    </div>
                    {hasPermission('departments.create') && (
                        <Button icon={PlusIcon} onClick={openCreate} style={{ backgroundColor: '#2563eb', color: '#ffffff' }} className="hover:!bg-blue-500 shadow-lg">Add Department</Button>
                    )}
                </div>
                <div className="overflow-hidden">
                    <table className="w-full border-b border-white/10">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Department Name</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-left">Users</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept) => (
                                <tr key={dept.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-white flex items-center gap-3">
                                        {dept.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-400">
                                        {usersByDepartment[dept.id] || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <div className="flex items-center justify-end gap-3 text-gray-300">
                                            {hasPermission('departments.edit') && (
                                                <button className="p-1 rounded-md hover:bg-white/10" title="Edit" onClick={() => openEdit(dept)}>
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {hasPermission('departments.delete') && (
                                                <button className="p-1 rounded-md hover:bg-white/10" title="Delete" onClick={() => handleDelete(dept.id)}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditMode ? 'Edit Department' : 'Add New Department'}
                maxWidth="lg"
            >
                <div className="space-y-6">
                    <Input
                        label="Department Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={isEditMode ? handleUpdate : handleCreate}>
                            {isEditMode ? 'Save Changes' : 'Create Department'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
