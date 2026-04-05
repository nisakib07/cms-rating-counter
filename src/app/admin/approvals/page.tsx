'use client';

import { useState, useEffect } from 'react';
import { Check, X, Search, Image, ExternalLink } from 'lucide-react';
import { useRatings } from '@/hooks/useRatings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import type { Member, Rating } from '@/types/database';
import { toDriveDirectUrl } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ApprovalsPage() {
  const { pendingRatings, loading: ratingsLoading, updateRatingStatus } = useRatings();
  const { user, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [search, setSearch] = useState('');
  
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!user?.email) {
        setLoadingMember(false);
        return;
      }
      
      const { data } = await supabase
        .from('members')
        .select('*, team:teams(*)')
        .eq('email', user.email)
        .single();
        
      if (data) setCurrentMember(data);
      setLoadingMember(false);
    };
    
    fetchMemberDetails();
  }, [user]);

  const handleConfirmAction = async () => {
    if (!actionId || !actionType) return;
    setSaving(true);
    
    const { error } = await updateRatingStatus(actionId, actionType);
    
    setSaving(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast(`Rating ${actionType} successfully`, 'success');
    }
    setActionId(null);
    setActionType(null);
  };

  // Authorization filter logic
  const authorizedRatings = pendingRatings.filter(r => {
    // Super admins see all
    if (isSuperAdmin) return true;
    
    // If we don't have member details, they can't see anything
    if (!currentMember) return false;
    
    // Operations/Project managers see all pending ratings for their service line
    if (currentMember.role === 'Operations Manager' || currentMember.role === 'Project Manager') {
      return r.team?.service_line === currentMember.team?.service_line;
    }
    
    // Team Leads/Co-leads see pending ratings ONLY for their team
    if (currentMember.role === 'Team Lead' || currentMember.role === 'Co-lead') {
      return r.team_id === currentMember.team_id;
    }
    
    return false;
  });

  const filtered = authorizedRatings.filter(r => {
    const matchSearch = (r.client_name || '').toLowerCase().includes(search.toLowerCase()) 
      || (r.order_id || '').toLowerCase().includes(search.toLowerCase()) 
      || (r.member?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const isLoading = ratingsLoading || loadingMember;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Approvals</h1>
          <p className="text-sm text-text-muted mt-1">Review and approve pending team ratings</p>
        </div>
      </div>

      <div className="glass rounded-xl p-4 mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search pending ratings by member, client, or order ID..." 
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="glass rounded-2xl p-12 text-center text-text-muted text-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading pending ratings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-text-muted text-sm">
            {authorizedRatings.length === 0 
              ? "You don't have any pending ratings to review." 
              : "No pending ratings match your search."}
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between transition-all hover:bg-glass-light border border-border/50">
              
              <div className="flex flex-col gap-3 flex-1 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={r.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} customColor={r.team?.color}>
                    {r.team?.name || '—'}
                  </Badge>
                  <span className="text-sm font-medium text-text-primary">
                    ⭐ {r.rating_value} Rating
                  </span>
                  <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded-md border border-border">
                    {r.order_id || 'No Order ID'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(r.date_received).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-semibold text-xs overflow-hidden shrink-0">
                    {r.member?.profile_image ? (
                      <img src={toDriveDirectUrl(r.member.profile_image)} alt={r.member?.name || ''} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = r.member?.name?.charAt(0) || '?'; }} />
                    ) : (r.member?.name?.charAt(0) || '?')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{r.member?.name || 'Unknown'}</p>
                    {r.client_name && <p className="text-xs text-text-muted">Client: {r.client_name}</p>}
                  </div>
                </div>

                {r.review_text && (
                  <p className="text-sm text-text-secondary bg-surface/50 p-3 rounded-lg border border-border/50 italic mt-1">
                    "{r.review_text}"
                  </p>
                )}
                
                {r.screenshot_url && (
                  <div className="mt-1">
                     <a href={r.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">
                        <Image size={13} /> View Screenshot <ExternalLink size={11} />
                      </a>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <button 
                  onClick={() => { setActionId(r.id); setActionType('approved'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                >
                  <Check size={16} /> Approve
                </button>
                <button 
                  onClick={() => { setActionId(r.id); setActionType('rejected'); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-danger/10 text-danger hover:bg-danger hover:text-white transition-all border border-danger/20"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog 
        isOpen={!!actionId} 
        onClose={() => { setActionId(null); setActionType(null); }} 
        onConfirm={handleConfirmAction} 
        title={`Confirm ${actionType === 'approved' ? 'Approval' : 'Rejection'}`} 
        message={`Are you sure you want to ${actionType === 'approved' ? 'approve' : 'reject'} this rating? ${actionType === 'approved' ? 'It will become visible on the public dashboard.' : 'It will be marked as rejected.'}`} 
        confirmText={actionType === 'approved' ? 'Approve Rating' : 'Reject Rating'}
        confirmVariant={actionType === 'approved' ? 'primary' : 'danger'}
        loading={saving} 
      />
    </div>
  );
}
