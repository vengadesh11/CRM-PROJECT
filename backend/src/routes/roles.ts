import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import supabaseAdmin from '../config/supabase';

const router = Router();

router.use(authenticateToken);

// GET /api/crm/roles
router.get('/', requirePermission('roles.view'), async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch roles' });
    }
});

// POST /api/crm/roles
router.post('/', requirePermission('roles.create'), async (req, res) => {
    try {
        const payload = {
            name: req.body.name,
            description: req.body.description || null
        };

        const { data, error } = await supabaseAdmin
            .from('roles')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to create role' });
    }
});

// PUT /api/crm/roles/:id
router.put('/:id', requirePermission('roles.edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const payload = {
            name: req.body.name,
            description: req.body.description || null
        };

        const { data, error } = await supabaseAdmin
            .from('roles')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to update role' });
    }
});

// DELETE /api/crm/roles/:id
router.delete('/:id', requirePermission('roles.delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('roles').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to delete role' });
    }
});

export default router;
