'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Star } from 'lucide-react';
import { useRatings } from '@/hooks/useRatings';
import { useTeams } from '@/hooks/useTeams';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import type { Rating, RatingFormData } from '@/types/database';

const defaultForm: RatingFormData = { member_id: '', team_id: '', rating_value: 5, order_id: '', client_name: '', review_text: '', date_received: new Date().toISOString().split('T')[0] };

export default function RatingsPage() {
  const { ratings, loading, createRating, updateRating, deleteRating } = useRatings();
  const { teams } = useTeams();
  const { members } = useMembers();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rating | null>(null);
  const [form, setForm] = useState<RatingFormData>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = ratings.filter(r => {
    const matchSearch = (r.client_name || '').toLowerCase().includes(search.toLowerCase()) || (r.order_id || '').toLowerCase().includes(search.toLowerCase()) || (r.member?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchTeam = !filterTeam || r.team_id === filterTeam;
    return matchSearch && matchTeam;
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (r: Rating) => {
    setEditing(r);
    setForm({ member_id: r.member_id, team_id: r.team_id, rating_value: r.rating_value, order_id: r.order_id || '', client_name: r.client_name || '', review_text: r.review_text || '', date_received: r.date_received });
    setModalOpen(true);
  };

  // Auto-fill team when member is selected
  const handleMemberChange = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setForm({ ...form, member_id: memberId, team_id: member?.team_id || form.team_id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = editing ? await updateRating(editing.id, form) : await createRating(form);
    setSaving(false);
    if (error) showToast(error, 'error');
    else { showToast(editing ? 'Rating updated' : 'Rating added', 'success'); setModalOpen(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const { error } = await deleteRating(deleteId);
    setSaving(false);
    if (error) showToast(error, 'error');
    else showToast('Rating deleted', 'success');
    setDeleteId(null);
  };

  const teamOptions = teams.map(t => ({ value: t.id, label: `${t.name} (${t.service_line})` }));
  const memberOptions = members
    .filter(m => !form.team_id || m.team_id === form.team_id)
    .map(m => ({ value: m.id, label: `${m.name} (${m.team?.name || ''})` }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Ratings</h1>
          <p className="text-sm text-text-muted mt-1">Manage Fiverr ratings</p>
        </div>
        <Button onClick={openCreate} id="create-rating-btn"><Plus size={16} /> Add Rating</Button>
      </div>

      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member, client, order ID..." className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
        </div>
        <Select value={filterTeam} onChange={setFilterTeam} placeholder="All Teams" options={teamOptions} />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Team</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-text-muted text-sm">No ratings found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-glass transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-semibold text-xs">{r.member?.name?.charAt(0) || '?'}</div>
                      <span className="text-sm font-medium text-text-primary">{r.member?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant={r.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'}>{r.team?.name || '—'}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating_value }).map((_, j) => (
                        <Star key={j} size={12} className="text-warning" fill="#f59e0b" />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">{r.client_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-text-muted">{new Date(r.date_received).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(r.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rating' : 'Add Rating'} size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Member" value={form.member_id} onChange={handleMemberChange} options={memberOptions} placeholder="Select member" required id="rating-member" />
            <Select label="Team" value={form.team_id} onChange={v => setForm({ ...form, team_id: v })} options={teamOptions} placeholder="Auto-filled from member" required id="rating-team" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Rating" value={String(form.rating_value)} onChange={v => setForm({ ...form, rating_value: Number(v) })} options={[{value:'5',label:'⭐⭐⭐⭐⭐ (5)'},{value:'4',label:'⭐⭐⭐⭐ (4)'},{value:'3',label:'⭐⭐⭐ (3)'},{value:'2',label:'⭐⭐ (2)'},{value:'1',label:'⭐ (1)'}]} id="rating-value" />
            <Input label="Order ID" value={form.order_id} onChange={v => setForm({ ...form, order_id: v })} placeholder="FO-XXXXX" id="rating-order" />
            <Input label="Date Received" type="date" value={form.date_received} onChange={v => setForm({ ...form, date_received: v })} id="rating-date" />
          </div>
          <Input label="Client Name" value={form.client_name} onChange={v => setForm({ ...form, client_name: v })} placeholder="Client name" id="rating-client" />
          <Textarea label="Review Text" value={form.review_text} onChange={v => setForm({ ...form, review_text: v })} placeholder="Optional review text..." id="rating-review" />
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Rating" message="This rating will be permanently removed. This action cannot be undone." loading={saving} />
    </div>
  );
}
