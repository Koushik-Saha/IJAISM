'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface FileUploadButtonProps {
    onUploadSuccess: (url: string) => void;
    accept?: string;
    label?: string;
    fileType?: string;
    className?: string;
}

export default function FileUploadButton({
    onUploadSuccess,
    accept = "image/*",
    label = "Upload File",
    fileType = "other",
    className = ""
}: FileUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading(`Uploading ${file.name}...`);

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('file', file);
            data.append('fileType', fileType);

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const result = await response.json();
            onUploadSuccess(result.data.url);
            toast.success('File uploaded successfully!', { id: toastId });
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload file', { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                onChange={handleFileUpload}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded border border-gray-300 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
                {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                ) : (
                    <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Uploading...' : label}
            </button>
        </div>
    );
}
