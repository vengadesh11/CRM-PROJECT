import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
        full_name?: string;
        role_id?: string;
    };
}

/**
 * Middleware to verify Supabase JWT token OR API Key
 */
export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'No authentication token provided'
            });
            return;
        }

        // ------------------------------------------------------------
        // API KEY AUTHENTICATION
        // ------------------------------------------------------------
        if (token.startsWith('sk_live_')) {
            const keyHash = crypto.createHash('sha256').update(token).digest('hex');

            // Find key in DB
            const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
                .from('api_keys')
                .select('user_id, is_active')
                .eq('key_hash', keyHash)
                .single();

            if (apiKeyError || !apiKeyData || !apiKeyData.is_active) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or inactive API Key'
                });
                return;
            }

            // Get user details associated with the key
            const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(apiKeyData.user_id);

            if (userError || !user) {
                res.status(401).json({
                    success: false,
                    error: 'User associated with API Key not found'
                });
                return;
            }

            // Attach user info to request
            req.user = {
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || user.user_metadata?.role_name || 'User',
                full_name: user.user_metadata?.full_name || ''
            };

            next();
            return;
        }

        // ------------------------------------------------------------
        // JWT AUTHENTICATION (Standard)
        // ------------------------------------------------------------
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || user.user_metadata?.role_name || 'User',
            full_name: user.user_metadata?.full_name || ''
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.user_metadata?.role || user.user_metadata?.role_name || 'User',
                    full_name: user.user_metadata?.full_name || ''
                };
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
