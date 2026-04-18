'use client';

import { useMemo } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import type { Rating } from '@/types/database';
import { countFiveStarOrders } from '@/lib/utils';

interface GoalProgressProps {
  allRatings: Rating[];
  monthlyGoal?: number;
}

export default function GoalProgress({ allRatings, monthlyGoal = 20 }: GoalProgressProps) {
  const progress = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const monthRatings = allRatings.filter(r => r.date_received.startsWith(monthKey));
    const count = countFiveStarOrders(monthRatings);
    const percent = Math.min(Math.round((count / monthlyGoal) * 100), 100);

    // Days remaining in month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const msPerDay = 86400000;
    const daysRemaining = Math.max(0, Math.ceil((lastDay.getTime() - now.getTime()) / msPerDay));

    return { count, percent, monthName, daysRemaining };
  }, [allRatings, monthlyGoal]);

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-secondary" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Target size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">{progress.monthName} Goal</h3>
            <p className="text-[11px] text-text-muted">{progress.daysRemaining} days remaining</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-text-primary tabular-nums">
            {progress.count}<span className="text-text-muted font-normal text-base">/{monthlyGoal}</span>
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider">5★ Ratings</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-primary to-secondary transition-all duration-1000 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
        {/* Shine effect */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ width: `${progress.percent}%`, animation: 'shimmer 2s ease-in-out infinite' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-muted">{progress.percent}% complete</span>
        {progress.percent >= 100 ? (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp size={12} /> Goal reached! 🎉
          </span>
        ) : (
          <span className="text-xs text-text-muted">
            {monthlyGoal - progress.count} more to go
          </span>
        )}
      </div>
    </div>
  );
}
