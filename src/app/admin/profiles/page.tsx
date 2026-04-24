'use client';

import { useState, useEffect, useMemo } from 'react';
import { Globe, Star, TrendingUp, Search, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { countFiveStarOrders } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import type { Rating } from '@/types/database';
import { useFiverrProfiles } from '@/hooks/useFiverrProfiles';

interface ProfileStat {
  name: string;
  totalRatings: number;
  fiveStarCount: number;
  avgRating: number;
  lastRatingDate: string;
}

export default function ProfilesPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'fiveStarCount' | 'totalRatings' | 'avgRating'>('fiveStarCount');
  const { profiles: registeredProfiles, loading: profilesLoading } = useFiverrProfiles();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('status', 'approved');
      if (data) setRatings(data);
      setLoading(false);
    }
    fetch();
  }, []);

  const profileStats = useMemo(() => {
    // Build rating map from actual data
    const map = new Map<string, Rating[]>();
    ratings.forEach(r => {
      if (!r.profile_name) return;
      const key = r.profile_name.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    // Include all registered profiles (even those with 0 ratings)
    registeredProfiles.forEach(p => {
      const key = p.toLowerCase();
      if (!map.has(key)) map.set(key, []);
    });

    const stats: ProfileStat[] = [];
    map.forEach((profileRatings, name) => {
      if (profileRatings.length === 0) {
        stats.push({ name, totalRatings: 0, fiveStarCount: 0, avgRating: 0, lastRatingDate: '' });
        return;
      }
      const fiveStarCount = countFiveStarOrders(profileRatings);
      const avg = profileRatings.reduce((s, r) => s + r.rating_value, 0) / profileRatings.length;
      const lastDate = profileRatings.sort((a, b) => b.date_received.localeCompare(a.date_received))[0]?.date_received || '';
      stats.push({
        name,
        totalRatings: profileRatings.length,
        fiveStarCount,
        avgRating: Math.round(avg * 10) / 10,
        lastRatingDate: lastDate,
      });
    });

    // Sort
    stats.sort((a, b) => b[sortBy] - a[sortBy]);

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return stats.filter(s => s.name.includes(q));
    }
    return stats;
  }, [ratings, registeredProfiles, sortBy, search]);

  const totalProfiles = profileStats.length;
  const activeProfiles = profileStats.filter(p => p.totalRatings > 0).length;
  const totalFiveStars = profileStats.reduce((s, p) => s + p.fiveStarCount, 0);
  const topProfile = profileStats.find(p => p.fiveStarCount > 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Globe size={24} className="text-primary-light" />
            Fiverr Profiles
          </h1>
          <p className="text-sm text-text-muted mt-1">Performance analytics by Fiverr profile</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-primary-light">{totalProfiles}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Total Profiles</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-emerald-400">{activeProfiles}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Active Profiles</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-warning">{totalFiveStars}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Total 5★ Ratings</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-extrabold text-secondary truncate">{topProfile?.name || '—'}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Top Profile</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search profiles..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-muted">Sort:</span>
          {([
            { key: 'fiveStarCount', label: '5★ Count' },
            { key: 'totalRatings', label: 'Total' },
            { key: 'avgRating', label: 'Avg Rating' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${sortBy === opt.key ? 'bg-primary/15 text-primary-light border border-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-glass-light'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading || profilesLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : profileStats.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Globe size={40} className="mx-auto mb-3 text-text-muted/20" />
          <p>No profile data found</p>
          <p className="text-xs text-text-muted/60 mt-1">Ratings need a Fiverr Profile assigned</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Profile</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">5★ Ratings</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Avg Rating</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Last Rating</th>
                </tr>
              </thead>
              <tbody>
                {profileStats.map((p, i) => (
                  <tr key={p.name} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className={`text-sm font-bold ${i === 0 ? 'text-warning' : i === 1 ? 'text-text-muted' : i === 2 ? 'text-amber-700' : 'text-text-muted'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary-light font-bold text-xs">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/profiles/${encodeURIComponent(p.name)}`}
                            className="text-sm font-semibold text-text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                          >
                            {p.name}
                            <ArrowUpRight size={10} className="text-text-muted" />
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-warning">{p.fiveStarCount}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-text-secondary">{p.totalRatings}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StarRating rating={p.avgRating} size={12} showText />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-text-muted">
                        {p.lastRatingDate
                          ? new Date(p.lastRatingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
