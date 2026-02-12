
import axios from 'axios';

export interface CustomField {
    id: string;
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
    options?: string[];
    required?: boolean;
    order: number;
}

export const salesSettingsService = {
    getCustomFields: async (entityType: string, token: string): Promise<CustomField[]> => {
        try {
            const response = await axios.get(`/api/crm/custom-fields`, {
                params: { module: entityType },
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching custom fields:', error);
            // Return empty array to prevent crash if backend route missing
            return [];
        }
    }
};
