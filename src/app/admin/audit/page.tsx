'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, Search, Filter, User, ChevronDown, ChevronUp, ArrowLeft, Star, Shield } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/ui/Badge';
import type { RatingAuditLog, Member } from '@/types/database';

interface AuditEntry extends RatingAuditLog {
  rating?: {
    order_id: string | null;
    member?: { name: string } | null;
  } | null;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetch() {
      const [{ data: auditData }, { data: memberData }] = await Promise.all([
        supabase
          .from('rating_audit_log')
          .select('*, rating:ratings(order_id, member:members(name))')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('members').select('id, name, email'),
      ]);
      if (auditData) setEntries(auditData as AuditEntry[]);
      if (memberData) setMembers(memberData as Member[]);
      setLoading(false);
    }
    fetch();
  }, []);

  // Lookup maps: email → name, id → name
  const emailToName = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach(m => { if (m.email) map.set(m.email.toLowerCase(), m.name); });
    return map;
  }, [members]);

  const idToName = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach(m => map.set(m.id, m.name));
    return map;
  }, [members]);

  // Resolve email to name, fallback to email
  const resolveUser = (email: string) => emailToName.get(email.toLowerCase()) || email;

  // Resolve a diff value — if field is member_id, show name instead of UUID
  const resolveDiffValue = (field: string, value: unknown): string => {
    const str = String(value || '—');
    if (field === 'member_id' && str !== '—') {
      return idToName.get(str) || str;
    }
    return str;
  };

  const filtered = useMemo(() => {
    let result = entries;
    if (filterAction) result = result.filter(e => e.action === filterAction);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.changed_by.toLowerCase().includes(q) ||
        e.rating?.member?.name?.toLowerCase().includes(q) ||
        e.rating?.order_id?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, filterAction, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-emerald-400 bg-emerald-400/10';
      case 'edited': return 'text-blue-400 bg-blue-400/10';
      case 'approved': return 'text-green-400 bg-green-400/10';
      case 'rejected': return 'text-red-400 bg-red-400/10';
      default: return 'text-text-muted bg-white/[0.04]';
    }
  };

  const actions = ['created', 'edited', 'approved', 'rejected'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText size={24} className="text-primary-light" />
            Audit Log
          </h1>
          <p className="text-sm text-text-muted mt-1">Complete history of all rating actions</p>
        </div>
        <span className="text-xs text-text-muted">{filtered.length} entries</span>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user, member, or order ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-text-muted" />
          <button
            onClick={() => setFilterAction('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${!filterAction ? 'bg-primary/15 text-primary-light border border-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-glass-light'}`}
          >
            All
          </button>
          {actions.map(a => (
            <button
              key={a}
              onClick={() => setFilterAction(filterAction === a ? '' : a)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${filterAction === a ? 'bg-primary/15 text-primary-light border border-primary/20' : 'text-text-muted hover:text-text-primary hover:bg-glass-light'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 text-text-muted/20" />
          <p>No audit entries found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(entry => (
            <div key={entry.id} className="glass rounded-xl p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getActionColor(entry.action)}`}>
                  {entry.action}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">
                    <span className="font-medium">{resolveUser(entry.changed_by)}</span>
                    {entry.rating?.member?.name && (
                      <span className="text-text-muted"> → {entry.rating.member.name}</span>
                    )}
                    {entry.rating?.order_id && (
                      <span className="text-text-muted font-mono text-xs"> #{entry.rating.order_id}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {entry.changes && (
                    <button
                      onClick={() => toggleExpand(entry.id)}
                      className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-muted hover:text-text-primary transition-all cursor-pointer"
                    >
                      {expanded.has(entry.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded changes */}
              {expanded.has(entry.id) && entry.changes && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(entry.changes as Record<string, { old: unknown; new: unknown }>).map(([field, diff]) => (
                      <div key={field} className="text-xs flex items-start gap-2">
                        <span className="text-text-muted font-mono min-w-[100px] shrink-0">{field}</span>
                        <span className="text-red-400/70 line-through">{resolveDiffValue(field, diff.old)}</span>
                        <span className="text-text-muted">→</span>
                        <span className="text-emerald-400">{resolveDiffValue(field, diff.new)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
