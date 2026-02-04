import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import supabaseAdmin from '../config/supabase';

const router = Router();

router.use(authenticateToken);

// GET /api/crm/departments
router.get('/', requirePermission('departments.view'), async (_req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch departments' });
    }
});

// POST /api/crm/departments
router.post('/', requirePermission('departments.create'), async (req, res) => {
    try {
        const payload = {
            name: req.body.name
        };

        const { data, error } = await supabaseAdmin
            .from('departments')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to create department' });
    }
});

// PUT /api/crm/departments/:id
router.put('/:id', requirePermission('departments.edit'), async (req, res) => {
    try {
        const { id } = req.params;
        const payload = {
            name: req.body.name
        };

        const { data, error } = await supabaseAdmin
            .from('departments')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to update department' });
    }
});

// DELETE /api/crm/departments/:id
router.delete('/:id', requirePermission('departments.delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabaseAdmin.from('departments').delete().eq('id', id);
        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Failed to delete department' });
    }
});

export default router;
