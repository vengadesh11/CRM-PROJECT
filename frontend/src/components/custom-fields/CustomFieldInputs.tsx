
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';

export type CustomFieldType =
    | 'text'
    | 'number'
    | 'date'
    | 'textarea'
    | 'dropdown'
    | 'radio'
    | 'checkbox'
    | 'image';

export interface CustomField {
    id: string;
    label: string;
    field_type: CustomFieldType;
    required: boolean;
    placeholder?: string | null;
    options?: string[] | null;
}

interface CustomFieldInputsProps {
    fields: CustomField[];
    values: Record<string, any>;
    onChange: (fieldId: string, value: any) => void;
    onUploadImage?: (fieldId: string, file: File) => Promise<void>;
    uploadingFieldIds?: Set<string>;
    readOnly?: boolean;
}

export default function CustomFieldInputs({
    fields,
    values,
    onChange,
    onUploadImage,
    uploadingFieldIds,
    readOnly
}: CustomFieldInputsProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => {
                const value = values[field.id] ?? '';

                if (field.field_type === 'textarea') {
                    return (
                        <TextArea
                            key={field.id}
                            label={field.label}
                            placeholder={field.placeholder || field.label}
                            rows={3}
                            value={value}
                            onChange={(e) => !readOnly && onChange(field.id, e.target.value)}
                            disabled={readOnly}
                        />
                    );
                }

                if (field.field_type === 'dropdown') {
                    return (
                        <Select
                            key={field.id}
                            label={field.label}
                            options={(field.options || []).map((option) => ({ value: option, label: option }))}
                            value={value}
                            onChange={(e) => !readOnly && onChange(field.id, e.target.value)}
                            disabled={readOnly}
                        />
                    );
                }

                if (field.field_type === 'radio') {
                    return (
                        <div key={field.id} className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{field.label}</label>
                            <div className="flex flex-wrap gap-3">
                                {(field.options || []).map((option) => (
                                    <label key={option} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={field.id}
                                            value={option}
                                            checked={value === option}
                                            onChange={() => !readOnly && onChange(field.id, option)}
                                            disabled={readOnly}
                                            className="text-primary-600 focus:ring-primary-500"
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                }

                if (field.field_type === 'checkbox') {
                    return (
                        <label key={field.id} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => !readOnly && onChange(field.id, e.target.checked)}
                                disabled={readOnly}
                                className="rounded border-gray-300 bg-white text-primary-600 focus:ring-primary-500 shadow-sm"
                            />
                            {field.label}
                        </label>
                    );
                }

                if (field.field_type === 'image') {
                    const isUploading = uploadingFieldIds?.has(field.id);
                    return (
                        <div key={field.id} className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{field.label}</label>
                            <div className="mt-2 border border-dashed border-gray-200 rounded-xl bg-gray-50 p-4 flex items-center justify-between shadow-inner">
                                <div className="text-sm text-gray-500">
                                    {value ? 'Image uploaded' : field.placeholder || 'Upload image'}
                                </div>
                                <label className="cursor-pointer">
                                    <span className="text-primary-600 text-sm font-bold hover:text-primary-700 underline underline-offset-4">
                                        {isUploading ? 'Uploading...' : 'Choose file'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!readOnly && file && onUploadImage) {
                                                onUploadImage(field.id, file);
                                            }
                                        }}
                                        disabled={isUploading || readOnly}
                                    />
                                </label>
                            </div>
                        </div>
                    );
                }

                return (
                    <Input
                        key={field.id}
                        label={field.label}
                        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                        placeholder={field.placeholder || field.label}
                        value={value}
                        onChange={(e) => !readOnly && onChange(field.id, e.target.value)}
                        disabled={readOnly}
                    />
                );
            })}
        </div>
    );
}
