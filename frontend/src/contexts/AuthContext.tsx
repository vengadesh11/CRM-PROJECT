import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthUser {
    id: string;
    email?: string;
    role?: string;
    fullName?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    permissions: string[];
    isSuperAdmin: boolean;
    hasPermission: (permission: string) => boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';
const TOKEN_KEY = 'crm_access_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = response.data.user;
                if (userData) {
                    const roleName = userData.role || '';
                    setUser({
                        id: userData.id,
                        email: userData.email,
                        role: roleName,
                        fullName: userData.full_name
                    });
                    setIsSuperAdmin(roleName.toLowerCase().includes('super admin'));
                } else {
                    setUser(null);
                }
                await loadPermissions(token);
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const loadPermissions = async (token: string) => {
        try {
            const response = await axios.get(`${API_BASE}/permissions/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPermissions(response.data.data || []);
        } catch (error) {
            console.error('Failed to load permissions:', error);
            setPermissions([]);
        }
    };

    const signIn = async (email: string, password: string) => {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const token = response.data.access_token as string | undefined;
        if (!token) {
            throw new Error('Missing access token');
        }
        localStorage.setItem(TOKEN_KEY, token);
        const userData = response.data.user;
        const roleName = userData.role || '';
        setUser({
            id: userData.id,
            email: userData.email,
            role: roleName,
            fullName: userData.full_name
        });
        setIsSuperAdmin(roleName.toLowerCase().includes('super admin'));
        await loadPermissions(token);
    };

    const signUp = async (email: string, password: string) => {
        await axios.post(`${API_BASE}/auth/signup`, { email, password });
    };

    const signOut = async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            await axios.post(`${API_BASE}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsSuperAdmin(false);
        setPermissions([]);
    };

    const getAccessToken = async (): Promise<string | null> => {
        return localStorage.getItem(TOKEN_KEY);
    };

    const hasPermission = (permission: string) =>
        isSuperAdmin || permissions.includes(permission);

    return (
        <AuthContext.Provider value={{ user, loading, permissions, isSuperAdmin, hasPermission, signIn, signUp, signOut, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
