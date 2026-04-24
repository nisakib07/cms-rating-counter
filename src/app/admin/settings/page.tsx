'use client';

import { useState, useEffect } from 'react';
import { Settings, Target, Save, Globe, Plus, X, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { useFiverrProfiles } from '@/hooks/useFiverrProfiles';

export default function SettingsPage() {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const { profiles, saveProfiles, loading: profilesLoading } = useFiverrProfiles();
  const [monthlyGoal, setMonthlyGoal] = useState(100);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile management
  const [newProfile, setNewProfile] = useState('');
  const [editedProfiles, setEditedProfiles] = useState<string[]>([]);
  const [profilesDirty, setProfilesDirty] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

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

  // Sync editedProfiles when profiles load
  useEffect(() => {
    if (profiles.length > 0 && editedProfiles.length === 0) {
      setEditedProfiles([...profiles]);
    }
  }, [profiles]);

  const handleSaveGoal = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'monthly_goal', value: { global: monthlyGoal } }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      showToast(`Failed to save: ${error.message}`, 'error');
    } else {
      showToast('Monthly goal saved', 'success');
    }
  };

  const handleAddProfile = () => {
    const name = newProfile.trim().toLowerCase();
    if (!name || editedProfiles.includes(name)) {
      if (editedProfiles.includes(name)) showToast('Profile already exists', 'error');
      return;
    }
    setEditedProfiles([...editedProfiles, name].sort());
    setNewProfile('');
    setProfilesDirty(true);
  };

  const handleRemoveProfile = (name: string) => {
    setEditedProfiles(editedProfiles.filter(p => p !== name));
    setProfilesDirty(true);
  };

  const handleSaveProfiles = async () => {
    setSaving(true);
    const { error } = await saveProfiles(editedProfiles);
    setSaving(false);
    if (error) {
      showToast(`Failed to save: ${error}`, 'error');
    } else {
      showToast(`${editedProfiles.length} profiles saved`, 'success');
      setProfilesDirty(false);
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

      {loading || profilesLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-2xl flex flex-col gap-6">
          {/* Monthly Goal */}
          <div className="glass rounded-2xl p-6">
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
              <div className="ml-auto">
                <Button onClick={handleSaveGoal} disabled={saving} size="sm">
                  <Save size={14} /> Save
                </Button>
              </div>
            </div>
          </div>

          {/* Fiverr Profiles */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Globe size={20} className="text-primary-light" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary">Fiverr Profiles</h3>
                <p className="text-xs text-text-muted">Manage the list of Fiverr profile names available in the rating form</p>
              </div>
              <span className="text-xs text-text-muted font-medium px-2.5 py-1 rounded-lg bg-white/[0.04]">{editedProfiles.length} profiles</span>
            </div>

            {/* Add new */}
            <div className="flex items-center gap-2 mb-4">
              <input
                value={newProfile}
                onChange={e => setNewProfile(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddProfile())}
                placeholder="Add new profile name..."
                className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={handleAddProfile} size="sm" disabled={!newProfile.trim()}>
                <Plus size={14} /> Add
              </Button>
            </div>

            {/* Profile list */}
            <div className="max-h-[300px] overflow-y-auto rounded-xl border border-white/[0.06] bg-surface/30">
              <div className="flex flex-wrap gap-1.5 p-3">
                {editedProfiles.map(p => (
                  <div key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-text-secondary hover:border-white/[0.12] group transition-all">
                    {editingProfile === p ? (
                      <input
                        autoFocus
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const newName = editingValue.trim().toLowerCase();
                            if (newName && newName !== p && !editedProfiles.includes(newName)) {
                              setEditedProfiles(editedProfiles.map(x => x === p ? newName : x).sort());
                              setProfilesDirty(true);
                            }
                            setEditingProfile(null);
                          } else if (e.key === 'Escape') {
                            setEditingProfile(null);
                          }
                        }}
                        onBlur={() => {
                          const newName = editingValue.trim().toLowerCase();
                          if (newName && newName !== p && !editedProfiles.includes(newName)) {
                            setEditedProfiles(editedProfiles.map(x => x === p ? newName : x).sort());
                            setProfilesDirty(true);
                          }
                          setEditingProfile(null);
                        }}
                        className="w-28 px-1 py-0 bg-transparent border-b border-primary text-text-primary text-xs font-mono focus:outline-none"
                      />
                    ) : (
                      <>
                        <span
                          className="font-mono text-xs cursor-pointer hover:text-primary-light transition-colors"
                          onClick={() => { setEditingProfile(p); setEditingValue(p); }}
                          title="Click to rename"
                        >
                          {p}
                        </span>
                        <button
                          onClick={() => { setEditingProfile(p); setEditingValue(p); }}
                          className="w-4 h-4 rounded flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 hover:text-primary-light transition-all cursor-pointer"
                        >
                          <Pencil size={8} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRemoveProfile(p)}
                      className="w-4 h-4 rounded flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {profilesDirty && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveProfiles} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Profiles'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
