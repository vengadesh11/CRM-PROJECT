import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/common';

/**
 * Generate a JWT token for a user
 * @param userId User ID
 * @param email User email
 * @param module Optional module identifier (e.g., 'crm')
 * @returns JWT token string
 */
export function generateToken(
    userId: string,
    email: string,
    module?: string
): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    const payload: JWTPayload = {
        userId,
        email,
        module,
    };

    return jwt.sign(payload, secret, {
        expiresIn: '24h',
    });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token string
 * @returns Decoded JWT payload
 */
export function verifyToken(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
        const decoded = jwt.verify(token, secret) as JWTPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token has expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid token');
        } else {
            throw new Error('Token verification failed');
        }
    }
}

/**
 * Refresh a token (generate new token with same payload but new expiry)
 * @param token Existing JWT token
 * @returns New JWT token
 */
export function refreshToken(token: string): string {
    const decoded = verifyToken(token);
    return generateToken(decoded.userId, decoded.email, decoded.module);
}
