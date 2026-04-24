'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, Calendar, TrendingUp, Globe, Users, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { countFiveStarOrders } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import type { Rating } from '@/types/database';

export default function ProfileDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const profileName = decodeURIComponent(params.name as string);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('ratings')
        .select('*, member:members(*, team:teams(*)), team:teams(*)')
        .ilike('profile_name', profileName)
        .eq('status', 'approved')
        .order('date_received', { ascending: false });
      if (data) setRatings(data);
      setLoading(false);
    }
    fetch();
  }, [profileName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Globe size={28} className="text-primary-light" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Profile: {profileName}</h1>
          <p className="text-text-muted mb-4">No ratings found for this profile yet.</p>
          <Link href="/admin/profiles" className="text-primary-light hover:underline text-sm">← Back to Profiles</Link>
        </div>
      </div>
    );
  }

  const fiveStarCount = countFiveStarOrders(ratings);
  const avgRating = (ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratings.length).toFixed(1);

  // Unique members who contributed
  const uniqueMembers = new Map<string, { name: string; count: number; teamName?: string; teamServiceLine?: string }>();
  ratings.forEach(r => {
    if (!r.member) return;
    const existing = uniqueMembers.get(r.member_id);
    if (existing) {
      existing.count++;
    } else {
      uniqueMembers.set(r.member_id, {
        name: r.member.name,
        count: 1,
        teamName: r.team?.name,
        teamServiceLine: r.team?.service_line,
      });
    }
  });
  const membersList = Array.from(uniqueMembers.values()).sort((a, b) => b.count - a.count);

  // Unique teams
  const uniqueTeams = new Map<string, { name: string; serviceLine: string; count: number }>();
  ratings.forEach(r => {
    if (!r.team) return;
    const existing = uniqueTeams.get(r.team_id);
    if (existing) {
      existing.count++;
    } else {
      uniqueTeams.set(r.team_id, { name: r.team.name, serviceLine: r.team.service_line, count: 1 });
    }
  });
  const teamsList = Array.from(uniqueTeams.values()).sort((a, b) => b.count - a.count);

  // Build chart data (last 6 months)
  const chartMonths: { label: string; key: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    chartMonths.push({ label, key, count: 0 });
  }
  ratings.forEach(r => {
    const d = new Date(r.date_received);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const m = chartMonths.find(cm => cm.key === key);
    if (m) m.count++;
  });
  const chartData = chartMonths.map(m => ({ name: m.label, ratings: m.count }));

  // This month stats
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthRatings = ratings.filter(r => r.date_received.startsWith(thisMonthKey));
  const thisMonthCount = countFiveStarOrders(thisMonthRatings);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Star size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-tight">StarLedger</span>
            </Link>
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 lg:px-10 py-10 relative z-10">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-3xl shadow-xl shrink-0">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-text-primary mb-1 font-mono">{profileName}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <Badge variant="neutral">Fiverr Profile</Badge>
                {teamsList.map(t => (
                  <Badge key={t.name} variant={t.serviceLine === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'}>
                    {t.name}
                  </Badge>
                ))}
              </div>
              <a
                href={`https://www.fiverr.com/${profileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-light hover:underline"
              >
                View on Fiverr <ExternalLink size={12} />
              </a>
            </div>
            <div className="flex gap-6 text-center shrink-0">
              <div>
                <div className="text-3xl font-extrabold text-warning">{fiveStarCount}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">5★ Ratings</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-primary-light">{avgRating}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Avg Rating</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-emerald-400">{thisMonthCount}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1">This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-light" /> Rating Trend
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(15,18,25,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    itemStyle={{ color: '#a78bfa' }}
                  />
                  <Area type="monotone" dataKey="ratings" stroke="var(--color-primary)" strokeWidth={2} fill="url(#profileGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-secondary" /> Summary
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-xs text-text-muted">Total Ratings</span>
                <span className="text-sm font-bold text-text-primary">{ratings.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-xs text-text-muted">5★ Orders</span>
                <span className="text-sm font-bold text-warning">{fiveStarCount}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-xs text-text-muted">Avg Rating</span>
                <StarRating rating={parseFloat(avgRating)} size={12} showText />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-xs text-text-muted">Members</span>
                <span className="text-sm font-bold text-text-primary">{uniqueMembers.size}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-xs text-text-muted">Teams</span>
                <span className="text-sm font-bold text-text-primary">{uniqueTeams.size}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-text-muted">First Rating</span>
                <span className="text-xs text-text-secondary">{new Date(ratings[ratings.length - 1]?.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Members who contributed */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users size={16} className="text-emerald-400" /> Contributing Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {membersList.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl bg-glass hover:bg-glass-light transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-warning/20 text-warning' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-primary/20 text-primary-light'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{m.name}</div>
                  <div className="text-xs text-text-muted">{m.teamName}</div>
                </div>
                <span className="text-sm font-bold text-primary-light">{m.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ratings */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Star size={16} className="text-warning" /> Recent Ratings
          </h3>
          <div className="flex flex-col gap-2">
            {ratings.slice(0, 15).map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-glass">
                <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                  <Star size={14} className="text-warning" fill="#f59e0b" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">{r.member?.name || 'Unknown'}</span>
                    <StarRating rating={r.rating_value} size={10} />
                  </div>
                  <p className="text-xs text-text-muted truncate">{r.client_name || 'Client'} — {r.review_text?.slice(0, 60) || 'No review'}{(r.review_text?.length || 0) > 60 ? '...' : ''}</p>
                </div>
                <span className="text-[10px] text-text-muted shrink-0">{new Date(r.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
