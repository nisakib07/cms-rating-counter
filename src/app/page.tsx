'use client';

import { Star, TrendingUp, Zap, Shield, ArrowRight, ArrowUpRight, ArrowDownRight, Trophy } from 'lucide-react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';
import TeamChart from '@/components/dashboard/TeamChart';
import ServiceLineChart from '@/components/dashboard/ServiceLineChart';
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart';
import RecentRatings from '@/components/dashboard/RecentRatings';
import GlobalSearch from '@/components/dashboard/GlobalSearch';
import { StatsCardSkeleton, LeaderboardSkeleton, ChartSkeleton, RecentRatingsSkeleton } from '@/components/ui/Skeleton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function PublicDashboard() {
  const { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, allRatings, loading } = useDashboardStats();

  // Calculate this month vs last month
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthCount = allRatings.filter(r => r.date_received.startsWith(thisMonthKey)).length;
  const lastMonthCount = allRatings.filter(r => r.date_received.startsWith(lastMonthKey)).length;
  const changePercent = lastMonthCount > 0 ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : (thisMonthCount > 0 ? 100 : 0);

  return (
    <div className="min-h-screen relative">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cms-endgame/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-secondary/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'rgba(11, 17, 32, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Star size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-tight">StarLedger</span>
            </div>
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <Link href="/leaderboard" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                <Trophy size={14} />
                Leaderboard
              </Link>
              <ThemeToggle />
              <Link href="/submit" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover border border-primary-light/20 transition-all duration-300 shadow-lg shadow-primary/25">
                <Star size={14} fill="currentColor" />
                Submit Rating
              </Link>
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
                <Shield size={14} />
                <span className="hidden sm:inline">Admin</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/15 text-primary-light text-xs font-semibold tracking-wide mb-6">
            <Star size={12} fill="currentColor" />
            PERFORMANCE TRACKING PLATFORM
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            <span className="gradient-text">Team Performance</span>
            <br />
            <span className="text-text-primary">Rating Tracker</span>
          </h1>
          <p className="text-base lg:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Tracking Fiverr ⭐ 5-star ratings across all teams.<br className="hidden sm:block" />
            Celebrating excellence in <span className="text-cms-hub font-semibold">CMS Hub</span> & <span className="text-cms-endgame font-semibold">CMS Endgame</span>.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-24 relative z-10">
        {loading ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton />
            </div>
            <LeaderboardSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton /><ChartSkeleton />
            </div>
            <ChartSkeleton />
            <RecentRatingsSkeleton />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatsCard
                icon={<Star size={24} className="text-white" fill="white" />}
                label="Total Ratings"
                value={totalRatings}
                color="from-primary to-secondary"
                glowClass="glow-primary"
                delay={0}
                trend={changePercent !== 0 ? { value: changePercent, label: 'vs last month' } : undefined}
              />
              <StatsCard
                icon={<TrendingUp size={24} className="text-white" />}
                label="CMS Hub"
                value={cmsHubRatings}
                color="from-cms-hub to-emerald-400"
                glowClass="glow-hub"
                delay={150}
              />
              <StatsCard
                icon={<Zap size={24} className="text-white" />}
                label="CMS Endgame"
                value={cmsEndgameRatings}
                color="from-cms-endgame to-blue-400"
                glowClass="glow-endgame"
                delay={300}
              />
              <StatsCard
                icon={<Star size={24} className="text-white" />}
                label="This Month"
                value={thisMonthCount}
                color="from-secondary to-purple-400"
                delay={450}
              />
            </div>

            {/* Leaderboard */}
            <LeaderboardCard topMember={topMembers[0]} topTeam={topTeams[0]} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-full">
                <div className="h-full"><TeamChart teams={topTeams} /></div>
              </div>
              <div className="lg:col-span-1 h-full">
                <div className="h-full"><ServiceLineChart cmsHubRatings={cmsHubRatings} cmsEndgameRatings={cmsEndgameRatings} /></div>
              </div>
            </div>

            {/* Trend Chart */}
            <MonthlyTrendChart ratings={allRatings} />

            {/* Recent Ratings */}
            <RecentRatings ratings={recentRatings} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Star size={10} className="text-white" fill="white" />
            </div>
            <span className="text-sm text-text-muted">© {new Date().getFullYear()} StarLedger</span>
          </div>
          <span className="text-xs text-text-muted">Team Performance Tracker</span>
        </div>
      </footer>
    </div>
  );
}
