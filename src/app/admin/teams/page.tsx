'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Crown, Download } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useMembers } from '@/hooks/useMembers';
import { useRatings } from '@/hooks/useRatings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import type { Team, TeamFormData, ServiceLine } from '@/types/database';
import { exportToCSV } from '@/lib/utils';

const defaultForm: TeamFormData = { name: '', service_line: 'CMS Hub', color: '#10b981' };

export default function TeamsPage() {
  const { isSuperAdmin, memberServiceLine } = useAuth();
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { members } = useMembers();
  const { ratings } = useRatings();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamFormData>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'add') {
        setModalOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchLine = !filterLine || t.service_line === filterLine;
    return matchSearch && matchLine;
  });

  const openCreate = () => { setEditingTeam(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (team: Team) => { setEditingTeam(team); setForm({ name: team.name, service_line: team.service_line, color: team.color || '#10b981' }); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = editingTeam
      ? await updateTeam(editingTeam.id, form)
      : await createTeam(form);
    setSaving(false);
    if (error) { showToast(error, 'error'); }
    else { showToast(editingTeam ? 'Team updated' : 'Team created', 'success'); setModalOpen(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const { error } = await deleteTeam(deleteId);
    setSaving(false);
    if (error) showToast(error, 'error');
    else showToast('Team deleted', 'success');
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Teams</h1>
          <p className="text-sm text-text-muted mt-1">Manage teams across service lines</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filtered.map(t => {
              const mc = members.filter(m => m.team_id === t.id).length;
              const rc = ratings.filter(r => r.team_id === t.id).length;
              return { Name: t.name, Service_Line: t.service_line, Members: mc, Ratings: rc, Created: new Date(t.created_at).toLocaleDateString() };
            }), 'teams')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
          ><Download size={14} /> Export CSV</button>
          <Button onClick={openCreate} id="create-team-btn"><Plus size={16} /> Add Team</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
        </div>
        <Select value={filterLine} onChange={setFilterLine} placeholder="All Service Lines" options={[{ value: 'CMS Hub', label: 'CMS Hub' }, { value: 'CMS Endgame', label: 'CMS Endgame' }]} />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Service Line</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Members</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Ratings</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Top Performer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-text-muted"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-text-muted text-sm">No teams found</td></tr>
              ) : filtered.map(team => {
                const teamMembers = members.filter(m => m.team_id === team.id);
                const teamRatings = ratings.filter(r => r.team_id === team.id);
                const memberRatings = teamMembers.map(m => ({ ...m, count: teamRatings.filter(r => r.member_id === m.id).length }));
                const topPerformer = memberRatings.sort((a, b) => b.count - a.count)[0];
                return (
                <tr key={team.id} className="border-b border-border/50 hover:bg-glass transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                       {team.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />}
                       {team.name}
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant={team.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} customColor={team.color}>{team.service_line}</Badge></td>
                  <td className="px-5 py-4 text-center text-sm font-semibold text-text-primary">{teamMembers.length}</td>
                  <td className="px-5 py-4 text-center text-sm font-semibold text-primary-light">{teamRatings.length}</td>
                  <td className="px-5 py-4">
                    {topPerformer && topPerformer.count > 0 ? (
                      <div className="flex items-center gap-2">
                        <Crown size={12} className="text-warning" />
                        <span className="text-sm text-text-primary">{topPerformer.name}</span>
                        <span className="text-xs text-text-muted">({topPerformer.count})</span>
                      </div>
                    ) : <span className="text-xs text-text-muted">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">{new Date(team.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {(isSuperAdmin || memberServiceLine === team.service_line) ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(team)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(team.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 px-4">
                        <span className="text-xs text-text-muted italic">View only</span>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTeam ? 'Edit Team' : 'Create Team'} size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Team Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Enter team name" required id="team-name-input" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Service Line" value={form.service_line} onChange={v => setForm({ ...form, service_line: v as ServiceLine })} options={[{ value: 'CMS Hub', label: 'CMS Hub' }, { value: 'CMS Endgame', label: 'CMS Endgame' }]} id="team-service-line-select" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Team Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color || '#10b981'} onChange={e => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                <span className="text-sm text-text-muted font-mono">{form.color || '#10b981'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingTeam ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Team" message="This will also delete all members and ratings in this team. This action cannot be undone." loading={saving} />
    </div>
  );
}
