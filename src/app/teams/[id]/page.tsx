'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, Users, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/lib/supabase';
import { toDriveDirectUrl } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Team, Member, Rating } from '@/types/database';

export default function TeamProfilePage() {
  const params = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: t } = await supabase
        .from('teams')
        .select('*')
        .eq('id', params.id)
        .single();
      if (t) setTeam(t);

      const { data: m } = await supabase
        .from('members')
        .select('*, team:teams(*)')
        .eq('team_id', params.id);
      if (m) setMembers(m);

      const { data: r } = await supabase
        .from('ratings')
        .select('*, member:members(*, team:teams(*)), team:teams(*)')
        .eq('team_id', params.id)
        .order('date_received', { ascending: false });
      if (r) setRatings(r);
      setLoading(false);
    }
    fetch();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Team Not Found</h1>
          <Link href="/" className="text-primary-light hover:underline text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Member breakdown chart
  const memberChartData = members.map(m => ({
    name: m.name.length > 12 ? m.name.substring(0, 12) + '…' : m.name,
    fullName: m.name,
    ratings: ratings.filter(r => r.member_id === m.id).length,
  })).sort((a, b) => b.ratings - a.ratings);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'rgba(11, 17, 32, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-[1000px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <Star size={16} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-lg text-text-primary tracking-tight">RatingHub</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 lg:px-10 py-10 relative z-10">
        {/* Team Header */}
        <div className="glass rounded-2xl p-8 mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shrink-0 ${team.service_line === 'CMS Hub' ? 'bg-gradient-to-br from-cms-hub to-emerald-400' : 'bg-gradient-to-br from-cms-endgame to-blue-400'}`}>
              <Users size={32} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-text-primary mb-2">{team.name}</h1>
              <Badge variant={team.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm">
                {team.service_line}
              </Badge>
            </div>
            <div className="flex gap-6 text-center shrink-0">
              <div>
                <div className="text-3xl font-extrabold text-primary-light">{ratings.length}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Ratings</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-secondary">{members.length}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Members</div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="glass rounded-2xl p-7 mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Users size={18} className="text-primary-light" />
            </div>
            Team Members ({members.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(m => {
              const memberRatingCount = ratings.filter(r => r.member_id === m.id).length;
              return (
                <Link
                  key={m.id}
                  href={`/members/${m.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold shrink-0 overflow-hidden">
                    {m.profile_image ? (
                      <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" />
                    ) : m.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate group-hover:text-primary-light transition-colors">{m.name}</div>
                    <div className="text-xs text-text-muted">{m.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-light">{memberRatingCount}</div>
                    <div className="text-[10px] text-text-muted">ratings</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Member Breakdown Chart */}
        {memberChartData.length > 0 && (
          <div className="glass rounded-2xl p-7 mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
                <BarChart3 size={18} className="text-warning" />
              </div>
              Ratings per Member
            </h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="glass-light rounded-xl px-4 py-3 shadow-2xl">
                            <p className="text-sm font-semibold text-text-primary">{d.fullName}</p>
                            <p className="text-base font-bold text-primary-light mt-0.5">{d.ratings} ratings</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="ratings" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    {memberChartData.map((_, i) => (
                      <Cell key={i} fill={team.service_line === 'CMS Hub' ? '#10b981' : '#3b82f6'} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Team Ratings */}
        <div className="glass rounded-2xl p-7 animate-fade-in">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
              <Star size={18} className="text-warning" />
            </div>
            Team Ratings ({ratings.length})
          </h3>
          {ratings.length > 0 ? (
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2">
              {ratings.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold text-sm shrink-0 overflow-hidden">
                    {r.member?.profile_image ? (
                      <img src={toDriveDirectUrl(r.member.profile_image)} alt={r.member?.name || ''} className="w-full h-full object-cover" />
                    ) : (r.member?.name?.charAt(0) || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{r.member?.name || 'Unknown'}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating_value }).map((_, j) => (
                          <Star key={j} size={11} className="text-warning" fill="#f59e0b" />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{r.client_name || 'No client'} {r.order_id && `· ${r.order_id}`}</div>
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar size={10} /> {new Date(r.date_received).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-8">No ratings yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
