'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Star, Image, ExternalLink, Calendar, Download } from 'lucide-react';
import { useRatings } from '@/hooks/useRatings';
import { useTeams } from '@/hooks/useTeams';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import type { Rating, RatingFormData } from '@/types/database';
import { toDriveDirectUrl, exportToCSV } from '@/lib/utils';

const defaultForm: RatingFormData = { member_id: '', team_id: '', rating_value: 5, order_id: '', client_name: '', review_text: '', screenshot_url: '', date_received: new Date().toISOString().split('T')[0] };

export default function RatingsPage() {
  const { isSuperAdmin, memberServiceLine } = useAuth();
  const { ratings, loading, createRating, updateRating, deleteRating } = useRatings();
  const { teams } = useTeams();
  const { members } = useMembers();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rating | null>(null);
  const [form, setForm] = useState<RatingFormData>(defaultForm);
  const [multiMemberIds, setMultiMemberIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'add') {
        setModalOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const filtered = ratings.filter(r => {
    const matchSearch = (r.client_name || '').toLowerCase().includes(search.toLowerCase()) || (r.order_id || '').toLowerCase().includes(search.toLowerCase()) || (r.member?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchTeam = !filterTeam || r.team_id === filterTeam;
    const matchDateFrom = !dateFrom || r.date_received >= dateFrom;
    const matchDateTo = !dateTo || r.date_received <= dateTo;
    return matchSearch && matchTeam && matchDateFrom && matchDateTo;
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setMultiMemberIds([]); setModalOpen(true); };
  const openEdit = (r: Rating) => {
    setEditing(r);
    setForm({ member_id: r.member_id, team_id: r.team_id, rating_value: r.rating_value, order_id: r.order_id || '', client_name: r.client_name || '', review_text: r.review_text || '', screenshot_url: r.screenshot_url || '', date_received: r.date_received });
    setModalOpen(true);
  };

  // When team changes, reset member selection since the old member may not belong to the new team
  const handleTeamChange = (teamId: string) => {
    setForm({ ...form, team_id: teamId, member_id: '' });
    setMultiMemberIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) {
      if (multiMemberIds.length === 0) return showToast("Select at least one member", "error");
      setSaving(true);
      let hasError = false;
      for (const mId of multiMemberIds) {
        const { error } = await createRating({ ...form, member_id: mId });
        if (error) { 
          if (error.includes('unique') || error.includes('23505')) {
            showToast('A rating mapping for one of these members already exists on this Order ID.', 'error');
          } else {
            showToast(error, 'error'); 
          }
          hasError = true; 
          break; 
        }
      }
      setSaving(false);
      if (!hasError) { showToast('Ratings added', 'success'); setModalOpen(false); }
    } else {
      setSaving(true);
      const { error } = await updateRating(editing.id, form);
      setSaving(false);
      if (error) {
        if (error.includes('unique') || error.includes('23505')) showToast('Duplicate entry for this order ID.', 'error');
        else showToast(error, 'error');
      } else { showToast('Rating updated', 'success'); setModalOpen(false); }
    }
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
  // Only show members belonging to the selected team
  const memberOptions = form.team_id
    ? members.filter(m => m.team_id === form.team_id).map(m => ({ value: m.id, label: m.name }))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Ratings</h1>
          <p className="text-sm text-text-muted mt-1">Manage Fiverr ratings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filtered.map(r => ({ Member: r.member?.name || '', Team: r.team?.name || '', Rating: r.rating_value, Client: r.client_name || '', Order_ID: r.order_id || '', Date: r.date_received, Review: r.review_text || '' })), 'ratings')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
          ><Download size={14} /> Export CSV</button>
          <Button onClick={openCreate} id="create-rating-btn"><Plus size={16} /> Add Rating</Button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member, client, order ID..." className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
        </div>
        <Select value={filterTeam} onChange={setFilterTeam} placeholder="All Teams" options={teamOptions} />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-text-muted" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2.5 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <span className="text-text-muted text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2.5 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="px-2 py-2 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer">Clear</button>
          )}
        </div>
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
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Screenshot</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-text-muted text-sm">No ratings found</td></tr>
              ) : filtered.slice((page - 1) * pageSize, page * pageSize).map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-glass transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-semibold text-xs overflow-hidden">
                        {r.member?.profile_image ? (
                          <img src={toDriveDirectUrl(r.member.profile_image)} alt={r.member?.name || ''} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = r.member?.name?.charAt(0) || '?'; }} />
                        ) : (r.member?.name?.charAt(0) || '?')}
                      </div>
                      <span className="text-sm font-medium text-text-primary">{r.member?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant={r.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} customColor={r.team?.color}>{r.team?.name || '—'}</Badge></td>
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
                    {r.screenshot_url ? (
                      <a href={r.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">
                        <Image size={13} /> View <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {(isSuperAdmin || memberServiceLine === r.team?.service_line) ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(r.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 px-4">
                        <span className="text-xs text-text-muted italic">View only</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={(p) => setPage(p)} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rating' : 'Add Rating'} size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Team" value={form.team_id} onChange={handleTeamChange} options={teamOptions} placeholder="Select team" required id="rating-team" />
            {editing ? (
              <Select label="Member" value={form.member_id} onChange={v => setForm({ ...form, member_id: v })} options={memberOptions} placeholder={form.team_id ? 'Select member' : 'Select a team first'} required id="rating-member" />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Members <span className="text-text-muted font-normal">(Select all that apply)</span></label>
                {!form.team_id ? (
                  <div className="text-sm text-text-muted mt-2">Select a team first.</div>
                ) : members.filter(m => m.team_id === form.team_id).length === 0 ? (
                  <div className="text-sm text-text-muted mt-2">No members found in this team.</div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {members.filter(m => m.team_id === form.team_id).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (multiMemberIds.includes(m.id)) {
                            setMultiMemberIds(multiMemberIds.filter(id => id !== m.id));
                          } else {
                            setMultiMemberIds([...multiMemberIds, m.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          multiMemberIds.includes(m.id) 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 border-primary' 
                            : 'bg-surface border-border text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
                        } border`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Rating" value={String(form.rating_value)} onChange={v => setForm({ ...form, rating_value: Number(v) })} options={[{value:'5',label:'⭐⭐⭐⭐⭐ (5)'},{value:'4',label:'⭐⭐⭐⭐ (4)'},{value:'3',label:'⭐⭐⭐ (3)'},{value:'2',label:'⭐⭐ (2)'},{value:'1',label:'⭐ (1)'}]} id="rating-value" />
            <Input label="Order ID" value={form.order_id} onChange={v => setForm({ ...form, order_id: v })} placeholder="FO-XXXXX" id="rating-order" />
            <Input label="Date Received" type="date" value={form.date_received} onChange={v => setForm({ ...form, date_received: v })} id="rating-date" />
          </div>
          <Input label="Client Name" value={form.client_name} onChange={v => setForm({ ...form, client_name: v })} placeholder="Client name" id="rating-client" />
          <Textarea label="Review Text" value={form.review_text} onChange={v => setForm({ ...form, review_text: v })} placeholder="Optional review text..." id="rating-review" />
          <div>
            <Input label="Screenshot URL (optional)" value={form.screenshot_url} onChange={v => setForm({ ...form, screenshot_url: v })} placeholder="https://i.imgur.com/... or any image link" id="rating-screenshot" />
            {form.screenshot_url && (
              <div className="mt-2 rounded-lg overflow-hidden border border-border bg-surface">
                <img src={form.screenshot_url} alt="Screenshot preview" className="max-h-32 w-auto object-contain mx-auto" onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || (!editing && multiMemberIds.length === 0)}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Rating" message="This rating will be permanently removed. This action cannot be undone." loading={saving} />
    </div>
  );
}
