'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import type { Rating } from '@/types/database';
import { countFiveStarOrders } from '@/lib/utils';

interface ServiceLineComparisonProps {
  allRatings: Rating[];
  hubTeamIds: string[];
  endgameTeamIds: string[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-light rounded-xl px-4 py-3 shadow-2xl border border-white/[0.08]">
        <p className="text-xs text-text-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.dataKey === 'hub' ? 'CMS Hub' : 'CMS Endgame'}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ServiceLineComparison({ allRatings, hubTeamIds, endgameTeamIds }: ServiceLineComparisonProps) {
  // Build last 6 months data with unique counting
  const now = new Date();
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const monthRatings = allRatings.filter(r => r.date_received.startsWith(key));
    data.push({
      name: label,
      hub: countFiveStarOrders(monthRatings.filter(r => hubTeamIds.includes(r.team_id))),
      endgame: countFiveStarOrders(monthRatings.filter(r => endgameTeamIds.includes(r.team_id))),
    });
  }

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <GitCompareArrows size={18} className="text-primary-light" />
        </div>
        Hub vs Endgame
        <span className="text-xs text-text-muted font-normal ml-auto">Last 6 months</span>
      </h3>
      <div className="flex-1" style={{ width: '100%', minHeight: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <defs>
              <linearGradient id="hubGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="endgameGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => <span className="text-xs text-text-secondary">{value === 'hub' ? 'CMS Hub' : 'CMS Endgame'}</span>}
              iconType="circle"
              iconSize={8}
            />
            <Area type="monotone" dataKey="hub" stroke="#10b981" strokeWidth={2.5} fill="url(#hubGradient)" dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#10b981', strokeWidth: 2, stroke: '#fff', r: 5 }} />
            <Area type="monotone" dataKey="endgame" stroke="#3b82f6" strokeWidth={2.5} fill="url(#endgameGradient)" dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#3b82f6', strokeWidth: 2, stroke: '#fff', r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
