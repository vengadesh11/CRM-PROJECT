import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import supabaseAdmin from '../config/supabase';
import { PERMISSION_RESOURCES, createPermissionName } from '../utils/permissionResources';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const router = Router();

router.use(authenticateToken);

// GET /api/crm/permissions
router.get('/', async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('permissions')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch permissions' });
    }
});

// GET /api/crm/permissions/role/:roleId
router.get('/role/:roleId', async (req, res) => {
    try {
        const { roleId } = req.params;
        const { data, error } = await supabaseAdmin
            .from('role_permissions')
            .select('permission_id')
            .eq('role_id', roleId);

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch role permissions' });
    }
});

// POST /api/crm/permissions/role/:roleId
router.post('/role/:roleId', async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permission_id, enabled } = req.body as { permission_id?: string; enabled?: boolean };

        if (!permission_id) {
            return res.status(400).json({ success: false, error: 'permission_id is required' });
        }

        if (enabled) {
            const { error } = await supabaseAdmin
                .from('role_permissions')
                .upsert({ role_id: roleId, permission_id }, { onConflict: 'role_id,permission_id' });
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId)
                .eq('permission_id', permission_id);
            if (error) throw error;
        }

        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to update role permission' });
    }
});

// GET /api/crm/permissions/resources
router.get('/resources', async (_req, res) => {
    try {
        const { data: permissionRows, error: permissionError } = await supabaseAdmin
            .from('permissions')
            .select('id, name');

        if (permissionError) {
            throw permissionError;
        }

        const permissionMap = new Map<string, string>();
        (permissionRows || []).forEach((permission) => {
            if (permission && permission.id && permission.name) {
                permissionMap.set(permission.name, permission.id);
            }
        });

        res.json({
            success: true,
            data: PERMISSION_RESOURCES.map((resource) => ({
                id: resource.id,
                label: resource.label,
                section: resource.section,
                description: resource.description,
                actions: resource.actions.map((action) => ({
                    action: action.action,
                    label: action.label,
                    permission_id: permissionMap.get(createPermissionName(resource.id, action.action))
                }))
            }))
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to load permission resources' });
    }
});

const getUserPermissions = async (userId: string): Promise<string[]> => {
    const userResult = await supabaseAdmin.from('users').select('role_id').eq('id', userId).single();
    if (userResult.error || !userResult.data?.role_id) return [];
    const roleId = userResult.data.role_id;
    const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .select('permission:permissions(name)')
        .eq('role_id', roleId);
    if (error || !data) return [];
    return data
        .map((rp: any) => rp.permission?.name)
        .filter((name: string | null) => typeof name === 'string') as string[];
};

// GET /api/crm/permissions/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const authReq = req as any;
        const userId = authReq.user?.id;
        if (!userId) {
            return res.status(403).json({ success: false, error: 'Missing user context' });
        }
        const permissions = await getUserPermissions(userId);
        res.json({ success: true, data: permissions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch user permissions' });
    }
});

// POST /api/crm/permissions/role/:roleId/bulk
router.post('/role/:roleId/bulk', async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permission_ids } = req.body as { permission_ids?: string[] };

        if (!Array.isArray(permission_ids)) {
            return res.status(400).json({ success: false, error: 'permission_ids must be an array' });
        }

        console.log(`Updating permissions for role ${roleId}:`, permission_ids);

        const { error: deleteError } = await supabaseAdmin
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId);

        if (deleteError) {
            console.error('Delete error during bulk update:', deleteError);
            throw deleteError;
        }

        if (permission_ids.length > 0) {
            const rows = permission_ids.map((permission_id) => ({
                role_id: roleId,
                permission_id
            }));

            const { error: insertError } = await supabaseAdmin
                .from('role_permissions')
                .insert(rows);

            if (insertError) {
                console.error('Insert error during bulk update:', insertError);
                throw insertError;
            }
        }

        return res.json({ success: true });
    } catch (error: any) {
        console.error('Bulk update failed:', error);
        return res.status(500).json({ success: false, error: error.message || 'Failed to update role permissions' });
    }
});

export default router;
