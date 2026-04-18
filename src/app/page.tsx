'use client';

import { useState } from 'react';
import { Star, TrendingUp, Zap, Shield, ArrowRight, ArrowUpRight, ArrowDownRight, Trophy, Menu, X, Plus } from 'lucide-react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';
import SpotlightCard from '@/components/dashboard/SpotlightCard';
import GoalProgress from '@/components/dashboard/GoalProgress';
import TeamChart from '@/components/dashboard/TeamChart';
import ServiceLineChart from '@/components/dashboard/ServiceLineChart';
import ServiceLineComparison from '@/components/dashboard/ServiceLineComparison';
import RecentRatings from '@/components/dashboard/RecentRatings';
import GlobalSearch from '@/components/dashboard/GlobalSearch';
import { StatsCardSkeleton, LeaderboardSkeleton, ChartSkeleton, RecentRatingsSkeleton } from '@/components/ui/Skeleton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function PublicDashboard() {
  const { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, allRatings, hubTeamIds, endgameTeamIds, loading } = useDashboardStats();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calculate month-over-month change
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
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Star size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-tight">StarLedger</span>
            </div>
            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-3">
              <GlobalSearch />
              <Link href="/leaderboard" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 btn-press">
                <Trophy size={14} />
                Leaderboard
              </Link>
              <ThemeToggle />
              <Link href="/submit" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover border border-primary-light/20 transition-all duration-300 shadow-lg shadow-primary/25 btn-press">
                <Star size={14} fill="currentColor" />
                Submit Rating
              </Link>
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300 btn-press">
                <Shield size={14} />
                Admin
                <ArrowRight size={14} />
              </Link>
            </div>
            {/* Mobile nav toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary transition-all"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-white/[0.06] animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col gap-2">
              <div className="mb-2"><GlobalSearch /></div>
              <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all">
                <Trophy size={16} /> Leaderboard
              </Link>
              <Link href="/submit" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-all">
                <Star size={16} fill="currentColor" /> Submit Rating
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all">
                <Shield size={16} /> Admin Panel
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile floating FAB */}
      <Link
        href="/submit"
        className="fixed bottom-6 right-6 z-40 sm:hidden w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/30 btn-press animate-fade-in"
      >
        <Plus size={24} className="text-white" />
      </Link>

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
            </div>

            {/* NEW: Spotlight + Goal Progress Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SpotlightCard members={topMembers} allRatings={allRatings} />
              </div>
              <div className="lg:col-span-1">
                <GoalProgress allRatings={allRatings} monthlyGoal={30} />
              </div>
            </div>

            {/* UPDATED: Top 5 Leaderboard */}
            <LeaderboardCard topMembers={topMembers} topTeam={topTeams[0]} />

            {/* Team Performance — Full Width */}
            <TeamChart teams={topTeams} />

            {/* NEW: Hub vs Endgame Comparison + Service Lines Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-full">
                <ServiceLineComparison allRatings={allRatings} hubTeamIds={hubTeamIds} endgameTeamIds={endgameTeamIds} />
              </div>
              <div className="lg:col-span-1 h-full">
                <div className="h-full"><ServiceLineChart cmsHubRatings={cmsHubRatings} cmsEndgameRatings={cmsEndgameRatings} /></div>
              </div>
            </div>

            {/* Recent Ratings Carousel */}
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
