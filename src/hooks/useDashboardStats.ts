'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TeamWithStats, MemberWithStats, Rating } from '@/types/database';

export function useDashboardStats() {
  const [totalRatings, setTotalRatings] = useState(0);
  const [cmsHubRatings, setCmsHubRatings] = useState(0);
  const [cmsEndgameRatings, setCmsEndgameRatings] = useState(0);
  const [topTeams, setTopTeams] = useState<TeamWithStats[]>([]);
  const [topMembers, setTopMembers] = useState<MemberWithStats[]>([]);
  const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    // Fetch all teams with their ratings count
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: members } = await supabase.from('members').select('*, team:teams(*)');
    const { data: ratings } = await supabase
      .from('ratings')
      .select('*, member:members(*, team:teams(*)), team:teams(*)')
      .order('date_received', { ascending: false });

    if (teams && members && ratings) {
      setTotalRatings(ratings.length);

      // Service line counts
      const hubTeamIds = teams.filter(t => t.service_line === 'CMS Hub').map(t => t.id);
      const endgameTeamIds = teams.filter(t => t.service_line === 'CMS Endgame').map(t => t.id);
      setCmsHubRatings(ratings.filter(r => hubTeamIds.includes(r.team_id)).length);
      setCmsEndgameRatings(ratings.filter(r => endgameTeamIds.includes(r.team_id)).length);

      // Team stats
      const teamStats: TeamWithStats[] = teams.map(t => ({
        ...t,
        member_count: members.filter(m => m.team_id === t.id).length,
        rating_count: ratings.filter(r => r.team_id === t.id).length,
      })).sort((a, b) => b.rating_count - a.rating_count);
      setTopTeams(teamStats);

      // Member stats
      const memberStats: MemberWithStats[] = members.map(m => ({
        ...m,
        rating_count: ratings.filter(r => r.member_id === m.id).length,
      })).sort((a, b) => b.rating_count - a.rating_count);
      setTopMembers(memberStats);

      // Recent ratings
      setRecentRatings(ratings.slice(0, 10));
      setAllRatings(ratings);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, allRatings, loading, fetchStats };
}
