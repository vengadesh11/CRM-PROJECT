
import React from 'react';
import type { CustomField } from '../../services/salesSettingsService';

interface CustomFieldRendererProps {
    fields: CustomField[];
    data: Record<string, any>;
    onChange: (id: string, value: any) => void;
    disabled?: boolean;
}

export const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({ fields, data, onChange, disabled }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field) => (
                <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                        <textarea
                            value={data[field.key] || ''}
                            onChange={(e) => onChange(field.key, e.target.value)}
                            disabled={disabled}
                            name={field.key}
                            className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
                            rows={3}
                        />
                    ) : field.type === 'select' ? (
                        <select
                            value={data[field.key] || ''}
                            onChange={(e) => onChange(field.key, e.target.value)}
                            disabled={disabled}
                            name={field.key}
                            className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    ) : field.type === 'checkbox' ? (
                        <input
                            type="checkbox"
                            checked={!!data[field.key]}
                            onChange={(e) => onChange(field.key, e.target.checked)}
                            disabled={disabled}
                            name={field.key}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-600 disabled:opacity-70"
                        />
                    ) : (
                        <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={data[field.key] || ''}
                            onChange={(e) => onChange(field.key, e.target.value)}
                            disabled={disabled}
                            name={field.key}
                            className="w-full p-2.5 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
