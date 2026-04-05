'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Star, ArrowLeft, Trophy, ArrowUpDown, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toDriveDirectUrl } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { Select } from '@/components/ui/Input';
import type { Member, Team, Rating } from '@/types/database';

type SortKey = 'rating_count' | 'name';

export default function LeaderboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rating_count');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetch() {
      const [{ data: m }, { data: t }, { data: r }] = await Promise.all([
        supabase.from('members').select('*, team:teams(*)'),
        supabase.from('teams').select('*'),
        supabase.from('ratings').select('*').eq('status', 'approved'),
      ]);
      if (m) setMembers(m);
      if (t) setTeams(t);
      if (r) setRatings(r);
      setLoading(false);
    }
    fetch();
  }, []);

  const leaderboard = useMemo(() => {
    let list = members.map(m => ({
      ...m,
      rating_count: ratings.filter(r => r.member_id === m.id).length,
    }));

    // Filters
    if (filterTeam) list = list.filter(m => m.team_id === filterTeam);
    if (filterLine) list = list.filter(m => m.team?.service_line === filterLine);

    // Sort
    list.sort((a, b) => {
      if (sortKey === 'rating_count') return sortAsc ? a.rating_count - b.rating_count : b.rating_count - a.rating_count;
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    return list;
  }, [members, ratings, filterTeam, filterLine, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const teamOptions = teams.map(t => ({ value: t.id, label: `${t.name} (${t.service_line})` }));

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-sm font-bold text-text-muted">{rank}</span>;
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-warning/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ background: 'rgba(11, 17, 32, 0.8)', backdropFilter: 'blur(20px)' }}>
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
        {/* Title */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-warning/10 border border-warning/15 text-warning text-xs font-semibold tracking-wide mb-4">
            <Trophy size={12} /> FULL RANKINGS
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-text-secondary text-base">All members ranked by their 5-star ratings</p>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3 animate-fade-in">
          <Select value={filterLine} onChange={setFilterLine} placeholder="All Service Lines" options={[{ value: 'CMS Hub', label: 'CMS Hub' }, { value: 'CMS Endgame', label: 'CMS Endgame' }]} />
          <Select value={filterTeam} onChange={setFilterTeam} placeholder="All Teams" options={teamOptions} />
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted">Sort:</span>
            <button
              onClick={() => toggleSort('rating_count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${sortKey === 'rating_count' ? 'bg-primary/15 text-primary-light border border-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-glass-light'}`}
            >
              Ratings {sortKey === 'rating_count' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${sortKey === 'name' ? 'bg-primary/15 text-primary-light border border-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-glass-light'}`}
            >
              Name {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {leaderboard.map((m, i) => (
              <Link
                key={m.id}
                href={`/members/${m.id}`}
                className="glass rounded-xl p-4 sm:p-5 flex items-center gap-4 hover:bg-glass-light transition-all group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="w-10 flex items-center justify-center shrink-0">
                  {getRankBadge(i + 1)}
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold shrink-0 overflow-hidden border border-primary/10">
                  {m.profile_image ? (
                    <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" />
                  ) : m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-semibold text-text-primary truncate group-hover:text-primary-light transition-colors">{m.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={m.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={m.team?.color}>{m.team?.name}</Badge>
                    <span className="text-xs text-text-muted">{m.role}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <AnimatedCounter value={m.rating_count} className="text-2xl sm:text-3xl font-extrabold text-primary-light tabular-nums" />
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">ratings</div>
                </div>
              </Link>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-16 text-text-muted">
                <Users size={40} className="mx-auto mb-3 text-text-muted/30" />
                <p className="text-sm">No members found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
