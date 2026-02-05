import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/crm';

// --- Types ---

export interface WebhookEndpoint {
    id: string;
    url: string;
    description?: string;
    events: string[];
    is_active: boolean;
    secret?: string; // Only visible on creation usually, or if Admin
    created_at: string;
}

export interface Integration {
    id: string;
    name: string;
    provider: string;
    description?: string;
    is_active: boolean;
    config: Record<string, any>;
    triggers: string[];
    updated_at: string;
}

export interface ApiKey {
    id: string;
    name: string;
    prefix: string; // e.g. "sk_live_..."
    created_at: string;
    last_used_at?: string;
    apiKey?: string; // Only present upon creation
}

// --- Webhooks API ---

export const getWebhookEndpoints = async (token: string) => {
    const response = await axios.get(`${API_BASE}/webhooks/endpoints`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as WebhookEndpoint[];
};

export const createWebhookEndpoint = async (token: string, data: { url: string; events: string[]; description?: string }) => {
    const response = await axios.post(`${API_BASE}/webhooks/endpoints`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const deleteWebhookEndpoint = async (token: string, id: string) => {
    await axios.delete(`${API_BASE}/webhooks/endpoints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const testWebhookDispatch = async (token: string, event: string) => {
    const response = await axios.post(`${API_BASE}/webhooks/test`, { event }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// --- Integrations API ---

export const getIntegrations = async (token: string, activeOnly = false) => {
    const response = await axios.get(`${API_BASE}/integrations`, {
        params: { active: activeOnly },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as Integration[];
};

export const updateIntegration = async (token: string, id: string, data: Partial<Integration> & { secrets?: Record<string, string> }) => {
    const response = await axios.patch(`${API_BASE}/integrations/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export const getIntegrationLogs = async (token: string, id: string, limit = 50) => {
    const response = await axios.get(`${API_BASE}/integrations/${id}/logs`, {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

// --- API Keys API ---

export const getApiKeys = async (token: string) => {
    const response = await axios.get(`${API_BASE}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as ApiKey[];
};

export const createApiKey = async (token: string, name: string) => {
    const response = await axios.post(`${API_BASE}/api-keys`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as ApiKey; // Contains full key
};

export const deleteApiKey = async (token: string, id: string) => {
    await axios.delete(`${API_BASE}/api-keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
