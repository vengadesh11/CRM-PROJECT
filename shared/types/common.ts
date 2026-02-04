// Shared User type
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role_id?: string;
    department_id?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

// Shared Role type
export interface Role {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at?: string;
}

// Shared Permission type
export interface Permission {
    id: string;
    name: string;
    description?: string;
    module: string;
    resource: string;
    action: string;
}

// Role Permission mapping
export interface RolePermission {
    role_id: string;
    permission_id: string;
}

// Department type
export interface Department {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
    is_active: boolean;
    created_at?: string;
}

// JWT Payload
export interface JWTPayload {
    userId: string;
    email: string;
    module?: string;
    iat?: number;
    exp?: number;
}

// Auth Request (extends Express Request)
export interface AuthRequest {
    auth?: {
        userId: string;
        email: string;
    };
}
