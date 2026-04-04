'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  id?: string;
}

const variants = {
  primary: 'bg-primary hover:bg-primary-light text-white shadow-lg shadow-primary/20',
  secondary: 'bg-surface-light hover:bg-surface-lighter text-text-primary border border-border',
  danger: 'bg-danger hover:bg-danger-light text-white shadow-lg shadow-danger/20',
  ghost: 'bg-transparent hover:bg-glass-light text-text-secondary hover:text-text-primary',
  success: 'bg-success hover:bg-success-light text-white shadow-lg shadow-success/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled = false, className = '', id }: ButtonProps) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
