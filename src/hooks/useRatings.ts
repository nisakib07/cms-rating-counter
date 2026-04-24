'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rating, RatingFormData, RatingAuditLog } from '@/types/database';

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

  // Helper to insert an audit log entry
  const insertAuditLog = async (ratingId: string, action: string, changedBy: string, changes?: Record<string, { old: unknown; new: unknown }>) => {
    await supabase.from('rating_audit_log').insert({
      rating_id: ratingId,
      action,
      changed_by: changedBy,
      changes: changes || null,
    });
  };

  const createRating = async (formData: RatingFormData, userEmail?: string) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.order_id) delete payload.order_id;
    if (!payload.client_name) delete payload.client_name;
    if (!payload.review_text) delete payload.review_text;
    if (!payload.screenshot_url) delete payload.screenshot_url;
    if (!payload.profile_name) delete payload.profile_name;
    if (!payload.status) payload.status = 'approved';
    const { data, error } = await supabase.from('ratings').insert(payload).select('id').single();
    if (!error && data && userEmail) {
      await insertAuditLog(data.id, 'created', userEmail);
    }
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const updateRating = async (id: string, formData: RatingFormData, userEmail?: string, oldRating?: Rating) => {
    const payload: Record<string, unknown> = { ...formData };
    if (!payload.order_id) payload.order_id = null;
    if (!payload.client_name) payload.client_name = null;
    if (!payload.review_text) payload.review_text = null;
    if (!payload.screenshot_url) payload.screenshot_url = null;
    if (!payload.profile_name) payload.profile_name = null;
    const { error } = await supabase.from('ratings').update(payload).eq('id', id);
    if (!error && userEmail && oldRating) {
      // Compute diff of changed fields
      const changes: Record<string, { old: unknown; new: unknown }> = {};
      const fields: (keyof RatingFormData)[] = ['member_id', 'team_id', 'rating_value', 'order_id', 'client_name', 'review_text', 'screenshot_url', 'profile_name', 'date_received'];
      for (const field of fields) {
        const oldVal = oldRating[field] ?? '';
        const newVal = formData[field] ?? '';
        if (String(oldVal) !== String(newVal)) {
          changes[field] = { old: oldVal, new: newVal };
        }
      }
      if (Object.keys(changes).length > 0) {
        await insertAuditLog(id, 'edited', userEmail, changes);
      }
    }
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const updateRatingStatus = async (id: string, status: 'approved' | 'rejected', userEmail?: string) => {
    const updatePayload: Record<string, unknown> = { status };
    if (userEmail) {
      updatePayload.approved_by = userEmail;
      updatePayload.approved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('ratings').update(updatePayload).eq('id', id);
    if (!error && userEmail) {
      await insertAuditLog(id, status === 'approved' ? 'approved' : 'rejected', userEmail);
    }
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  const deleteRating = async (id: string) => {
    const { error } = await supabase.from('ratings').delete().eq('id', id);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  // --- Collaborative Rating Helpers ---

  // Find all sibling ratings sharing the same order_id (excluding a specific rating)
  const findSiblingRatings = (orderId: string | null, excludeId?: string): Rating[] => {
    if (!orderId) return [];
    return ratings.filter(r => r.order_id === orderId && r.id !== excludeId);
  };

  // Find existing order data for auto-fill when entering a known order_id
  const findExistingOrderData = (orderId: string): Pick<RatingFormData, 'rating_value' | 'client_name' | 'review_text' | 'screenshot_url' | 'date_received'> | null => {
    if (!orderId) return null;
    const existing = ratings.find(r => r.order_id === orderId);
    if (!existing) return null;
    return {
      rating_value: existing.rating_value,
      client_name: existing.client_name || '',
      review_text: existing.review_text || '',
      screenshot_url: existing.screenshot_url || '',
      date_received: existing.date_received,
    };
  };

  // Update shared fields across all sibling ratings with the same order_id
  const updateSiblingRatings = async (orderId: string, sharedFields: Partial<RatingFormData>, userEmail?: string) => {
    // Only update the order-level fields that should be synchronized
    const syncPayload: Record<string, unknown> = {};
    const syncKeys: (keyof RatingFormData)[] = ['rating_value', 'client_name', 'review_text', 'screenshot_url', 'date_received'];
    for (const key of syncKeys) {
      if (key in sharedFields) {
        syncPayload[key] = sharedFields[key] || null;
      }
    }
    if (Object.keys(syncPayload).length === 0) return;

    const { error } = await supabase
      .from('ratings')
      .update(syncPayload)
      .eq('order_id', orderId);

    if (!error) {
      if (userEmail) {
        // Log audit for each sibling
        const siblings = ratings.filter(r => r.order_id === orderId);
        for (const s of siblings) {
          await insertAuditLog(s.id, 'edited', userEmail, { _note: { old: '', new: 'Bulk-synced from shared order update' } });
        }
      }
      await fetchRatings();
    }
  };

  // Delete all sibling ratings sharing the same order_id
  const deleteSiblingRatings = async (orderId: string) => {
    const { error } = await supabase.from('ratings').delete().eq('order_id', orderId);
    if (!error) await fetchRatings();
    return { error: error?.message ?? null };
  };

  // Fetch audit log for a specific rating
  const fetchAuditLog = async (ratingId: string): Promise<RatingAuditLog[]> => {
    const { data, error } = await supabase
      .from('rating_audit_log')
      .select('*')
      .eq('rating_id', ratingId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as RatingAuditLog[];
  };

  return { ratings, pendingRatings, loading, fetchRatings, createRating, updateRating, updateRatingStatus, deleteRating, findSiblingRatings, findExistingOrderData, updateSiblingRatings, deleteSiblingRatings, fetchAuditLog };
}
