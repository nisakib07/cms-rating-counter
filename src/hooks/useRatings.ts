'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rating, RatingFormData } from '@/types/database';

export function useRatings() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ratings')
      .select('*, member:members(*, team:teams(*)), team:teams(*)')
      .order('date_received', { ascending: false });
    if (!error && data) setRatings(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const createRating = async (formData: RatingFormData) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.order_id) delete payload.order_id;
    if (!payload.client_name) delete payload.client_name;
    if (!payload.review_text) delete payload.review_text;
    if (!payload.screenshot_url) delete payload.screenshot_url;
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

  const deleteRating = async (id: string) => {
    const { error } = await supabase.from('ratings').delete().eq('id', id);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  return { ratings, loading, fetchRatings, createRating, updateRating, deleteRating };
}
