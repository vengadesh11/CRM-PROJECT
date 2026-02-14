import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface UserRecord {
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    department_id: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
}

interface Department {
    id: string;
    name: string;
}

export default function UsersPage() {
    const { getAccessToken, hasPermission } = useAuth();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordDirty, setPasswordDirty] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role_id: '',
        department_id: ''
    });

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/crm',
        []
    );

    const canCreateUser = hasPermission('users.create');
    const canEditUser = hasPermission('users.edit');
    const canDeleteUser = hasPermission('users.delete');

    const fetchUsers = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/departments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDepartments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchDepartments();
    }, []);

    const openCreate = () => {
        setModalMode('create');
        setSelectedUserId(null);
        setShowPassword(false);
        setPasswordDirty(false);
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role_id: '',
            department_id: ''
        });
        setIsModalOpen(true);
    };

    const openEdit = (user: UserRecord) => {
        setModalMode('edit');
        setSelectedUserId(user.id);
        setShowPassword(false);
        setPasswordDirty(false);
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: '',
            role_id: user.role_id || '',
            department_id: user.department_id || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const token = await getAccessToken();
            if (modalMode === 'create') {
                await axios.post(`${API_BASE}/users`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else if (selectedUserId) {
                const payload = {
                    full_name: formData.full_name,
                    email: formData.email,
                    role_id: formData.role_id,
                    department_id: formData.department_id,
                    ...(passwordDirty && formData.password ? { password: formData.password } : {})
                };
                await axios.put(`${API_BASE}/users/${selectedUserId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user?')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const rolesById = roles.reduce<Record<string, Role>>((acc, role) => {
        acc[role.id] = role;
        return acc;
    }, {});

    const departmentsById = departments.reduce<Record<string, Department>>((acc, dept) => {
        acc[dept.id] = dept;
        return acc;
    }, {});

    const filteredUsers = users.filter((user) => {
        if (!searchTerm) return true;
        const text = `${user.full_name} ${user.email}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    return (
        <Layout title="User Management">
            <div className="surface-panel overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <div>
                        <h2 className="text-lg font-bold text-white">Users</h2>
                        <p className="text-sm text-muted">Total users: {users.length}</p>
                    </div>
                    {canCreateUser && (
                        <Button
                            variant="primary"
                            icon={PlusIcon}
                            onClick={openCreate}
                        >
                            Add User
                        </Button>
                    )}
                </div>

                <div className="px-6 py-4 border-b border-white/5">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--surface-input)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder-[var(--text-muted)]"
                        />
                    </div>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-left">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-left">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-left">Department</th>
                            <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-white">{user.full_name || 'Unnamed'}</div>
                                    <div className="text-xs text-muted">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {rolesById[user.role_id]?.name || 'None'}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {departmentsById[user.department_id]?.name || 'None'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {canEditUser && (
                                            <button className="text-muted hover:text-white" title="Edit" onClick={() => openEdit(user)}>
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {canDeleteUser && (
                                            <button className="text-muted hover:text-red-400" title="Delete" onClick={() => handleDelete(user.id)}>
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-6 text-center text-muted">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'edit' ? 'Edit User' : 'Add New User'}
                maxWidth="lg"
            >
                <div className="space-y-5">
                    <Input
                        label="Full Name"
                        placeholder="Enter full name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <div className="w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={modalMode === 'edit' ? 'Leave blank to keep unchanged' : 'Enter password'}
                                value={formData.password}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (modalMode === 'edit') {
                                        setPasswordDirty(true);
                                    }
                                    setFormData({ ...formData, password: value });
                                }}
                                className="block w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <Select
                        label="Role"
                        options={[
                            { value: '', label: 'Select a role' },
                            ...roles.map((role) => ({ value: role.id, label: role.name }))
                        ]}
                        value={formData.role_id}
                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    />
                    <Select
                        label="Department"
                        options={[
                            { value: '', label: 'None' },
                            ...departments.map((dept) => ({ value: dept.id, label: dept.name }))
                        ]}
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    />
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={modalMode === 'create' ? !canCreateUser : !canEditUser}
                        >
                            {modalMode === 'edit' ? 'Save Changes' : 'Create User'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
