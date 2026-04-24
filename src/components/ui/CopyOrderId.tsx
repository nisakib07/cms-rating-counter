'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface CopyOrderIdProps {
  orderId: string;
  className?: string;
}

export default function CopyOrderId({ orderId, className = '' }: CopyOrderIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = orderId;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer group ${className}`}
      title={copied ? 'Copied!' : `Copy ${orderId}`}
    >
      {copied ? (
        <Check size={10} className="text-emerald-400" />
      ) : (
        <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}
