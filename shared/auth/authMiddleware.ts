import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './tokenService';
import { getSupabaseAdmin } from '../database/supabase';

/**
 * Extend Express Request to include auth property
 */
export interface AuthRequest extends Request {
    auth?: {
        userId: string;
        email: string;
    };
}

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user info to request
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token provided',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        (req as AuthRequest).auth = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: error instanceof Error ? error.message : 'Authentication failed',
        });
    }
}

/**
 * Middleware to require specific permission
 * Must be used after requireAuth
 */
export function requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthRequest;

            if (!authReq.auth) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
            }

            const userId = authReq.auth.userId;

            // Check if user has the required permission
            const hasPermission = await checkUserPermission(userId, permission);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    required: permission,
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Permission check failed',
            });
        }
    };
}

/**
 * Check if a user has a specific permission
 * @param userId User ID
 * @param permission Permission string (e.g., 'sales-leads:view')
 * @returns true if user has permission, false otherwise
 */
async function checkUserPermission(
    userId: string,
    permission: string
): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
        // Get user's role
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.role_id) {
            return false;
        }

        // Get role's permissions
        const { data: rolePermissions, error: permError } = await supabase
            .from('role_permissions')
            .select('permission:permissions(name)')
            .eq('role_id', user.role_id);

        if (permError || !rolePermissions) {
            return false;
        }

        // Check if permission exists
        const hasPermission = rolePermissions.some(
            (rp: any) => rp.permission?.name === permission
        );

        return hasPermission;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Get all permissions for a user
 * @param userId User ID
 * @returns Array of permission strings
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    const supabase = getSupabaseAdmin();

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.role_id) {
            return [];
        }

        const { data: rolePermissions, error: permError } = await supabase
            .from('role_permissions')
            .select('permission:permissions(name)')
            .eq('role_id', user.role_id);

        if (permError || !rolePermissions) {
            return [];
        }

        return rolePermissions
            .map((rp: any) => rp.permission?.name)
            .filter((name: string) => name);
    } catch (error) {
        console.error('Error getting user permissions:', error);
        return [];
    }
}
