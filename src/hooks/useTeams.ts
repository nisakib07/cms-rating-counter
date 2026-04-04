'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Team, TeamFormData } from '@/types/database';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('service_line', { ascending: true })
      .order('name', { ascending: true });
    if (!error && data) setTeams(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const createTeam = async (formData: TeamFormData) => {
    const { error } = await supabase.from('teams').insert(formData);
    if (!error) await fetchTeams();
    return { error: error?.message ?? null };
  };

  const updateTeam = async (id: string, formData: TeamFormData) => {
    const { error } = await supabase.from('teams').update(formData).eq('id', id);
    if (!error) await fetchTeams();
    return { error: error?.message ?? null };
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (!error) await fetchTeams();
    return { error: error?.message ?? null };
  };

  return { teams, loading, fetchTeams, createTeam, updateTeam, deleteTeam };
}
