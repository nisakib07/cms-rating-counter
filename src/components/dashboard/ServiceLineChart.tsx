'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

interface ServiceLineChartProps {
  cmsHubRatings: number;
  cmsEndgameRatings: number;
}

export default function ServiceLineChart({ cmsHubRatings, cmsEndgameRatings }: ServiceLineChartProps) {
  const total = cmsHubRatings + cmsEndgameRatings;
  const data = [
    { name: 'CMS Hub', value: cmsHubRatings, color: '#10b981' },
    { name: 'CMS Endgame', value: cmsEndgameRatings, color: '#3b82f6' }
  ].filter(d => d.value > 0); // Hide empty segments from the pie

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-500 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cms-endgame/15 flex items-center justify-center shrink-0">
          <Layers size={18} className="text-cms-endgame-light" />
        </div>
        Service Lines
      </h3>

      {total > 0 ? (
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex-1 relative min-h-[160px] w-full mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center">
                  <span className="block text-2xl font-black text-text-primary leading-none">{total}</span>
                  <span className="text-[10px] text-text-muted uppercase tracking-widest mt-1 block">Total</span>
               </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="glass-light rounded-xl px-4 py-3 shadow-2xl border border-white/[0.1]">
                          <p className="text-sm font-semibold text-text-primary mb-1">{d.name}</p>
                          <p className="text-base font-bold" style={{ color: d.color }}>
                            {d.value} ratings <span className="text-xs font-normal text-text-muted">({Math.round((d.value / total) * 100)}%)</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend below the pie chart */}
          <div className="flex flex-col gap-3 mt-auto">
             <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cms-hub shadow-lg shadow-cms-hub/30" />
                  <span className="text-sm font-semibold text-text-primary">CMS Hub</span>
                </div>
                <span className="text-sm font-bold text-cms-hub">{cmsHubRatings} <span className="text-text-muted font-normal text-xs opacity-70">ratings</span></span>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cms-endgame shadow-lg shadow-cms-endgame/30" />
                  <span className="text-sm font-semibold text-text-primary">CMS Endgame</span>
                </div>
                <span className="text-sm font-bold text-cms-endgame">{cmsEndgameRatings} <span className="text-text-muted font-normal text-xs opacity-70">ratings</span></span>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm gap-2 min-h-[220px]">
          <Layers size={32} className="text-text-muted/30" />
          No rating data yet
        </div>
      )}
    </div>
  );
}
