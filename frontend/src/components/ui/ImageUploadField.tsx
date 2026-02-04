import React from 'react';

interface ImageUploadFieldProps {
    label: string;
    value?: string | null;
    placeholder?: string;
    onUpload: (file: File) => void;
    uploading?: boolean;
}

export default function ImageUploadField({
    label,
    value,
    placeholder,
    onUpload,
    uploading
}: ImageUploadFieldProps) {
    return (
        <div className="w-full">
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">{label}</label>
            <div className="border border-dashed border-dark-600 rounded-xl bg-dark-800/40 p-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    {value ? 'Image uploaded' : placeholder || 'Upload image'}
                </div>
                <label className="cursor-pointer">
                    <span className="text-primary-400 text-sm font-medium">
                        {uploading ? 'Uploading...' : 'Choose file'}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onUpload(file);
                        }}
                        disabled={uploading}
                    />
                </label>
            </div>
        </div>
    );
}
