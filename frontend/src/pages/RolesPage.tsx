import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../components/layout/MainLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import TextArea from '../components/ui/TextArea';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, CheckIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Role {
    id: string;
    name: string;
    description?: string | null;
}

interface PermissionAction {
    permission_id: string;
    action: string;
    label: string;
}

interface PermissionResource {
    id: string;
    label: string;
    section: string;
    description?: string;
    actions: PermissionAction[];
}

export default function RolesPage() {
    const { getAccessToken, hasPermission } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [resources, setResources] = useState<PermissionResource[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set());
    const [draftPermissions, setDraftPermissions] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [roleName, setRoleName] = useState('');
    const [roleDescription, setRoleDescription] = useState('');

    const API_BASE = useMemo(
        () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm',
        []
    );

    const fetchRoles = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data.data || []);
            if (!selectedRole && response.data.data?.length) {
                setSelectedRole(response.data.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    }, [API_BASE, getAccessToken, selectedRole]);

    const fetchResources = useCallback(async () => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/permissions/resources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch permission resources:', error);
        }
    }, [API_BASE, getAccessToken]);

    const fetchRolePermissions = useCallback(async (roleId: string) => {
        try {
            const token = await getAccessToken();
            const response = await axios.get(`${API_BASE}/permissions/role/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ids = new Set((response.data.data || []).map((p: { permission_id: string }) => p.permission_id)) as Set<string>;
            setRolePermissions(ids);
            setDraftPermissions(new Set(ids) as Set<string>);
        } catch (error) {
            console.error('Failed to fetch role permissions:', error);
        }
    }, [API_BASE, getAccessToken]);

    useEffect(() => {
        fetchRoles();
        fetchResources();
    }, [fetchRoles, fetchResources]);

    useEffect(() => {
        if (selectedRole?.id) {
            fetchRolePermissions(selectedRole.id);
        }
    }, [fetchRolePermissions, selectedRole?.id]);

    const handleCreateRole = async () => {
        try {
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/roles`, {
                name: roleName,
                description: roleDescription
            }, { headers: { Authorization: `Bearer ${token}` } });

            setIsModalOpen(false);
            setRoleName('');
            setRoleDescription('');
            fetchRoles();
        } catch (error) {
            console.error('Failed to create role:', error);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedRole) return;
        try {
            const token = await getAccessToken();
            await axios.put(`${API_BASE}/roles/${selectedRole.id}`, {
                name: roleName,
                description: roleDescription
            }, { headers: { Authorization: `Bearer ${token}` } });

            setIsModalOpen(false);
            setRoleName('');
            setRoleDescription('');
            fetchRoles();
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role? This will not affect users unless access depends on it, but it might lead to restricted access.')) return;
        try {
            const token = await getAccessToken();
            await axios.delete(`${API_BASE}/roles/${roleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedRole?.id === roleId) setSelectedRole(null);
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setRoleName('');
        setRoleDescription('');
        setIsModalOpen(true);
    };

    const openEditModal = (role: Role) => {
        setModalMode('edit');
        setRoleName(role.name);
        setRoleDescription(role.description || '');
        setSelectedRole(role);
        setIsModalOpen(true);
    };

    const togglePermission = (permissionId: string, enabled: boolean) => {
        setDraftPermissions((prev) => {
            const next = new Set(prev);
            if (enabled) {
                next.add(permissionId);
            } else {
                next.delete(permissionId);
            }
            return next;
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            setSaving(true);
            const token = await getAccessToken();
            await axios.post(`${API_BASE}/permissions/role/${selectedRole.id}/bulk`, {
                permission_ids: Array.from(draftPermissions)
            }, { headers: { Authorization: `Bearer ${token}` } });
            setRolePermissions(new Set(draftPermissions));
            // Fetch again to ensure consistency with server state
            fetchRolePermissions(selectedRole.id);
            alert('Permissions saved successfully!');
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setSaving(false);
        }
    };

    const isSuperAdmin = selectedRole?.name?.toLowerCase().includes('super admin');
    const canCreateRole = hasPermission('roles.create');
    const canEditRole = hasPermission('roles.edit');
    const canDeleteRole = hasPermission('roles.delete');
    const canManagePermissions = isSuperAdmin || hasPermission('roles.edit');
    const isDirty = rolePermissions.size !== draftPermissions.size
        || Array.from(rolePermissions).some((id) => !draftPermissions.has(id));

    const groupedResources = resources.reduce<Record<string, PermissionResource[]>>((acc, resource) => {
        if (!acc[resource.section]) acc[resource.section] = [];
        acc[resource.section].push(resource);
        return acc;
    }, {});

    return (
        <Layout title="Roles & Permissions">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <div className="surface-panel p-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-sm font-bold text-white">Roles</h3>
                        {canCreateRole && (
                            <Button size="sm" icon={PlusIcon} onClick={openCreateModal}>Add Role</Button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className={`group relative w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${selectedRole?.id === role.id
                                    ? 'border-blue-500/50 bg-blue-500/10 shadow-sm'
                                    : 'border-transparent bg-transparent hover:bg-white/5'
                                    }`}
                                onClick={() => setSelectedRole(role)}
                            >
                                <div className="w-full pr-12">
                                    <div className={`text-sm font-bold ${selectedRole?.id === role.id ? 'text-blue-400' : 'text-white'}`}>{role.name}</div>
                                    <div className="text-xs text-muted line-clamp-1">{role.description || 'No description'}</div>
                                </div>

                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {canEditRole && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditModal(role); }}
                                            className="p-1.5 text-muted hover:text-white rounded-md hover:bg-white/10"
                                            title="Edit Role"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {canDeleteRole && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                                            className="p-1.5 text-muted hover:text-red-400 rounded-md hover:bg-white/10"
                                            title="Delete Role"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="surface-panel p-6">
                    {selectedRole ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-white">{selectedRole.name}</h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-muted rounded uppercase tracking-wider">Role Permissions</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    icon={CheckIcon}
                                    onClick={handleSavePermissions}
                                    disabled={!isDirty || !canManagePermissions || saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                            <p className="text-sm text-muted mb-6">{selectedRole.description || 'Manage permissions for this role.'}</p>

                            <div className="space-y-4">
                                {Object.entries(groupedResources).map(([section, resourcesInSection]) => (
                                    <div key={section} className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                                        <div className="px-6 py-3 bg-white/5 text-xs text-gray-300 font-bold uppercase tracking-widest border-b border-white/5">
                                            {section}
                                        </div>
                                        <div className="space-y-3 px-6 py-4">
                                            {resourcesInSection.map((resource) => (
                                                <div key={resource.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                                                    <div className="space-y-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-base font-semibold text-white mb-1">{resource.label}</div>
                                                            {resource.description && <div className="text-xs text-muted">{resource.description}</div>}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {resource.actions.map((action) => {
                                                                const permissionId = action.permission_id;
                                                                const enabled = permissionId ? draftPermissions.has(permissionId) : false;
                                                                return (
                                                                    <label key={action.permission_id} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${enabled
                                                                        ? 'bg-blue-500/20 text-blue-200 border-blue-500/30'
                                                                        : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'
                                                                        }`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={enabled}
                                                                            onChange={(e) => permissionId && togglePermission(permissionId, e.target.checked)}
                                                                            disabled={isSuperAdmin || !permissionId}
                                                                            className="h-4 w-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-transparent"
                                                                        />
                                                                        {action.label}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-sm text-muted">Select a role to view permissions.</div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'edit' ? 'Edit Role' : 'Add New Role'}
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <Input
                        label="Role Name"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g. Sales Manager"
                    />
                    <TextArea
                        label="Description"
                        rows={2}
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        placeholder="Describe the responsibilities of this role..."
                    />
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={modalMode === 'edit' ? handleUpdateRole : handleCreateRole}
                            disabled={modalMode === 'create' ? !canCreateRole : !canEditRole}
                        >
                            {modalMode === 'edit' ? 'Save Changes' : 'Create Role'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
