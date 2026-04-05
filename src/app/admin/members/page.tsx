'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Shield, ShieldCheck, Download } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import type { Member, MemberFormData, MemberRole } from '@/types/database';
import { ALL_ROLES, isAdminRole, isSuperAdmin } from '@/types/database';
import { toDriveDirectUrl, exportToCSV } from '@/lib/utils';

const defaultForm: MemberFormData = { member_id: '', name: '', email: '', role: 'Developer', team_id: '', profile_image: '', joined_at: new Date().toISOString().split('T')[0] };

export default function MembersPage() {
  const { members, loading, createMember, updateMember, deleteMember } = useMembers();
  const { teams } = useTeams();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberFormData>(defaultForm);
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

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || (m.email || '').toLowerCase().includes(search.toLowerCase()) || (m.member_id || '').toLowerCase().includes(search.toLowerCase());
    const matchTeam = !filterTeam || m.team_id === filterTeam;
    const matchRole = !filterRole || m.role === filterRole;
    return matchSearch && matchTeam && matchRole;
  });

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ member_id: m.member_id || '', name: m.name, email: m.email || '', role: m.role, team_id: m.team_id, profile_image: m.profile_image || '', joined_at: m.joined_at });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = editing ? await updateMember(editing.id, form) : await createMember(form);
    setSaving(false);
    if (error) showToast(error, 'error');
    else { showToast(editing ? 'Member updated' : 'Member added', 'success'); setModalOpen(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const { error } = await deleteMember(deleteId);
    setSaving(false);
    if (error) showToast(error, 'error');
    else showToast('Member deleted', 'success');
    setDeleteId(null);
  };

  const teamOptions = teams.map(t => ({ value: t.id, label: `${t.name} (${t.service_line})` }));
  const roleOptions = ALL_ROLES.map(r => ({ value: r.value, label: r.label }));

  const getRoleBadge = (m: Member) => {
    if (isSuperAdmin(m.email)) {
      return <Badge variant="danger" size="sm"><ShieldCheck size={10} /> Super Admin</Badge>;
    }
    if (isAdminRole(m.role)) {
      return <Badge variant="warning" size="sm"><Shield size={10} /> Admin</Badge>;
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Members</h1>
          <p className="text-sm text-text-muted mt-1">Manage team members</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filtered.map(m => ({ ID: m.member_id || '', Name: m.name, Email: m.email || '', Role: m.role, Team: m.team?.name || '', Joined: m.joined_at })), 'members')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer"
          ><Download size={14} /> Export CSV</button>
          <Button onClick={openCreate} id="create-member-btn"><Plus size={16} /> Add Member</Button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or ID..." className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
        </div>
        <Select value={filterTeam} onChange={setFilterTeam} placeholder="All Teams" options={teamOptions} />
        <Select value={filterRole} onChange={setFilterRole} placeholder="All Roles" options={roleOptions} />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Access</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Team</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-text-muted text-sm">No members found</td></tr>
              ) : filtered.slice((page - 1) * pageSize, page * pageSize).map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-glass transition-colors">
                  <td className="px-5 py-4 text-sm font-mono text-text-muted">{m.member_id || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {m.profile_image ? (
                        <img src={toDriveDirectUrl(m.profile_image)} alt={m.name} className="w-8 h-8 rounded-full object-cover bg-surface" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }} />
                      ) : null}
                      <div className={`w-8 h-8 rounded-full bg-primary/20 items-center justify-center text-primary-light font-semibold text-xs ${m.profile_image ? 'hidden' : 'flex'}`}>{m.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-text-primary">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-muted">{m.email || '—'}</td>
                  <td className="px-5 py-4"><Badge variant="neutral">{m.role}</Badge></td>
                  <td className="px-5 py-4">{getRoleBadge(m) || <span className="text-xs text-text-muted">Member</span>}</td>
                  <td className="px-5 py-4"><Badge variant={m.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'}>{m.team?.name || '—'}</Badge></td>
                  <td className="px-5 py-4 text-sm text-text-muted">{new Date(m.joined_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-glass-light text-text-muted hover:text-text-primary transition-colors cursor-pointer"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteId(m.id)} className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={(p) => setPage(p)} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Add Member'} size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Member ID" value={form.member_id} onChange={v => setForm({ ...form, member_id: v })} placeholder="e.g. EMP-001" id="member-id" />
            <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Full name" required id="member-name" />
            <Input label="Email" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@example.com" id="member-email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Role" value={form.role} onChange={v => setForm({ ...form, role: v as MemberRole })} options={roleOptions} id="member-role" />
            <Select label="Team" value={form.team_id} onChange={v => setForm({ ...form, team_id: v })} options={teamOptions} placeholder="Select team" required id="member-team" />
          </div>
          {isAdminRole(form.role) && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2.5 text-xs text-warning-light flex items-center gap-2">
              <Shield size={14} /> This role will automatically grant admin access to the panel.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input label="Profile Image URL" value={form.profile_image} onChange={v => setForm({ ...form, profile_image: v })} placeholder="Google Drive link or direct image URL" id="member-image" />
              {form.profile_image && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={toDriveDirectUrl(form.profile_image)} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-border" onError={e => (e.currentTarget.style.display = 'none')} />
                  <span className="text-xs text-text-muted">Preview</span>
                </div>
              )}
            </div>
            <Input label="Joined Date" type="date" value={form.joined_at} onChange={v => setForm({ ...form, joined_at: v })} id="member-joined" />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Member" message="This will also delete all ratings for this member. This action cannot be undone." loading={saving} />
    </div>
  );
}
