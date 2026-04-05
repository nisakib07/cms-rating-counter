'use client';

import { BarChart2 } from 'lucide-react';

interface ServiceLineChartProps {
  cmsHubRatings: number;
  cmsEndgameRatings: number;
}

export default function ServiceLineChart({ cmsHubRatings, cmsEndgameRatings }: ServiceLineChartProps) {
  const total = cmsHubRatings + cmsEndgameRatings;
  const hubPercent = total > 0 ? Math.round((cmsHubRatings / total) * 100) : 0;
  const endgamePercent = total > 0 ? Math.round((cmsEndgameRatings / total) * 100) : 0;

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cms-hub/50 to-cms-endgame/50" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-cms-endgame/15 flex items-center justify-center">
          <BarChart2 size={18} className="text-cms-endgame-light" />
        </div>
        Service Lines
      </h3>

      {total > 0 ? (
        <div className="flex flex-col gap-6">
          {/* Combined progress bar */}
          <div className="relative">
            <div className="flex h-5 rounded-full overflow-hidden bg-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-cms-hub to-emerald-400 transition-all duration-700 ease-out relative"
                style={{ width: `${hubPercent}%` }}
              >
                {hubPercent > 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{hubPercent}%</span>
                )}
              </div>
              <div
                className="h-full bg-gradient-to-r from-cms-endgame to-blue-400 transition-all duration-700 ease-out relative"
                style={{ width: `${endgamePercent}%` }}
              >
                {endgamePercent > 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{endgamePercent}%</span>
                )}
              </div>
            </div>
          </div>

          {/* Individual bars */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-cms-hub" />
                  <span className="text-sm font-semibold text-text-primary">CMS Hub</span>
                </div>
                <span className="text-sm font-bold text-cms-hub">{cmsHubRatings} <span className="text-text-muted font-normal text-xs">ratings</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cms-hub to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${hubPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-cms-endgame" />
                  <span className="text-sm font-semibold text-text-primary">CMS Endgame</span>
                </div>
                <span className="text-sm font-bold text-cms-endgame">{cmsEndgameRatings} <span className="text-text-muted font-normal text-xs">ratings</span></span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cms-endgame to-blue-400 transition-all duration-700 ease-out" style={{ width: `${endgamePercent}%` }} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/30">
            <span className="text-xs text-text-muted">Total: <span className="font-bold text-text-primary">{total}</span> ratings</span>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-text-muted text-sm gap-2">
          <BarChart2 size={32} className="text-text-muted/30" />
          No rating data yet
        </div>
      )}
    </div>
  );
}
