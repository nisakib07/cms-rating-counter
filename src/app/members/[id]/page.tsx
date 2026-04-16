'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, Users, Calendar, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { toDriveDirectUrl, countFiveStarOrders } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { Member, Rating } from '@/types/database';

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: m } = await supabase
        .from('members')
        .select('*, team:teams(*)')
        .eq('id', params.id)
        .single();
      if (m) setMember(m);

      const { data: r } = await supabase
        .from('ratings')
        .select('*, team:teams(*)')
        .eq('member_id', params.id)
        .eq('status', 'approved')
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

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Member Not Found</h1>
          <Link href="/" className="text-primary-light hover:underline text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratings.length).toFixed(1) : '0';

  // Build mini-chart data (last 6 months)
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
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden shrink-0">
              {member.profile_image ? (
                <img src={toDriveDirectUrl(member.profile_image)} alt={member.name} className="w-full h-full object-cover" />
              ) : member.name.charAt(0)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-text-primary mb-1">{member.name}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                <Badge variant="neutral">{member.role}</Badge>
                <Badge variant={member.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} customColor={member.team?.color}>
                  {member.team?.name}
                </Badge>
              </div>
              {member.email && <p className="text-sm text-text-muted">{member.email}</p>}
            </div>
            <div className="flex gap-6 text-center shrink-0">
              <div>
                <div className="text-3xl font-extrabold text-primary-light">{countFiveStarOrders(ratings)}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Five Stars</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-warning">{avgRating}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider">Avg ⭐</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating History Chart */}
        <div className="glass rounded-2xl p-7 mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary-light" />
            </div>
            Rating History
            <span className="text-xs text-text-muted font-normal ml-auto">Last 6 months</span>
          </h3>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Area type="monotone" dataKey="ratings" stroke="#7c3aed" strokeWidth={2} fill="url(#memberGradient)" dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All Ratings */}
        <div className="glass rounded-2xl p-7 animate-fade-in">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
              <Star size={18} className="text-warning" />
            </div>
            All Ratings ({countFiveStarOrders(ratings)} five stars)
          </h3>
          {ratings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {ratings.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center gap-0.5">
                      <Star size={14} className="text-warning" fill="#f59e0b" />
                      <span className="text-xs text-warning font-semibold ml-1">{r.rating_value}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{r.client_name || 'No client name'}</div>
                    {r.review_text && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{r.review_text}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {r.order_id && <div className="text-xs text-text-muted font-mono">{r.order_id}</div>}
                    <div className="text-xs text-text-muted flex items-center gap-1 justify-end mt-0.5">
                      <Calendar size={10} /> {new Date(r.date_received).toLocaleDateString()}
                    </div>
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
