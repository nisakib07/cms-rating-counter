'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { TeamWithStats } from '@/types/database';
import { BarChart3 } from 'lucide-react';

interface TeamChartProps {
  teams: TeamWithStats[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; rating_count: number; service_line: string; color?: string } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-light rounded-xl px-4 py-3 shadow-2xl border border-white/[0.08]">
        <p className="text-sm font-semibold text-text-primary">{data.fullName}</p>
        <p className="text-xs text-text-muted mt-0.5">{data.service_line}</p>
        <p className="text-base font-bold mt-1" style={{ color: data.color || (data.service_line === 'CMS Hub' ? '#10b981' : '#3b82f6') }}>
          {data.rating_count} ratings
        </p>
      </div>
    );
  }
  return null;
};

// Custom label rendered inside or after each bar
const renderBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value) return null;
  const isInside = width > 40;
  return (
    <text
      x={isInside ? x + width - 8 : x + width + 8}
      y={y + height / 2}
      fill={isInside ? 'rgba(255,255,255,0.9)' : '#94a3b8'}
      textAnchor={isInside ? 'end' : 'start'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {value}
    </text>
  );
};

export default function TeamChart({ teams }: TeamChartProps) {
  // Sort by rating count descending for a nicer visual
  const sorted = [...teams].sort((a, b) => b.rating_count - a.rating_count);

  const data = sorted.map(t => ({
    name: t.name,
    fullName: t.name,
    rating_count: t.rating_count,
    service_line: t.service_line,
    color: t.color,
  }));

  // Dynamic height: at least 240px, grows with team count (48px per bar)
  const chartHeight = Math.max(240, data.length * 48 + 20);

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-400 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 via-primary/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <BarChart3 size={18} className="text-primary-light" />
        </div>
        Team Performance
      </h3>
      <div className="flex-1" style={{ width: '100%', minHeight: chartHeight }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="rating_count" radius={[0, 8, 8, 0]} maxBarSize={32} animationDuration={800}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color || (entry.service_line === 'CMS Hub' ? '#10b981' : '#3b82f6')}
                    fillOpacity={0.85}
                  />
                ))}
                <LabelList dataKey="rating_count" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm gap-2" style={{ minHeight: 240 }}>
            <BarChart3 size={32} className="text-text-muted/30" />
            No rating data yet
          </div>
        )}
      </div>
    </div>
  );
}
