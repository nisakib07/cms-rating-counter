'use client';

import { Star, Users, UserCircle, TrendingUp } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import RecentRatings from '@/components/dashboard/RecentRatings';

export default function AdminDashboard() {
  const { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Overview of all teams and ratings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={<Star size={22} className="text-white" />} label="Total Ratings" value={totalRatings} color="from-primary to-secondary" />
        <StatsCard icon={<TrendingUp size={22} className="text-white" />} label="CMS Hub" value={cmsHubRatings} color="from-cms-hub to-emerald-400" delay={100} />
        <StatsCard icon={<TrendingUp size={22} className="text-white" />} label="CMS Endgame" value={cmsEndgameRatings} color="from-cms-endgame to-blue-400" delay={200} />
        <StatsCard icon={<Users size={22} className="text-white" />} label="Total Teams" value={topTeams.length} color="from-warning to-orange-400" delay={300} />
      </div>

      {/* Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <UserCircle size={20} className="text-warning" />Top Members
          </h3>
          <div className="flex flex-col gap-2">
            {topMembers.slice(0, 5).map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass hover:bg-glass-light transition-colors">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary-light">{i + 1}</span>
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
                <span className="w-6 h-6 rounded-full bg-cms-hub/20 flex items-center justify-center text-xs font-bold text-cms-hub">{i + 1}</span>
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

      <RecentRatings ratings={recentRatings} />
    </div>
  );
}
