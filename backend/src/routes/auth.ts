import { Router } from 'express';
import { supabaseAnon, createUserClient } from '../config/supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/crm/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

        if (error || !data.session) {
            return res.status(401).json({ success: false, error: error?.message || 'Invalid credentials' });
        }

        return res.json({
            success: true,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
                id: data.user?.id,
                email: data.user?.email,
                full_name: data.user?.user_metadata?.full_name || '',
                role: data.user?.user_metadata?.role || data.user?.user_metadata?.role_name || 'User'
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Login failed' });
    }
});

// POST /api/crm/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const { data, error } = await supabaseAnon.auth.signUp({ email, password });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.status(201).json({
            success: true,
            user: data.user ? { id: data.user.id, email: data.user.email } : null,
            access_token: data.session?.access_token || null
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Signup failed' });
    }
});

// GET /api/crm/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
    return res.json({
        success: true,
        user: req.user || null
    });
});

// POST /api/crm/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ success: false, error: 'No token provided' });
        }

        const userClient = createUserClient(token);
        const { error } = await userClient.auth.signOut();

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message || 'Logout failed' });
    }
});

export default router;
