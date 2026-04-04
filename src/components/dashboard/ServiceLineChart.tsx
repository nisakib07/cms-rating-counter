'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface ServiceLineChartProps {
  cmsHubRatings: number;
  cmsEndgameRatings: number;
}

const COLORS = ['#10b981', '#3b82f6'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-light rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-sm font-semibold text-text-primary">{payload[0].name}</p>
        <p className="text-base font-bold mt-1" style={{ color: COLORS[payload[0].name === 'CMS Hub' ? 0 : 1] }}>
          {payload[0].value} ratings
        </p>
      </div>
    );
  }
  return null;
};

export default function ServiceLineChart({ cmsHubRatings, cmsEndgameRatings }: ServiceLineChartProps) {
  const data = [
    { name: 'CMS Hub', value: cmsHubRatings },
    { name: 'CMS Endgame', value: cmsEndgameRatings },
  ];
  const total = cmsHubRatings + cmsEndgameRatings;

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cms-endgame/15 flex items-center justify-center">
          <PieIcon size={18} className="text-cms-endgame-light" />
        </div>
        Service Lines
      </h3>
      <div style={{ width: '100%', height: 280 }}>
        {total > 0 ? (
          <div className="flex items-center h-full gap-8">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {data.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-5 pr-2">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: COLORS[index] }} />
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{entry.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {entry.value} ratings · {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm gap-2">
            <PieIcon size={32} className="text-text-muted/30" />
            No rating data yet
          </div>
        )}
      </div>
    </div>
  );
}
