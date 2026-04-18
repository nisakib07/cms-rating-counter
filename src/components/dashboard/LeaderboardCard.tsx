'use client';

import { Trophy, Users, Crown, Medal } from 'lucide-react';
import Link from 'next/link';
import type { MemberWithStats, TeamWithStats } from '@/types/database';
import Badge from '@/components/ui/Badge';
import { toDriveDirectUrl } from '@/lib/utils';

interface LeaderboardCardProps {
  topMembers: MemberWithStats[];
  topTeam?: TeamWithStats;
}

const RANK_STYLES = [
  { emoji: '🥇', gradientFrom: 'from-warning', gradientTo: 'to-orange-500', shadow: 'shadow-warning/25', barColor: 'bg-warning' },
  { emoji: '🥈', gradientFrom: 'from-slate-300', gradientTo: 'to-slate-400', shadow: 'shadow-slate-300/20', barColor: 'bg-slate-400' },
  { emoji: '🥉', gradientFrom: 'from-amber-600', gradientTo: 'to-amber-700', shadow: 'shadow-amber-600/20', barColor: 'bg-amber-600' },
  { emoji: '4', gradientFrom: 'from-primary', gradientTo: 'to-secondary', shadow: 'shadow-primary/15', barColor: 'bg-primary/60' },
  { emoji: '5', gradientFrom: 'from-primary', gradientTo: 'to-secondary', shadow: 'shadow-primary/15', barColor: 'bg-primary/40' },
];

export default function LeaderboardCard({ topMembers, topTeam }: LeaderboardCardProps) {
  const top5 = topMembers.filter(m => m.rating_count > 0).slice(0, 5);
  const maxCount = top5[0]?.rating_count || 1;

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-300 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-warning/5 to-transparent rounded-bl-full" />
      
      <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
          <Trophy size={20} className="text-warning" />
        </div>
        Leaderboard
        <Link href="/leaderboard" className="ml-auto text-xs font-medium text-text-muted hover:text-primary-light transition-colors">
          View all →
        </Link>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        {/* Top 5 Members - Takes 3 columns */}
        <div className="lg:col-span-3 flex flex-col gap-2.5">
          <div className="text-[10px] text-text-muted font-semibold uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
            <Medal size={12} className="text-warning" />
            Top Performers
          </div>
          {top5.length === 0 ? (
            <p className="text-sm text-text-muted py-3">No data yet</p>
          ) : top5.map((member, i) => {
            const rank = RANK_STYLES[i];
            const barWidth = Math.max(15, (member.rating_count / maxCount) * 100);
            const isTop3 = i < 3;
            return (
              <Link
                key={member.id}
                href={`/members/${member.id}`}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group hover:bg-white/[0.04] ${isTop3 ? '' : 'opacity-75 hover:opacity-100'}`}
              >
                {/* Rank */}
                <div className="w-6 text-center shrink-0">
                  {isTop3 ? (
                    <span className="text-sm">{rank.emoji}</span>
                  ) : (
                    <span className="text-xs text-text-muted font-bold">{rank.emoji}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${rank.gradientFrom} ${rank.gradientTo} flex items-center justify-center text-white font-bold text-xs ${rank.shadow} shadow-lg overflow-hidden shrink-0`}>
                  {member.profile_image ? (
                    <img src={toDriveDirectUrl(member.profile_image)} alt={member.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = member.name.charAt(0); }} />
                  ) : member.name.charAt(0)}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold truncate group-hover:text-primary-light transition-colors ${isTop3 ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {member.name}
                    </span>
                    <span className={`text-sm font-extrabold tabular-nums shrink-0 ml-3 ${i === 0 ? 'text-warning' : 'text-text-secondary'}`}>
                      {member.rating_count}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rank.barColor} transition-all duration-700 ease-out`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Top Team - Takes 2 columns */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="text-[10px] text-primary-light font-semibold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Users size={12} className="text-primary-light" />
            Top Team
          </div>
          {topTeam ? (
            <Link
              href={`/teams/${topTeam.id}`}
              className="flex-1 relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/10 overflow-hidden group hover:border-primary/20 transition-all duration-300 card-hover flex flex-col justify-center"
            >
              <div className="absolute top-3 right-3">
                <Crown size={28} className="text-primary/20 group-hover:text-primary/40 transition-colors" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                  <Users size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text-primary text-lg truncate group-hover:text-primary-light transition-colors">{topTeam.name}</div>
                  <Badge variant={topTeam.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={topTeam.color}>
                    {topTeam.service_line}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-primary-light tabular-nums">{topTeam.rating_count}</span>
                <span className="text-xs text-text-muted uppercase tracking-wider">ratings</span>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                {topTeam.member_count} member{topTeam.member_count !== 1 ? 's' : ''}
              </div>
            </Link>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-white/[0.06] p-5">
              <p className="text-sm text-text-muted">No data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
