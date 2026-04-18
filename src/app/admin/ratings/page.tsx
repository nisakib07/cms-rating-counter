'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Star, Image, ExternalLink, Calendar, Download, Check, Users, Info, Clock, User, FileEdit, CheckCircle, XCircle, Link2 } from 'lucide-react';
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
import type { Rating, RatingFormData, RatingAuditLog } from '@/types/database';
import { toDriveDirectUrl, exportToCSV, isActualTeam } from '@/lib/utils';

const defaultForm: RatingFormData = { member_id: '', team_id: '', rating_value: 5, order_id: '', client_name: '', review_text: '', screenshot_url: '', date_received: new Date().toISOString().split('T')[0] };

const FIELD_LABELS: Record<string, string> = {
  member_id: 'Member',
  team_id: 'Team',
  rating_value: 'Rating',
  order_id: 'Order ID',
  client_name: 'Client Name',
  review_text: 'Review Text',
  screenshot_url: 'Screenshot URL',
  date_received: 'Date Received',
};

const ACTION_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  created: { icon: Plus, color: 'text-emerald-400', label: 'Created' },
  edited: { icon: FileEdit, color: 'text-blue-400', label: 'Edited' },
  approved: { icon: CheckCircle, color: 'text-emerald-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
  status_changed: { icon: Clock, color: 'text-yellow-400', label: 'Status Changed' },
};

// --- Grouped Rating Type ---
interface GroupedRating {
  key: string; // order_id or rating id for ungrouped
  orderId: string | null;
  ratings: Rating[];
  isGroup: boolean;
}

