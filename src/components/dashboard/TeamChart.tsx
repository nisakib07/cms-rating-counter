'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { TeamWithStats } from '@/types/database';
import { BarChart3 } from 'lucide-react';

interface TeamChartProps {
  teams: TeamWithStats[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; rating_count: number; service_line: string } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-light rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-sm font-semibold text-text-primary">{data.fullName}</p>
        <p className="text-xs text-text-muted mt-0.5">{data.service_line}</p>
        <p className="text-base font-bold mt-1" style={{ color: data.service_line === 'CMS Hub' ? '#10b981' : '#3b82f6' }}>
          {data.rating_count} ratings
        </p>
      </div>
    );
  }
  return null;
};

export default function TeamChart({ teams }: TeamChartProps) {
  const data = teams.map(t => ({
    name: t.name.length > 10 ? t.name.substring(0, 10) + '…' : t.name,
    fullName: t.name,
    rating_count: t.rating_count,
    service_line: t.service_line,
  }));

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-400 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 via-primary/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <BarChart3 size={18} className="text-primary-light" />
        </div>
        Team Performance
      </h3>
      <div style={{ width: '100%', height: 280 }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="rating_count" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.service_line === 'CMS Hub' ? '#10b981' : '#3b82f6'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm gap-2">
            <BarChart3 size={32} className="text-text-muted/30" />
            No rating data yet
          </div>
        )}
      </div>
    </div>
  );
}
