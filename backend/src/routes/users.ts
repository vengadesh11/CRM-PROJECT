import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import supabaseAdmin from '../config/supabase';

const router = Router();

router.use(authenticateToken);

// GET /api/crm/users
router.get('/', requirePermission('users.view'), async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        const users = (data || []).map((user) => ({
            id: user.id,
            email: user.email,
            full_name: user.name || '',
            role_id: user.role_id || '',
            department_id: user.department_id || '',
            created_at: user.created_at
        }));

        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch users' });
    }
});

// POST /api/crm/users
router.post('/', requirePermission('users.create'), async (req, res) => {
    try {
        const { email, password, full_name, role_id, department_id } = req.body as {
            email?: string;
            password?: string;
            full_name?: string;
            role_id?: string;
            department_id?: string;
        };

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, error: 'Email, password, and full name are required' });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role_id: role_id || null,
                department_id: department_id || null
            }
        });

        if (error) throw error;

        const newUser = data.user;
        if (newUser) {
            // Sync with public.users table
            const { error: dbError } = await supabaseAdmin
                .from('users')
                .insert([{
                    id: newUser.id,
                    email: newUser.email,
                    name: full_name,
                    role_id: role_id || null,
                    department_id: department_id || null,
                    is_active: true
                }]);

            if (dbError) {
                console.error('Failed to sync user to database:', dbError);
            }
        }

        return res.status(201).json({
            success: true,
            data: {
                id: data.user?.id,
                email: data.user?.email,
                full_name: (data.user?.user_metadata as any)?.full_name || '',
                role_id: (data.user?.user_metadata as any)?.role_id || '',
                department_id: (data.user?.user_metadata as any)?.department_id || ''
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to create user' });
    }
});

// PUT /api/crm/users/:id
router.put('/:id', requirePermission('users.edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, full_name, role_id, department_id } = req.body as {
            email?: string;
            password?: string;
            full_name?: string;
            role_id?: string;
            department_id?: string;
        };

        const payload: any = {
            user_metadata: {
                ...(full_name !== undefined ? { full_name } : {}),
                ...(role_id !== undefined ? { role_id: role_id || null } : {}),
                ...(department_id !== undefined ? { department_id: department_id || null } : {})
            }
        };

        if (email) payload.email = email;
        if (password) payload.password = password;

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, payload);

        if (error) throw error;

        // Sync with public.users table
        const dbUpdate: any = {};
        if (email) dbUpdate.email = email;
        if (full_name !== undefined) dbUpdate.name = full_name;
        if (role_id !== undefined) dbUpdate.role_id = role_id || null;
        if (department_id !== undefined) dbUpdate.department_id = department_id || null;

        if (Object.keys(dbUpdate).length > 0) {
            const { error: dbError } = await supabaseAdmin
                .from('users')
                .update(dbUpdate)
                .eq('id', id);

            if (dbError) {
                console.error('Failed to update user in database:', dbError);
            }
        }

        return res.json({
            success: true,
            data: {
                id: data.user?.id,
                email: data.user?.email,
                full_name: (data.user?.user_metadata as any)?.full_name || '',
                role_id: (data.user?.user_metadata as any)?.role_id || '',
                department_id: (data.user?.user_metadata as any)?.department_id || ''
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to update user' });
    }
});

// DELETE /api/crm/users/:id
router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;

        // Sync with public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error('Failed to delete user from database:', dbError);
        }

        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to delete user' });
    }
});

export default router;
