'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getNickname } from '@/lib/utils';

interface PendingItem {
  id: string;
  member_name: string;
  order_id: string | null;
  date_received: string;
  rating_value: number;
}

export default function NotificationBell() {
  const { isAdmin } = useAuth();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchPending() {
      const { data } = await supabase
        .from('ratings')
        .select('id, rating_value, order_id, date_received, member:members(name)')
        .eq('status', 'pending')
        .order('date_received', { ascending: false })
        .limit(10);
      if (data) {
        setPending(data.map((r: any) => ({
          id: r.id,
          member_name: r.member?.name || 'Unknown',
          order_id: r.order_id,
          date_received: r.date_received,
          rating_value: r.rating_value,
        })));
      }
    }
    fetchPending();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Update document title with pending count
  useEffect(() => {
    if (pending.length > 0) {
      document.title = `(${pending.length}) StarLedger - Team Performance Tracker`;
    } else {
      document.title = 'StarLedger - Team Performance Tracker';
    }
  }, [pending.length]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAdmin) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.08] transition-all cursor-pointer"
      >
        <Bell size={16} />
        {pending.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {pending.length > 9 ? '9+' : pending.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 w-80 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50"
          style={{ background: 'var(--search-dropdown-bg)', backdropFilter: 'blur(20px)' }}
        >
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Pending Approvals</span>
            {pending.length > 0 && (
              <span className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </div>

          {pending.length > 0 ? (
            <div className="max-h-72 overflow-y-auto">
              {pending.map(p => (
                <Link
                  key={p.id}
                  href="/admin/approvals"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.02] last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
                    <Star size={14} className="text-warning" fill="#f59e0b" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      <span className="font-medium">{getNickname(p.member_name)}</span>
                      {p.order_id && <span className="text-text-muted"> · #{p.order_id.slice(-6)}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                      <Clock size={9} />
                      {new Date(p.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span>· ⭐ {p.rating_value}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-muted shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              ✅ All caught up! No pending approvals.
            </div>
          )}

          {pending.length > 0 && (
            <Link
              href="/admin/approvals"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-medium text-primary-light hover:bg-primary/5 transition-colors border-t border-white/[0.06]"
            >
              View all pending approvals →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
