import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Helper to hash key
const hashKey = (key: string) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

// GET /api/crm/api-keys
// List all active keys for the user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { data, error } = await supabaseAdmin
            .from('api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Return keys without the sensitive hash
        const sanitizedKeys = data.map(key => ({
            id: key.id,
            name: key.name,
            prefix: key.prefix,
            created_at: key.created_at,
            last_used_at: key.last_used_at
        }));

        res.json({ success: true, data: sanitizedKeys });
    } catch (error: any) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/crm/api-keys
// Generate a new API key
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const { name } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        // Generate Key: sk_live_<random_32_chars>
        const randomPart = crypto.randomBytes(24).toString('hex');
        const apiKey = `sk_live_${randomPart}`;
        const keyHash = hashKey(apiKey);
        const prefix = `sk_live_${randomPart.substring(0, 4)}`;

        const { data, error } = await supabaseAdmin
            .from('api_keys')
            .insert({
                user_id: userId,
                name,
                key_hash: keyHash,
                prefix,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Return the FULL key only once
        res.status(201).json({
            success: true,
            data: {
                id: data.id,
                name: data.name,
                prefix: data.prefix,
                created_at: data.created_at,
                apiKey: apiKey // Shown once!
            }
        });
    } catch (error: any) {
        console.error('Error creating API key:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/crm/api-keys/:id
// Revoke (soft delete) an API key
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { error } = await supabaseAdmin
            .from('api_keys')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error revoking API key:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
