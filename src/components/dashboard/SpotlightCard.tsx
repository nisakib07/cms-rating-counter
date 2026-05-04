'use client';

import { useState, useMemo } from 'react';
import { Crown, Flame, Star, CalendarDays, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import type { MemberWithStats, Rating } from '@/types/database';
import { toDriveDirectUrl, countFiveStarOrders, getNickname } from '@/lib/utils';
import {
  type FiscalQuarter,
  getFiscalQuarterMonths,
  getCurrentFiscalQuarter,
  getQuarterLabel,
  getCurrentFiscalYear,
  filterRatingsByQuarter,
} from '@/lib/fiscalQuarters';

interface SpotlightCardProps {
  members: MemberWithStats[];
  allRatings: Rating[];
}

type FilterPeriod = 'month' | FiscalQuarter;

export default function SpotlightCard({ members, allRatings }: SpotlightCardProps) {
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const currentQuarter = getCurrentFiscalQuarter();

  const spotlight = useMemo(() => {
    const now = new Date();

    let filteredRatings: Rating[];
    let periodLabel: string;
    let periodSubLabel: string;

    if (period === 'month') {
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredRatings = allRatings.filter(r => r.date_received.startsWith(thisMonthKey));
      periodLabel = now.toLocaleDateString('en-US', { month: 'long' });
      periodSubLabel = "This month's top performer";
    } else {
      // Quarter filtering using shared utility
      filteredRatings = filterRatingsByQuarter(allRatings, period);
      const fiscalYear = getCurrentFiscalYear();

      periodLabel = `${period} Spotlight`;
      periodSubLabel = `${getQuarterLabel(period)} · FY${fiscalYear + 1}`;
    }

    const memberCounts = members.map(m => ({
      ...m,
      monthlyCount: countFiveStarOrders(filteredRatings.filter(r => r.member_id === m.id)),
    })).filter(m => m.monthlyCount > 0).sort((a, b) => b.monthlyCount - a.monthlyCount);

    return {
      mvp: memberCounts[0] || null,
      periodLabel,
      periodSubLabel,
      runnerUps: memberCounts.slice(1, 3),
    };
  }, [members, allRatings, period]);

  const periodCountLabel = period === 'month' ? 'This month' : getQuarterLabel(period);

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-warning via-orange-400 to-warning" />
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-gradient-to-bl from-warning/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
              <Flame size={18} className="text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {period === 'month' ? `${spotlight.periodLabel} Spotlight` : spotlight.periodLabel}
              </h3>
              <p className="text-[11px] text-text-muted uppercase tracking-wider">{spotlight.periodSubLabel}</p>
            </div>
          </div>

          {/* Quarter filter dropdown */}
          <div className="relative">
            <select
              id="spotlight-period-selector"
              value={period}
              onChange={(e) => setPeriod(e.target.value as FilterPeriod)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] text-text-primary border border-white/[0.08] hover:border-warning/30 focus:border-warning/50 focus:ring-1 focus:ring-warning/20 outline-none transition-all duration-300 cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="month">This Month</option>
              <option value="Q1">{currentQuarter === 'Q1' ? 'Q1 (Jul–Sep) ●' : 'Q1 (Jul–Sep)'}</option>
              <option value="Q2">{currentQuarter === 'Q2' ? 'Q2 (Oct–Dec) ●' : 'Q2 (Oct–Dec)'}</option>
              <option value="Q3">{currentQuarter === 'Q3' ? 'Q3 (Jan–Mar) ●' : 'Q3 (Jan–Mar)'}</option>
              <option value="Q4">{currentQuarter === 'Q4' ? 'Q4 (Apr–Jun) ●' : 'Q4 (Apr–Jun)'}</option>
            </select>
          </div>
        </div>

        {!spotlight.mvp ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No ratings recorded for this period yet.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* MVP Profile */}
            <Link href={`/members/${spotlight.mvp.id}`} className="group flex flex-col items-center gap-3 shrink-0">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-warning to-orange-500 p-[2px] shadow-xl shadow-warning/25 group-hover:shadow-warning/40 transition-shadow duration-500">
                  <div className="w-full h-full rounded-2xl bg-surface flex items-center justify-center overflow-hidden text-warning text-2xl font-bold">
                    {spotlight.mvp.profile_image ? (
                      <img src={toDriveDirectUrl(spotlight.mvp.profile_image)} alt={spotlight.mvp.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = spotlight.mvp!.name.charAt(0); }} />
                    ) : spotlight.mvp.name.charAt(0)}
                  </div>
                </div>
                {/* Crown badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center shadow-lg shadow-warning/30">
                  <Crown size={14} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-text-primary text-lg group-hover:text-warning transition-colors">{spotlight.mvp.name}</div>
                <div className="text-xs text-text-muted">{spotlight.mvp.team?.name}</div>
              </div>
            </Link>

            {/* Stats */}
            <div className="flex-1 flex flex-col gap-4 w-full">
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 rounded-xl bg-warning/[0.06] border border-warning/10">
                  <div className="text-3xl font-extrabold text-warning tabular-nums">{spotlight.mvp.monthlyCount}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                    <CalendarDays size={10} className="inline mr-1" />
                    {periodCountLabel}
                  </div>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-primary/[0.06] border border-primary/10">
                  <div className="text-3xl font-extrabold text-primary-light tabular-nums">{spotlight.mvp.rating_count}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                    <Star size={10} className="inline mr-1" />
                    All time
                  </div>
                </div>
              </div>

              {/* Runner-ups */}
              {spotlight.runnerUps.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0">Also shining</span>
                  <div className="flex items-center gap-2">
                    {spotlight.runnerUps.map((r, i) => (
                      <Link key={r.id} href={`/members/${r.id}`} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all text-xs">
                        <span className="text-text-muted">{i === 0 ? '🥈' : '🥉'}</span>
                        <span className="text-text-secondary font-medium">{getNickname(r.name)}</span>
                        <span className="text-warning font-bold">{r.monthlyCount}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
