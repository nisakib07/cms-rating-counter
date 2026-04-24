'use client';

import { useState, useEffect } from 'react';
import { Settings, Target, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [monthlyGoal, setMonthlyGoal] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'monthly_goal')
        .single();
      if (data?.value) {
        setMonthlyGoal(typeof data.value === 'object' && 'global' in data.value ? (data.value as any).global : Number(data.value));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'monthly_goal', value: { global: monthlyGoal } }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      showToast(`Failed to save: ${error.message}`, 'error');
    } else {
      showToast('Settings saved successfully', 'success');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <p>Only super admins can access settings.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Settings size={24} className="text-primary-light" />
            Settings
          </h1>
          <p className="text-sm text-text-muted mt-1">Configure platform settings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-lg">
          {/* Monthly Goal */}
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Target size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Monthly Goal</h3>
                <p className="text-xs text-text-muted">Target number of 5-star ratings per month (shown on dashboard)</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={1000}
                value={monthlyGoal}
                onChange={e => setMonthlyGoal(parseInt(e.target.value) || 1)}
                className="w-32 px-4 py-2.5 rounded-xl bg-surface border border-border text-text-primary text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <span className="text-sm text-text-muted">five-star ratings</span>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04]">Current: {monthlyGoal}</span>
              <span>Applies to the goal tracker on the homepage</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
