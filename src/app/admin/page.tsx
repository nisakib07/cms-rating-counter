'use client';

import { Star, Users, UserCircle, TrendingUp, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import RecentRatings from '@/components/dashboard/RecentRatings';
import { toDriveDirectUrl } from '@/lib/utils';

export default function AdminDashboard() {
  const { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, allRatings, loading } = useDashboardStats();

  const totalMembers = topMembers.length;
  const avgRating = allRatings.length > 0 ? (allRatings.reduce((sum, r) => sum + r.rating_value, 0) / allRatings.length).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Overview of all teams and ratings</p>
        </div>
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link href="/admin/ratings?action=add" className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-primary/15 text-primary-light border border-primary/20 hover:bg-primary/25 transition-all">
            <Plus size={14} /> Add Rating
          </Link>
          <Link href="/admin/members?action=add" className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] transition-all">
            <Plus size={14} /> Add Member
          </Link>
          <Link href="/admin/teams?action=add" className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] transition-all">
            <Plus size={14} /> Add Team
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard icon={<Star size={22} className="text-white" />} label="Total Ratings" value={totalRatings} color="from-primary to-secondary" />
        <StatsCard icon={<TrendingUp size={22} className="text-white" />} label="CMS Hub" value={cmsHubRatings} color="from-cms-hub to-emerald-400" delay={100} />
        <StatsCard icon={<Zap size={22} className="text-white" />} label="CMS Endgame" value={cmsEndgameRatings} color="from-cms-endgame to-blue-400" delay={200} />
        <StatsCard icon={<Users size={22} className="text-white" />} label="Total Members" value={totalMembers} color="from-warning to-orange-400" delay={300} />
        <StatsCard icon={<Star size={22} className="text-white" fill="white" />} label="Avg Rating" value={parseFloat(avgRating)} color="from-secondary to-purple-400" delay={400} />
      </div>

      {/* Top performers + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UserCircle size={20} className="text-warning" />Top Members
          </h3>
          <div className="flex flex-col gap-2">
            {topMembers.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass hover:bg-glass-light transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-warning/20 text-warning' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-primary/20 text-primary-light'}`}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold text-xs overflow-hidden shrink-0">
                  {m.profile_image ? (
                    <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" />
                  ) : m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{m.name}</div>
                  <div className="text-xs text-text-muted">{m.team?.name}</div>
                </div>
                <span className="text-sm font-bold text-primary-light">{m.rating_count}</span>
              </div>
            ))}
            {topMembers.length === 0 && <p className="text-sm text-text-muted py-4 text-center">No members yet</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users size={20} className="text-cms-hub" />Top Teams
          </h3>
          <div className="flex flex-col gap-2">
            {topTeams.slice(0, 5).map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass hover:bg-glass-light transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-warning/20 text-warning' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-cms-hub/20 text-cms-hub'}`}>
                  {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.service_line}</div>
                </div>
                <span className="text-sm font-bold text-cms-hub">{t.rating_count}</span>
              </div>
            ))}
            {topTeams.length === 0 && <p className="text-sm text-text-muted py-4 text-center">No teams yet</p>}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Zap size={20} className="text-secondary" /> Recent Activity
        </h3>
        <div className="flex flex-col gap-2">
          {allRatings.slice(0, 5).map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass">
              <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                <Star size={14} className="text-warning" fill="#f59e0b" />
              </div>
              <p className="text-sm text-text-secondary flex-1">
                <span className="font-semibold text-text-primary">{r.member?.name || 'Someone'}</span> received{' '}
                <span className="text-warning font-semibold">{'⭐'.repeat(r.rating_value)}</span> from{' '}
                <span className="text-text-primary">{r.client_name || 'a client'}</span>
              </p>
              <span className="text-[10px] text-text-muted shrink-0">{new Date(r.date_received).toLocaleDateString()}</span>
            </div>
          ))}
          {allRatings.length === 0 && <p className="text-sm text-text-muted py-4 text-center">No activity yet</p>}
        </div>
      </div>

      <RecentRatings ratings={recentRatings} />
    </div>
  );
}
