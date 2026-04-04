'use client';

import { Trophy, Users, Crown } from 'lucide-react';
import type { MemberWithStats, TeamWithStats } from '@/types/database';
import Badge from '@/components/ui/Badge';

interface LeaderboardCardProps {
  topMember?: MemberWithStats;
  topTeam?: TeamWithStats;
}

export default function LeaderboardCard({ topMember, topTeam }: LeaderboardCardProps) {
  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-300 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-warning/5 to-transparent rounded-bl-full" />
      
      <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
          <Trophy size={20} className="text-warning" />
        </div>
        Leaderboard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        {/* Top Member */}
        <div className="relative bg-gradient-to-br from-warning/10 via-warning/5 to-transparent rounded-2xl p-5 border border-warning/10 overflow-hidden group hover:border-warning/20 transition-all duration-300">
          <div className="absolute top-3 right-3">
            <Crown size={28} className="text-warning/20 group-hover:text-warning/40 transition-colors" />
          </div>
          <div className="text-[10px] text-warning font-bold mb-4 uppercase tracking-[0.2em]">🥇 Top Performer</div>
          {topMember ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-warning/25">
                {topMember.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-text-primary text-lg truncate">{topMember.name}</div>
                <div className="text-sm text-text-muted mt-0.5">{topMember.team?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-warning">{topMember.rating_count}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">ratings</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-3">No data yet</p>
          )}
        </div>

        {/* Top Team */}
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all duration-300">
          <div className="absolute top-3 right-3">
            <Users size={28} className="text-primary/20 group-hover:text-primary/40 transition-colors" />
          </div>
          <div className="text-[10px] text-primary-light font-bold mb-4 uppercase tracking-[0.2em]">🏆 Top Team</div>
          {topTeam ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                <Users size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-text-primary text-lg truncate">{topTeam.name}</div>
                <Badge variant={topTeam.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm">
                  {topTeam.service_line}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-primary-light">{topTeam.rating_count}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">ratings</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-3">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