export default function RatingsPage() {
  const { user, isSuperAdmin, memberServiceLine } = useAuth();
  const { ratings, loading, createRating, updateRating, deleteRating, findSiblingRatings, findExistingOrderData, updateSiblingRatings, deleteSiblingRatings, fetchAuditLog } = useRatings();
  const { teams } = useTeams();
  const { members } = useMembers();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rating | null>(null);
  const [form, setForm] = useState<RatingFormData>(defaultForm);
  const [multiMemberIds, setMultiMemberIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [infoRating, setInfoRating] = useState<Rating | null>(null);
  const [auditLogs, setAuditLogs] = useState<RatingAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Point 2: Auto-fill state
  const [autoFilled, setAutoFilled] = useState(false);

  // Point 1: Sibling confirmation dialogs
  const [siblingEditConfirm, setSiblingEditConfirm] = useState(false);
  const [siblingDeleteConfirm, setSiblingDeleteConfirm] = useState<{ id: string; orderId: string; siblingCount: number } | null>(null);
  const [pendingEditData, setPendingEditData] = useState<{ id: string; formData: RatingFormData; oldRating: Rating } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'add') {
        setModalOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // --- Point 2: Auto-fill when order_id is entered ---
  const handleOrderIdChange = (orderId: string) => {
    setForm(prev => ({ ...prev, order_id: orderId }));
    setAutoFilled(false);

    if (!editing && orderId.trim().length >= 3) {
      const existingData = findExistingOrderData(orderId.trim());
      if (existingData) {
        setForm(prev => ({
          ...prev,
          order_id: orderId,
          rating_value: existingData.rating_value,
          client_name: existingData.client_name,
          review_text: existingData.review_text,
          screenshot_url: existingData.screenshot_url,
          date_received: existingData.date_received,
        }));
        setAutoFilled(true);
      }
    }
  };

  const filtered = ratings.filter(r => {
    const matchSearch = (r.client_name || '').toLowerCase().includes(search.toLowerCase()) || (r.order_id || '').toLowerCase().includes(search.toLowerCase()) || (r.member?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchTeam = !filterTeam || r.team_id === filterTeam;
    const matchLine = !filterLine || r.team?.service_line === filterLine;
    const matchDateFrom = !dateFrom || r.date_received >= dateFrom;
    const matchDateTo = !dateTo || r.date_received <= dateTo;
    return matchSearch && matchTeam && matchLine && matchDateFrom && matchDateTo;
  });

  // --- Point 4: Group ratings by order_id ---
  const groupedRatings: GroupedRating[] = useMemo(() => {
    const groups: GroupedRating[] = [];
    const orderMap = new Map<string, Rating[]>();
    const standalone: Rating[] = [];

    for (const r of filtered) {
      if (r.order_id && r.order_id.trim()) {
        const key = r.order_id.trim();
        if (!orderMap.has(key)) orderMap.set(key, []);
        orderMap.get(key)!.push(r);
      } else {
        standalone.push(r);
      }
    }

    // Add grouped entries
    for (const [orderId, rats] of orderMap.entries()) {
      groups.push({
        key: `order-${orderId}`,
        orderId,
        ratings: rats,
        isGroup: rats.length > 1,
      });
    }

    // Add standalone entries
    for (const r of standalone) {
      groups.push({
        key: r.id,
        orderId: null,
        ratings: [r],
        isGroup: false,
      });
    }

    // Sort by most recent date
    groups.sort((a, b) => {
      const dateA = a.ratings[0]?.date_received || '';
      const dateB = b.ratings[0]?.date_received || '';
      return dateB.localeCompare(dateA);
    });

    return groups;
  }, [filtered]);

  // Flatten for pagination count
  const totalItems = groupedRatings.length;

  const openCreate = () => { setEditing(null); setForm(defaultForm); setMultiMemberIds([]); setAutoFilled(false); setModalOpen(true); };
  const openEdit = (r: Rating) => {
    setEditing(r);
    setForm({ member_id: r.member_id, team_id: r.team_id, rating_value: r.rating_value, order_id: r.order_id || '', client_name: r.client_name || '', review_text: r.review_text || '', screenshot_url: r.screenshot_url || '', date_received: r.date_received });
    setAutoFilled(false);
    setModalOpen(true);
  };

  // When team changes, reset member selection since the old member may not belong to the new team
  const handleTeamChange = (teamId: string) => {
    setForm({ ...form, team_id: teamId, member_id: '' });
    setMultiMemberIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.screenshot_url) return showToast("Screenshot URL is required", "error");
    if (!editing) {
      if (multiMemberIds.length === 0) return showToast("Select at least one member", "error");
      setSaving(true);
      let hasError = false;
      for (const mId of multiMemberIds) {
        const { error } = await createRating({ ...form, member_id: mId }, user?.email || 'unknown');
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
      // --- Point 1: Check for siblings before updating ---
      const siblings = findSiblingRatings(editing.order_id, editing.id);
      if (siblings.length > 0) {
        // Check if any shared fields actually changed
        const sharedFieldsChanged = ['rating_value', 'client_name', 'review_text', 'screenshot_url', 'date_received'].some(
          key => String(form[key as keyof RatingFormData] ?? '') !== String(editing[key as keyof Rating] ?? '')
        );
        if (sharedFieldsChanged) {
          // Store pending data and show confirmation
          setPendingEditData({ id: editing.id, formData: form, oldRating: editing });
          setSiblingEditConfirm(true);
          return;
        }
      }
      // No siblings or no shared fields changed — just update this one
      await performSingleUpdate(editing.id, form, editing);
    }
  };

  const performSingleUpdate = async (id: string, formData: RatingFormData, oldRating: Rating) => {
    setSaving(true);
    const { error } = await updateRating(id, formData, user?.email || 'unknown', oldRating);
    setSaving(false);
    if (error) {
      if (error.includes('unique') || error.includes('23505')) showToast('Duplicate entry for this order ID.', 'error');
      else showToast(error, 'error');
    } else { showToast('Rating updated', 'success'); setModalOpen(false); }
  };

  // Handle sibling edit confirmation
  const handleSiblingEditConfirm = async (applyToAll: boolean) => {
    if (!pendingEditData) return;
    setSiblingEditConfirm(false);

    if (applyToAll && pendingEditData.oldRating.order_id) {
      // First update the main rating (including member_id/team_id changes)
      await performSingleUpdate(pendingEditData.id, pendingEditData.formData, pendingEditData.oldRating);
      // Then sync shared fields to all siblings
      await updateSiblingRatings(pendingEditData.oldRating.order_id, pendingEditData.formData, user?.email || 'unknown');
      showToast('All collaborators updated', 'success');
    } else {
      // Just update this one
      await performSingleUpdate(pendingEditData.id, pendingEditData.formData, pendingEditData.oldRating);
    }
    setPendingEditData(null);
  };

  // --- Point 1: Delete with sibling detection ---
  const handleDeleteClick = (r: Rating) => {
    const siblings = findSiblingRatings(r.order_id, r.id);
    if (siblings.length > 0 && r.order_id) {
      setSiblingDeleteConfirm({ id: r.id, orderId: r.order_id, siblingCount: siblings.length });
    } else {
      setDeleteId(r.id);
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

  const handleSiblingDelete = async (deleteAll: boolean) => {
    if (!siblingDeleteConfirm) return;
    setSaving(true);
    if (deleteAll) {
      const { error } = await deleteSiblingRatings(siblingDeleteConfirm.orderId);
      if (error) showToast(error, 'error');
      else showToast(`All ${siblingDeleteConfirm.siblingCount + 1} ratings for this order deleted`, 'success');
    } else {
      const { error } = await deleteRating(siblingDeleteConfirm.id);
      if (error) showToast(error, 'error');
      else showToast('Rating deleted', 'success');
    }
    setSaving(false);
    setSiblingDeleteConfirm(null);
  };

  const teamOptions = teams.filter(t => isActualTeam(t)).map(t => ({ value: t.id, label: `${t.name} (${t.service_line})` }));
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
        <Select value={filterLine} onChange={v => { setFilterLine(v); setPage(1); }} placeholder="All Service Lines" options={[{ value: 'CMS Hub', label: 'CMS Hub' }, { value: 'CMS Endgame', label: 'CMS Endgame' }]} />
        <Select value={filterTeam} onChange={v => { setFilterTeam(v); setPage(1); }} placeholder="All Teams" options={teamOptions} />
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

      {/* --- Point 4: Grouped Ratings Table --- */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Member(s)</th>
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
              ) : groupedRatings.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-text-muted text-sm">No ratings found</td></tr>
              ) : groupedRatings.slice((page - 1) * pageSize, page * pageSize).map(group => {
                if (group.isGroup) {
                  // --- GROUPED ROW: Multiple collaborators on one order ---
                  const primary = group.ratings[0];
                  return (
                    <tr key={group.key} className="border-b border-border/50 bg-primary/[0.02]">
                      {/* Member column: avatar stack */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Link2 size={12} className="text-primary-light" />
                            <span className="text-[10px] font-semibold text-primary-light uppercase tracking-wider">Shared Order</span>
                          </div>
                          <div className="flex items-center -space-x-2">
                            {group.ratings.map((r, idx) => (
                              <div
                                key={r.id}
                                className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning font-semibold text-xs overflow-hidden border-2 border-surface shrink-0"
                                style={{ zIndex: group.ratings.length - idx }}
                                title={r.member?.name || 'Unknown'}
                              >
                                {r.member?.profile_image ? (
                                  <img src={toDriveDirectUrl(r.member.profile_image)} alt={r.member?.name || ''} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = r.member?.name?.charAt(0) || '?'; }} />
                                ) : (r.member?.name?.charAt(0) || '?')}
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {group.ratings.map(r => (
                              <span key={r.id} className="text-xs text-text-secondary">{r.member?.name || 'Unknown'}{r !== group.ratings[group.ratings.length - 1] ? ',' : ''}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          {/* Show unique teams */}
                          {[...new Map(group.ratings.map(r => [r.team_id, r])).values()].map(r => (
                            <Badge key={r.team_id} variant={r.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} customColor={r.team?.color}>{r.team?.name || '—'}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-warning" fill="#f59e0b" />
                          <span className="text-xs font-semibold text-warning">{primary.rating_value}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-muted">{primary.client_name || '—'}</td>
                      <td className="px-5 py-4 text-sm text-text-muted">{new Date(primary.date_received).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {primary.screenshot_url ? (
                          <a href={primary.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">
                            <Image size={13} /> View <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {(isSuperAdmin || memberServiceLine === primary.team?.service_line) ? (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Per-member edit/delete */}
                            {group.ratings.map(r => (
                              <div key={r.id} className="flex items-center gap-1 text-xs">
                                <span className="text-text-muted truncate max-w-[70px]">{r.member?.name?.split(' ')[0]}</span>
                                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer" title={`Edit ${r.member?.name}'s entry`}><Pencil size={13} /></button>
                                <button onClick={() => handleDeleteClick(r)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer" title={`Delete ${r.member?.name}'s entry`}><Trash2 size={13} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 px-4">
                            <span className="text-xs text-text-muted italic">View only</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                } else {
                  // --- SINGLE ROW: Standard non-grouped rating ---
                  const r = group.ratings[0];
                  return (
                    <tr key={group.key} className="border-b border-border/50 hover:bg-glass transition-colors">
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
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-warning" fill="#f59e0b" />
                          <span className="text-xs font-semibold text-warning">{r.rating_value}</span>
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
                            {isSuperAdmin && (
                              <button onClick={async () => { setInfoRating(r); setAuditLoading(true); const logs = await fetchAuditLog(r.id); setAuditLogs(logs); setAuditLoading(false); }} className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors cursor-pointer" title="Rating Info"><Info size={15} /></button>
                            )}
                            <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                            <button onClick={() => handleDeleteClick(r)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 px-4">
                            <span className="text-xs text-text-muted italic">View only</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => setPage(p)} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      {/* --- Add/Edit Modal with Point 2: Auto-fill --- */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rating' : 'Add Rating'} size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select label="Team" value={form.team_id} onChange={handleTeamChange} options={teamOptions} placeholder="Select team" required id="rating-team" />

          {/* Member Selection */}
          {editing ? (
            <Select label="Member" value={form.member_id} onChange={v => setForm({ ...form, member_id: v })} options={memberOptions} placeholder={form.team_id ? 'Select member' : 'Select a team first'} required id="rating-member" />
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Users size={14} className="text-primary" />
                  Members<span className="text-red-400 ml-0.5">*</span>
                </label>
                {multiMemberIds.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {multiMemberIds.length} selected
                  </span>
                )}
              </div>
              {!form.team_id ? (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-border bg-surface/50">
                  <span className="text-sm text-text-muted">Select a team first to view members</span>
                </div>
              ) : members.filter(m => m.team_id === form.team_id).length === 0 ? (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-border bg-surface/50">
                  <span className="text-sm text-text-muted">No members found in this team</span>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface/30 p-2 max-h-[220px] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {members.filter(m => m.team_id === form.team_id).map(m => {
                      const isSelected = multiMemberIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setMultiMemberIds(multiMemberIds.filter(id => id !== m.id));
                            } else {
                              setMultiMemberIds([...multiMemberIds, m.id]);
                            }
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/10 ring-1 ring-primary/20'
                              : 'bg-white/[0.02] border-white/[0.06] text-text-muted hover:text-text-primary hover:bg-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary text-white' : 'border border-white/[0.15] bg-white/[0.03]'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold uppercase overflow-hidden">
                              {m.profile_image ? (
                                <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = m.name.charAt(0); }} />
                              ) : m.name.charAt(0)}
                            </div>
                            <span className="text-left leading-tight">{m.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Rating" type="number" value={String(form.rating_value)} onChange={v => setForm({ ...form, rating_value: Number(v) })} placeholder="e.g. 5, 4.7" required id="rating-value" />
            <Input label="Order ID" value={form.order_id} onChange={handleOrderIdChange} placeholder="FO-XXXXX" required id="rating-order" />
            <Input label="Date Received" type="date" value={form.date_received} onChange={v => setForm({ ...form, date_received: v })} required id="rating-date" />
          </div>

          {/* Point 2: Auto-fill indicator */}
          {autoFilled && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary-light">
              <Link2 size={14} />
              <span>Fields auto-filled from existing Order <strong>{form.order_id}</strong>. Shared data is synchronized.</span>
            </div>
          )}

          <Input label="Client Name" value={form.client_name} onChange={v => setForm({ ...form, client_name: v })} placeholder="Client name" required id="rating-client" />
          <Textarea label="Review Text" value={form.review_text} onChange={v => setForm({ ...form, review_text: v })} placeholder="What did the client say?" required id="rating-review" />
          <Input label="Screenshot URL" value={form.screenshot_url} onChange={v => setForm({ ...form, screenshot_url: v })} placeholder="Only Lightshot link is accepted (https://prnt.sc/...)" required id="rating-screenshot" />
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.order_id.trim() || !form.client_name.trim() || !form.review_text.trim() || !form.screenshot_url.trim() || (!editing && multiMemberIds.length === 0)}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      {/* Standard delete confirmation (no siblings) */}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Rating" message="This rating will be permanently removed. This action cannot be undone." loading={saving} />

      {/* --- Point 1: Sibling Delete Confirmation --- */}
      <Modal isOpen={!!siblingDeleteConfirm} onClose={() => setSiblingDeleteConfirm(null)} title="Shared Order Detected" size="sm">
        {siblingDeleteConfirm && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <Users size={20} className="text-warning shrink-0" />
              <p className="text-sm text-text-secondary">
                This order is shared by <strong className="text-text-primary">{siblingDeleteConfirm.siblingCount + 1} members</strong>. 
                How would you like to proceed?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="danger" onClick={() => handleSiblingDelete(true)} disabled={saving} className="w-full justify-center">
                {saving ? 'Deleting...' : `Delete all ${siblingDeleteConfirm.siblingCount + 1} ratings`}
              </Button>
              <Button variant="ghost" onClick={() => handleSiblingDelete(false)} disabled={saving} className="w-full justify-center">
                Delete only this member&apos;s entry
              </Button>
              <Button variant="ghost" onClick={() => setSiblingDeleteConfirm(null)} className="w-full justify-center text-text-muted">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- Point 1: Sibling Edit Confirmation --- */}
      <Modal isOpen={siblingEditConfirm} onClose={() => { setSiblingEditConfirm(false); setPendingEditData(null); }} title="Shared Order Detected" size="sm">
        {pendingEditData && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Link2 size={20} className="text-primary-light shrink-0" />
              <p className="text-sm text-text-secondary">
                This order is shared with <strong className="text-text-primary">{findSiblingRatings(pendingEditData.oldRating.order_id, pendingEditData.id).length} other member(s)</strong>. 
                Apply shared field changes (rating, client, review, screenshot, date) to everyone?
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => handleSiblingEditConfirm(true)} disabled={saving} className="w-full justify-center">
                {saving ? 'Updating...' : 'Update all collaborators'}
              </Button>
              <Button variant="ghost" onClick={() => handleSiblingEditConfirm(false)} disabled={saving} className="w-full justify-center">
                Update only this member
              </Button>
              <Button variant="ghost" onClick={() => { setSiblingEditConfirm(false); setPendingEditData(null); }} className="w-full justify-center text-text-muted">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rating Info Modal (Super Admin Only) */}
      <Modal isOpen={!!infoRating} onClose={() => { setInfoRating(null); setAuditLogs([]); }} title="Rating Details" size="md">
        {infoRating && (
          <div className="flex flex-col gap-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Member</div>
                <div className="text-sm font-medium text-text-primary">{infoRating.member?.name || '—'}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Team</div>
                <div className="text-sm font-medium text-text-primary">{infoRating.team?.name || '—'}</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Status</div>
                <Badge variant={infoRating.status === 'approved' ? 'success' : infoRating.status === 'rejected' ? 'danger' : 'warning'}>{infoRating.status}</Badge>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Created</div>
                <div className="text-sm text-text-secondary">{new Date(infoRating.created_at).toLocaleString()}</div>
              </div>
            </div>

            {/* Approval Info */}
            {infoRating.approved_by && (
              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {infoRating.status === 'rejected' ? 'Rejected' : 'Approved'} By
                  </span>
                </div>
                <div className="text-sm font-medium text-text-primary">{infoRating.approved_by}</div>
                {infoRating.approved_at && (
                  <div className="text-xs text-text-muted mt-1">{new Date(infoRating.approved_at).toLocaleString()}</div>
                )}
              </div>
            )}

            {/* Audit Log Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-primary-light" />
                <span className="text-sm font-semibold text-text-primary">Activity Log</span>
                <span className="text-xs text-text-muted">({auditLogs.length} entries)</span>
              </div>
              {auditLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-6 text-sm text-text-muted bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
                  No activity recorded yet
                </div>
              ) : (
                <div className="relative pl-6 flex flex-col gap-0 max-h-[300px] overflow-y-auto pr-1">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/[0.08]" />
                  {auditLogs.map((log, i) => {
                    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.status_changed;
                    const Icon = config.icon;
                    return (
                      <div key={log.id} className={`relative pb-4 ${i === auditLogs.length - 1 ? 'pb-0' : ''}`}>
                        {/* Timeline dot */}
                        <div className={`absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full border-2 border-surface bg-surface flex items-center justify-center`}>
                          <Icon size={10} className={config.color} />
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                            <span className="text-[10px] text-text-muted">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <User size={10} />
                            <span>{log.changed_by}</span>
                          </div>
                          {/* Show changed fields for edits */}
                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="mt-2 flex flex-col gap-1.5">
                              {Object.entries(log.changes).map(([field, vals]) => (
                                <div key={field} className="text-xs bg-white/[0.02] rounded-md px-2.5 py-1.5 border border-white/[0.04]">
                                  <span className="font-medium text-text-secondary">{FIELD_LABELS[field] || field}:</span>
                                  <span className="text-red-400/70 line-through ml-2">{String(vals.old || '(empty)')}</span>
                                  <span className="text-text-muted mx-1.5">→</span>
                                  <span className="text-emerald-400">{String(vals.new || '(empty)')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => { setInfoRating(null); setAuditLogs([]); }}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
