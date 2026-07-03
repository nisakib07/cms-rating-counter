'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TeamWithStats, MemberWithStats, Rating } from '@/types/database';
import { countFiveStarOrders, isActualTeam } from '@/lib/utils';

export function useDashboardStats() {
  const [totalRatings, setTotalRatings] = useState(0);
  const [cmsHubRatings, setCmsHubRatings] = useState(0);
  const [cmsEndgameRatings, setCmsEndgameRatings] = useState(0);
  const [topTeams, setTopTeams] = useState<TeamWithStats[]>([]);
  const [topMembers, setTopMembers] = useState<MemberWithStats[]>([]);
  const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
  const [allRatings, setAllRatings] = useState<Rating[]>([]);
  const [hubTeamIds, setHubTeamIds] = useState<string[]>([]);
  const [endgameTeamIds, setEndgameTeamIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    // Fetch all teams with their ratings count
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: members } = await supabase.from('members').select('*, team:teams(*)');
    const { data: ratings } = await supabase
      .from('ratings')
      .select('*, member:members(*, team:teams(*)), team:teams(*)')
      .eq('status', 'approved')
      .order('date_received', { ascending: false });

    if (teams && members && ratings) {
      setTotalRatings(countFiveStarOrders(ratings));

      // Service line counts
      const hIds = teams.filter(t => t.service_line === 'CMS Hub').map(t => t.id);
      const eIds = teams.filter(t => t.service_line === 'CMS Endgame').map(t => t.id);
      setHubTeamIds(hIds);
      setEndgameTeamIds(eIds);
      setCmsHubRatings(countFiveStarOrders(ratings.filter(r => hIds.includes(r.team_id))));
      setCmsEndgameRatings(countFiveStarOrders(ratings.filter(r => eIds.includes(r.team_id))));

      // Team stats
      const teamStats: TeamWithStats[] = teams
        .filter(t => isActualTeam(t))
        .map(t => ({
          ...t,
          member_count: members.filter(m => m.team_id === t.id && m.is_active !== false).length,
          rating_count: countFiveStarOrders(ratings.filter(r => r.team_id === t.id)),
        })).sort((a, b) => b.rating_count - a.rating_count);
      setTopTeams(teamStats);

      // Member stats (only active members in leaderboard)
      const activeMembers = members.filter(m => m.is_active !== false);
      const memberStats: MemberWithStats[] = activeMembers.map(m => {
        const memberRatings = ratings.filter(r => r.member_id === m.id);
        const totalCount = countFiveStarOrders(memberRatings);
        const currentTeamCount = countFiveStarOrders(memberRatings.filter(r => r.team_id === m.team_id));

        // Build per-team breakdown
        const teamMap = new Map<string, { team_name: string; service_line: string; team_color?: string; ratings: typeof memberRatings }>();
        for (const r of memberRatings) {
          if (!teamMap.has(r.team_id)) {
            const rTeam = teams.find(t => t.id === r.team_id);
            teamMap.set(r.team_id, {
              team_name: rTeam?.name || 'Unknown',
              service_line: rTeam?.service_line || '',
              team_color: rTeam?.color,
              ratings: [],
            });
          }
          teamMap.get(r.team_id)!.ratings.push(r);
        }
        const team_breakdown = Array.from(teamMap.entries()).map(([team_id, info]) => ({
          team_id,
          team_name: info.team_name,
          service_line: info.service_line,
          team_color: info.team_color,
          count: countFiveStarOrders(info.ratings),
        })).filter(b => b.count > 0).sort((a, b) => b.count - a.count);

        return {
          ...m,
          rating_count: totalCount,
          current_team_count: currentTeamCount,
          team_breakdown,
        };
      }).sort((a, b) => b.rating_count - a.rating_count);
      setTopMembers(memberStats);

      // Recent ratings
      setRecentRatings(ratings.slice(0, 10));
      setAllRatings(ratings);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { totalRatings, cmsHubRatings, cmsEndgameRatings, topTeams, topMembers, recentRatings, allRatings, hubTeamIds, endgameTeamIds, loading, fetchStats };
}
