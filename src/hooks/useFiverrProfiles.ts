'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DEFAULT_PROFILES = [
  'miahs05', 'storetailor', 'leadsbridge', 'wpbackbery', 'w3b_hive', 'mind_touch',
  'skiptrace_pro', 'adfusion360', 'easytoclick', 'techbyte_', 'b2b', 'ui_desinil',
  'aitopia_', 'shopify', 'wp_wizard', 'dotweb01', 'fairytalepins', 'ai_solution09',
  'fusecode', 'logokarigor', 'iconic_brand', 'dev_verse', 'teamdataplus', 'techdots',
  'shop_crafters', 'teamcodex', 'dhaka_express', 'clickfunnels01', 'wpwizard',
  'pro_sphere', 'dashgeek', 'sm_techno', 'app_orbit', 'brand_hopper', 'wpstellar',
  'wpriders', 'webstorelab', 'codesilly', 'locateplus', 'data_loader', 'topniches1',
  'jamrulkhan09', 'reigeeky', 'solutionbuzz41', 'designnest360', 'uidesignli',
  'dev_xpress', 'sales_handy', 'code_vibrant', 'codepremier', 'uidigital',
  'smtechnology', 'customlane', 'web_spero', 'eliteuiux', 'devduo360', 'anchortech'
];

export function useFiverrProfiles() {
  const [profiles, setProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'fiverr_profiles')
      .single();
    
    if (data?.value && Array.isArray(data.value)) {
      setProfiles(data.value as string[]);
    } else {
      // Initialize with defaults if not set
      setProfiles(DEFAULT_PROFILES);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const saveProfiles = async (newProfiles: string[]) => {
    const sorted = [...new Set(newProfiles.map(p => p.trim().toLowerCase()).filter(Boolean))].sort();
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'fiverr_profiles', value: sorted }, { onConflict: 'key' });
    if (!error) {
      setProfiles(sorted);
    }
    return { error: error?.message || null };
  };

  return { profiles, loading, fetchProfiles, saveProfiles };
}
