'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Member, MemberFormData } from '@/types/database';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*, team:teams(*)')
      .order('name', { ascending: true });
    if (!error && data) setMembers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const createMember = async (formData: MemberFormData) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.email) delete payload.email;
    if (!payload.profile_image) delete payload.profile_image;
    if (!payload.member_id) delete payload.member_id;
    const { error } = await supabase.from('members').insert(payload);
    if (!error) await fetchMembers();
    return { error: error?.message ?? null };
  };

  const updateMember = async (id: string, formData: MemberFormData) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.email) payload.email = null;
    if (!payload.profile_image) payload.profile_image = null;
    const { error } = await supabase.from('members').update(payload).eq('id', id);
    if (!error) await fetchMembers();
    return { error: error?.message ?? null };
  };

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) await fetchMembers();
    return { error: error?.message ?? null };
  };

  return { members, loading, fetchMembers, createMember, updateMember, deleteMember };
}
