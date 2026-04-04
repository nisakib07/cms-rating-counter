'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import type { Team, TeamFormData, ServiceLine } from '@/types/database';

const defaultForm: TeamFormData = { name: '', service_line: 'CMS Hub' };

export default function TeamsPage() {
  const { teams, loading, createTeam, updateTeam, deleteTeam } = useTeams();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamFormData>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchLine = !filterLine || t.service_line === filterLine;
    return matchSearch && matchLine;
  });

  const openCreate = () => { setEditingTeam(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (team: Team) => { setEditingTeam(team); setForm({ name: team.name, service_line: team.service_line }); setModalOpen(true); };

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
        <Button onClick={openCreate} id="create-team-btn"><Plus size={16} /> Add Team</Button>
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
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-text-muted"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-text-muted text-sm">No teams found</td></tr>
              ) : filtered.map(team => (
                <tr key={team.id} className="border-b border-border/50 hover:bg-glass transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-text-primary">{team.name}</td>
                  <td className="px-5 py-4"><Badge variant={team.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'}>{team.service_line}</Badge></td>
                  <td className="px-5 py-4 text-sm text-text-muted">{new Date(team.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(team)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(team.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTeam ? 'Edit Team' : 'Create Team'} size="sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Team Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Enter team name" required id="team-name-input" />
          <Select label="Service Line" value={form.service_line} onChange={v => setForm({ ...form, service_line: v as ServiceLine })} options={[{ value: 'CMS Hub', label: 'CMS Hub' }, { value: 'CMS Endgame', label: 'CMS Endgame' }]} id="team-service-line-select" />
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
