'use client';

import { ReactNode } from 'react';
import { Star, Users, UserCircle, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'star' | 'team' | 'member' | 'chart';
  title: string;
  description?: string;
  action?: ReactNode;
}

const iconMap = {
  star: Star,
  team: Users,
  member: UserCircle,
  chart: BarChart3,
};

export default function EmptyState({ icon = 'star', title, description, action }: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {/* Animated floating icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/10 flex items-center justify-center animate-float">
          <Icon size={32} className="text-primary-light/60" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-warning/30 animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-secondary/30 animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1.5">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
