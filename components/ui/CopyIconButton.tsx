'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyIconButtonProps {
    text: string;
    label?: string;
}

export default function CopyIconButton({ text, label }: CopyIconButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        navigator.clipboard.writeText(text);
        setCopied(true);
        if (label) {
            toast.success(`${label} copied to clipboard`);
        }
        
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <button 
            onClick={handleCopy}
            className="text-gray-400 hover:text-[#007398] transition-colors p-1 rounded hover:bg-gray-100 flex-shrink-0"
            title={`Copy ${label || 'text'}`}
        >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
    );
}
