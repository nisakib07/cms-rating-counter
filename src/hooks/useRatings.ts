'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rating, RatingFormData } from '@/types/database';

export function useRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [pendingRatings, setPendingRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    const { data: allData, error: err } = await supabase
      .from('ratings')
      .select('*, member:members(*, team:teams(*)), team:teams(*)')
      .order('date_received', { ascending: false });
    if (!err && allData) {
      setRatings(allData.filter(r => r.status === 'approved'));
      setPendingRatings(allData.filter(r => r.status === 'pending'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const createRating = async (formData: RatingFormData) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.order_id) delete payload.order_id;
    if (!payload.client_name) delete payload.client_name;
    if (!payload.review_text) delete payload.review_text;
    if (!payload.screenshot_url) delete payload.screenshot_url;
    if (!payload.status) payload.status = 'approved';
    const { error } = await supabase.from('ratings').insert(payload);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const updateRating = async (id: string, formData: RatingFormData) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.order_id) payload.order_id = null;
    if (!payload.client_name) payload.client_name = null;
    if (!payload.review_text) payload.review_text = null;
    if (!payload.screenshot_url) payload.screenshot_url = null;
    const { error } = await supabase.from('ratings').update(payload).eq('id', id);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const updateRatingStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('ratings').update({ status }).eq('id', id);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const deleteRating = async (id: string) => {
    const { error } = await supabase.from('ratings').delete().eq('id', id);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  return { ratings, pendingRatings, loading, fetchRatings, createRating, updateRating, updateRatingStatus, deleteRating };
}
