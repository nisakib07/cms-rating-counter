'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Star, ArrowLeft, Swords, TrendingUp, Users, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { supabase } from '@/lib/supabase';
import { countFiveStarOrders, isActualTeam } from '@/lib/utils';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import type { Team, Rating, Member } from '@/types/database';

export default function ComparePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  useEffect(() => {
    async function fetch() {
      const [{ data: t }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('ratings').select('*').eq('status', 'approved'),
        supabase.from('members').select('*, team:teams(*)'),
      ]);
      if (t) setTeams(t.filter(isActualTeam));
      if (r) setRatings(r);
      if (m) setMembers(m);
      setLoading(false);
    }
    fetch();
  }, []);

  const teamOptions = teams.map(t => ({ value: t.id, label: `${t.name} (${t.service_line})` }));

  const comparison = useMemo(() => {
    if (!teamA || !teamB) return null;

    const tA = teams.find(t => t.id === teamA);
    const tB = teams.find(t => t.id === teamB);
    if (!tA || !tB) return null;

    const ratingsA = ratings.filter(r => r.team_id === teamA);
    const ratingsB = ratings.filter(r => r.team_id === teamB);

    const fiveStarA = countFiveStarOrders(ratingsA);
    const fiveStarB = countFiveStarOrders(ratingsB);

    const membersA = members.filter(m => m.team_id === teamA).length;
    const membersB = members.filter(m => m.team_id === teamB).length;

    const avgA = ratingsA.length > 0 ? (ratingsA.reduce((s, r) => s + r.rating_value, 0) / ratingsA.length) : 0;
    const avgB = ratingsB.length > 0 ? (ratingsB.reduce((s, r) => s + r.rating_value, 0) / ratingsB.length) : 0;

    const perMemberA = membersA > 0 ? (fiveStarA / membersA).toFixed(1) : '0';
    const perMemberB = membersB > 0 ? (fiveStarB / membersB).toFixed(1) : '0';

    // Monthly trend (last 6 months)
    const now = new Date();
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const monthA = countFiveStarOrders(ratingsA.filter(r => r.date_received.startsWith(key)));
      const monthB = countFiveStarOrders(ratingsB.filter(r => r.date_received.startsWith(key)));
      trendData.push({ name: label, [tA.name]: monthA, [tB.name]: monthB });
    }

    return { tA, tB, fiveStarA, fiveStarB, membersA, membersB, avgA, avgB, perMemberA, perMemberB, trendData };
  }, [teamA, teamB, teams, ratings, members]);

  const getWinner = (a: number, b: number) => {
    if (a > b) return 'A';
    if (b > a) return 'B';
    return 'tie';
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cms-endgame/[0.04] rounded-full blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Star size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-tight">StarLedger</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 lg:px-10 py-10 relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-400 text-xs font-semibold tracking-wide mb-4">
            <Swords size={12} /> HEAD TO HEAD
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="gradient-text">Team Battle</span>
          </h1>
          <p className="text-text-secondary text-base">Compare two teams side by side</p>
        </div>

        {/* Team selectors */}
        <div className="glass rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
          <div className="flex-1 w-full">
            <Select value={teamA} onChange={setTeamA} placeholder="Select Team A" options={teamOptions.filter(o => o.value !== teamB)} />
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-violet-500/25">
            VS
          </div>
          <div className="flex-1 w-full">
            <Select value={teamB} onChange={setTeamB} placeholder="Select Team B" options={teamOptions.filter(o => o.value !== teamA)} />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && !comparison && (
          <div className="text-center py-20 text-text-muted animate-fade-in">
            <Swords size={48} className="mx-auto mb-4 text-text-muted/20" />
            <p className="text-lg font-medium">Select two teams to compare</p>
            <p className="text-sm text-text-muted/60 mt-1">See who&apos;s leading the race</p>
          </div>
        )}

        {comparison && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Stats comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: '5★ Ratings', valA: comparison.fiveStarA, valB: comparison.fiveStarB },
                { label: 'Members', valA: comparison.membersA, valB: comparison.membersB },
                { label: 'Per Member', valA: parseFloat(comparison.perMemberA), valB: parseFloat(comparison.perMemberB) },
              ].map(stat => {
                const w = getWinner(stat.valA, stat.valB);
                return (
                  <div key={stat.label} className="glass rounded-xl p-5">
                    <div className="text-xs text-text-muted uppercase tracking-wider text-center mb-4">{stat.label}</div>
                    <div className="flex items-center justify-between">
                      <div className={`text-center flex-1 ${w === 'A' ? '' : 'opacity-60'}`}>
                        <div className={`text-3xl font-extrabold ${w === 'A' ? 'text-emerald-400' : 'text-text-primary'}`}>
                          {stat.valA}
                        </div>
                        {w === 'A' && <Trophy size={14} className="text-warning mx-auto mt-1" />}
                      </div>
                      <div className="text-text-muted/30 text-xs font-bold">VS</div>
                      <div className={`text-center flex-1 ${w === 'B' ? '' : 'opacity-60'}`}>
                        <div className={`text-3xl font-extrabold ${w === 'B' ? 'text-emerald-400' : 'text-text-primary'}`}>
                          {stat.valB}
                        </div>
                        {w === 'B' && <Trophy size={14} className="text-warning mx-auto mt-1" />}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
                      <Badge variant={comparison.tA.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={comparison.tA.color}>{comparison.tA.name}</Badge>
                      <Badge variant={comparison.tB.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={comparison.tB.color}>{comparison.tB.name}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trend chart */}
            <div className="glass rounded-2xl p-7">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <TrendingUp size={18} className="text-violet-400" />
                </div>
                Monthly 5★ Trend
                <span className="text-xs text-text-muted font-normal ml-auto">Last 6 months</span>
              </h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparison.trendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey={comparison.tA.name} stroke={comparison.tA.color || '#10b981'} strokeWidth={2.5} dot={{ fill: comparison.tA.color || '#10b981', r: 4 }} />
                    <Line type="monotone" dataKey={comparison.tB.name} stroke={comparison.tB.color || '#6366f1'} strokeWidth={2.5} dot={{ fill: comparison.tB.color || '#6366f1', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
