'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cms-hub' | 'cms-endgame' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  customColor?: string;
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

// Convert hex to rgb format for opacity: "rgb(R G B / opacity)"
function hexToRGB(hex: string) {
  if (!hex) return '255 255 255';
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `${r} ${g} ${b}`;
}

export default function Badge({ children, variant = 'neutral', size = 'sm', customColor }: BadgeProps) {
  const dynamicStyle = customColor ? {
    backgroundColor: `rgb(${hexToRGB(customColor)} / 0.15)`,
    color: customColor,
    borderColor: `rgb(${hexToRGB(customColor)} / 0.20)`
  } : {};

  return (
    <span 
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${customColor ? '' : variants[variant]} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      style={dynamicStyle}
    >
      {children}
    </span>
  );
}
