'use client';

import { useMemo } from 'react';
import { buildHeatmapData } from '@/lib/achievements';
import type { Rating } from '@/types/database';

interface RatingHeatmapProps {
  ratings: Rating[];
  months?: number;
}

export default function RatingHeatmap({ ratings, months = 6 }: RatingHeatmapProps) {
  const { weeks, monthLabels, maxCount } = useMemo(() => {
    const data = buildHeatmapData(ratings, months);
    const now = new Date();
    const totalDays = months * 30;
    
    // Build grid: each column is a week, each row is a day of week (0=Sun..6=Sat)
    const allWeeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    const labels: { label: string; weekIndex: number }[] = [];
    
    let max = 0;
    let lastMonth = -1;

    for (let i = totalDays; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const count = data.get(dateStr) || 0;
      if (count > max) max = count;

      // Track month labels
      const month = d.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), weekIndex: allWeeks.length });
        lastMonth = month;
      }

      currentWeek.push({ date: dateStr, count, dayOfWeek });

      if (dayOfWeek === 6 || i === 0) {
        allWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return { weeks: allWeeks, monthLabels: labels, maxCount: max };
  }, [ratings, months]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/[0.03]';
    if (maxCount <= 1) return 'bg-emerald-500/80';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.25) return 'bg-emerald-500/25';
    if (intensity <= 0.5) return 'bg-emerald-500/45';
    if (intensity <= 0.75) return 'bg-emerald-500/65';
    return 'bg-emerald-500/90';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      <h3 className="text-sm font-bold text-text-primary mb-4">Rating Activity</h3>
      
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 pt-5">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] text-[9px] text-text-muted leading-[12px]">{label}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-hidden">
          {/* Month labels */}
          <div className="flex mb-1" style={{ position: 'relative', height: '16px' }}>
            {monthLabels.map((ml, i) => (
              <span
                key={i}
                className="text-[9px] text-text-muted absolute"
                style={{ left: `${(ml.weekIndex / weeks.length) * 100}%` }}
              >
                {ml.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const cell = week.find(c => c.dayOfWeek === di);
                  if (!cell) return <div key={di} className="w-[12px] h-[12px]" />;
                  return (
                    <div
                      key={di}
                      className={`w-[12px] h-[12px] rounded-[2px] ${getColor(cell.count)} transition-colors`}
                      title={`${cell.date}: ${cell.count} rating${cell.count !== 1 ? 's' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[9px] text-text-muted">
        <span>Less</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.03]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/25" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/45" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/65" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/90" />
        <span>More</span>
      </div>
    </div>
  );
}
