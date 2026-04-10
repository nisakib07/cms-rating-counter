'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Users, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toDriveDirectUrl, isActualTeam } from '@/lib/utils';
import type { Member, Team } from '@/types/database';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load data once
  useEffect(() => {
    async function fetch() {
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.from('members').select('*, team:teams(*)'),
        supabase.from('teams').select('*'),
      ]);
      if (m) setMembers(m);
      if (t) setTeams(t);
    }
    fetch();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.toLowerCase().trim();
  const filteredMembers = q ? members.filter(m => m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)).slice(0, 5) : [];
  const filteredTeams = q ? teams.filter(t => isActualTeam(t) && t.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const hasResults = filteredMembers.length > 0 || filteredTeams.length > 0;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search members & teams..."
          className="w-44 sm:w-56 pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
        />
      </div>

      {/* Dropdown */}
      {open && q && (
        <div className="absolute top-full mt-2 left-0 right-0 sm:w-80 rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden z-50" style={{ background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)' }}>
          {hasResults ? (
            <div className="max-h-80 overflow-y-auto">
              {filteredMembers.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-white/[0.04]">Members</div>
                  {filteredMembers.map(m => (
                    <Link
                      key={m.id}
                      href={`/members/${m.id}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold text-xs overflow-hidden shrink-0">
                        {m.profile_image ? (
                          <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" />
                        ) : m.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{m.name}</div>
                        <div className="text-xs text-text-muted">{m.team?.name} · {m.role}</div>
                      </div>
                      <UserCircle size={14} className="text-text-muted shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
              {filteredTeams.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-white/[0.04]">Teams</div>
                  {filteredTeams.map(t => (
                    <Link
                      key={t.id}
                      href={`/teams/${t.id}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.service_line === 'CMS Hub' ? 'bg-cms-hub/15' : 'bg-cms-endgame/15'}`}>
                        <Users size={14} className={t.service_line === 'CMS Hub' ? 'text-cms-hub' : 'text-cms-endgame'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">{t.name}</div>
                        <div className="text-xs text-text-muted">{t.service_line}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-text-muted">No results for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
