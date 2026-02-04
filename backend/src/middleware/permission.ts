import { Response, NextFunction } from 'express';
import supabaseAdmin from '../config/supabase';
import { AuthRequest } from './auth';

const isSuperAdminRole = (roleName?: string) =>
    typeof roleName === 'string' && roleName.toLowerCase().includes('super admin');

const fetchUserRoleId = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabaseAdmin
        .from('users')
        .select('role_id')
        .eq('id', userId)
        .single();

    if (error || !data?.role_id) {
        return null;
    }

    return data.role_id;
};

const fetchPermissionId = async (permissionName: string): Promise<string | null> => {
    const { data, error } = await supabaseAdmin
        .from('permissions')
        .select('id')
        .eq('name', permissionName)
        .single();

    if (error || !data?.id) {
        return null;
    }

    return data.id;
};

export const requirePermission = (permissionName: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user?.id) {
                return res.status(401).json({ success: false, error: 'Authentication required' });
            }

            if (isSuperAdminRole(user.role)) {
                return next();
            }

            const roleId = await fetchUserRoleId(user.id);
            if (!roleId) {
                return res.status(403).json({ success: false, error: 'Role not assigned' });
            }

            const permissionId = await fetchPermissionId(permissionName);
            if (!permissionId) {
                return res.status(404).json({ success: false, error: 'Permission not found' });
            }

            const { data, error } = await supabaseAdmin
                .from('role_permissions')
                .select('permission_id')
                .eq('role_id', roleId)
                .eq('permission_id', permissionId)
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                return res.status(403).json({ success: false, error: 'Insufficient permissions' });
            }

            next();
        } catch (error: any) {
            console.error('Permission check failed:', error);
            res.status(500).json({ success: false, error: error.message || 'Permission check failed' });
        }
    };
};
