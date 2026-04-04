'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cms-hub' | 'cms-endgame' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

const variants = {
  'cms-hub': 'bg-cms-hub/15 text-cms-hub border-cms-hub/20',
  'cms-endgame': 'bg-cms-endgame/15 text-cms-endgame border-cms-endgame/20',
  primary: 'bg-primary/15 text-primary-light border-primary/20',
  success: 'bg-success/15 text-success-light border-success/20',
  warning: 'bg-warning/15 text-warning-light border-warning/20',
  danger: 'bg-danger/15 text-danger-light border-danger/20',
  neutral: 'bg-surface-light text-text-secondary border-border',
};

export default function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${variants[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {children}
    </span>
  );
}
