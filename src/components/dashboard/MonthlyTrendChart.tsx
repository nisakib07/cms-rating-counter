'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { Rating } from '@/types/database';

interface MonthlyTrendChartProps {
  ratings: Rating[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-light rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-base font-bold text-primary-light mt-0.5">
          {payload[0].value} ratings
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyTrendChart({ ratings }: MonthlyTrendChartProps) {
  // Build last 12 months data
  const months: { label: string; key: string; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ label, key, count: 0 });
  }

  // Count ratings per month
  ratings.forEach(r => {
    const d = new Date(r.date_received);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const month = months.find(m => m.key === key);
    if (month) month.count++;
  });

  const data = months.map(m => ({ name: m.label, ratings: m.count }));

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
          <TrendingUp size={18} className="text-secondary" />
        </div>
        Rating Trends
        <span className="text-xs text-text-muted font-normal ml-auto">Last 12 months</span>
      </h3>
      <div style={{ width: '100%', height: 260 }}>
        {ratings.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(124,58,237,0.2)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="ratings" stroke="#7c3aed" strokeWidth={2.5} fill="url(#trendGradient)" dot={{ fill: '#7c3aed', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#7c3aed', strokeWidth: 2, stroke: '#fff', r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm gap-2">
            <TrendingUp size={32} className="text-text-muted/30" />
            No rating data yet
          </div>
        )}
      </div>
    </div>
  );
}
