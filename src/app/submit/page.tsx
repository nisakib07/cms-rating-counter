'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTeams } from '@/hooks/useTeams';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Star, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { isActualTeam } from '@/lib/utils';
import { useFiverrProfiles } from '@/hooks/useFiverrProfiles';

export default function SubmitRatingPage() {
  const { teams, loading: teamsLoading } = useTeams();
  const { members, loading: membersLoading } = useMembers();
  const { showToast } = useToast();
  const router = useRouter();
  const { profiles } = useFiverrProfiles();

  const [serviceLine, setServiceLine] = useState('');
  const [teamId, setTeamId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [ratingValue, setRatingValue] = useState(5);
  const [orderId, setOrderId] = useState('');
  const [clientName, setClientName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [profileName, setProfileName] = useState('');
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset team and member when service line changes
  useEffect(() => {
    setTeamId('');
    setMemberIds([]);
  }, [serviceLine]);

  // Reset member when team changes
  useEffect(() => {
    setMemberIds([]);
  }, [teamId]);

  const filteredTeams = teams.filter(t => t.service_line === serviceLine && isActualTeam(t));
  const filteredMembers = members.filter(m => m.team_id === teamId && m.is_active !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberIds.length === 0 || !teamId || !orderId || !screenshotUrl) return;

    setSubmitting(true);
    
    try {
      const payloads = memberIds.map(mId => ({
        member_id: mId,
        team_id: teamId,
        rating_value: ratingValue,
        order_id: orderId,
        client_name: clientName || null,
        review_text: reviewText || null,
        screenshot_url: screenshotUrl,
        profile_name: profileName || null,
        date_received: dateReceived,
        status: 'pending'
      }));

      const { error } = await supabase.from('ratings').insert(payloads);
      
      if (error) {
        if (error.code === '23505' || error.message.includes('unique')) {
          showToast('A rating with this Order ID already exists. Duplicate entries are not allowed.', 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        setSubmitted(true);
      }
    } catch (err: any) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative w-full max-w-md glass rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Rating Submitted!</h1>
          <p className="text-text-secondary mb-8">
            Your rating has been submitted successfully and is pending approval from the team leads.
          </p>
          <Button onClick={() => setSubmitted(false)} className="w-full mb-3">Submit Another Rating</Button>
          <Button variant="ghost" onClick={() => router.push('/')} className="w-full">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 sm:p-8">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
      
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all mb-8">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="glass rounded-2xl p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Star size={20} className="text-white" fill="white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Add a Rating</h1>
          </div>
          <p className="text-text-secondary mb-8 pl-13">Submit a new Fiverr rating to your team's tracker.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select 
                label="Service Line" 
                value={serviceLine} 
                onChange={setServiceLine} 
                options={[{value: 'CMS Hub', label: 'CMS Hub'}, {value: 'CMS Endgame', label: 'CMS Endgame'}]} 
                placeholder="Select service line" 
                required 
                id="submit-service" 
              />
              
              <Select 
                label="Team" 
                value={teamId} 
                onChange={setTeamId} 
                options={filteredTeams.map(t => ({value: t.id, label: t.name}))} 
                placeholder={serviceLine ? "Select team" : "Select service line first"} 
                disabled={!serviceLine || teamsLoading}
                required 
                id="submit-team" 
              />
            </div>

            <div className="flex flex-col gap-1.5 min-h-[70px]">
              <label className="text-sm font-medium text-text-secondary">Members<span className="text-red-400 ml-0.5">*</span> <span className="text-text-muted font-normal">(Select all that collaborated)</span></label>
              {!teamId ? (
                <div className="text-sm text-text-muted mt-2">Select a team first to view members.</div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-sm text-text-muted mt-2">No members found in this team.</div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {filteredMembers.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (memberIds.includes(m.id)) {
                          setMemberIds(memberIds.filter(id => id !== m.id));
                        } else {
                          setMemberIds([...memberIds, m.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        memberIds.includes(m.id) 
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Rating<span className="text-red-400 ml-0.5">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={ratingValue}
                  onChange={e => setRatingValue(Number(e.target.value))}
                  placeholder="e.g. 5, 4.7"
                  required
                  id="submit-rating"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
              
              <Input 
                label="Order ID" 
                value={orderId} 
                onChange={setOrderId} 
                placeholder="e.g. FO-XXXXX" 
                required 
                id="submit-order" 
              />
              
              <Input 
                label="Date Received" 
                type="date" 
                value={dateReceived} 
                onChange={setDateReceived} 
                required 
                id="submit-date" 
              />
            </div>

            <Select
              label="Fiverr Profile"
              value={profileName}
              onChange={setProfileName}
              options={profiles.map(p => ({ value: p, label: p }))}
              placeholder="Select Fiverr profile"
              required
              id="submit-profile"
            />

            <Input 
              label="Client Name" 
              value={clientName} 
              onChange={setClientName} 
              placeholder="Fiverr client name" 
              required
              id="submit-client" 
            />
            
            <Textarea 
              label="Review Text" 
              value={reviewText} 
              onChange={setReviewText} 
              placeholder="What did the client say?" 
              required
              id="submit-review" 
            />
            
            <div>
              <Input 
                label="Screenshot URL" 
                value={screenshotUrl} 
                onChange={setScreenshotUrl} 
                placeholder="Only Lightshot link is accepted (https://prnt.sc/...)" 
                required
                id="submit-screenshot" 
              />
            </div>

            <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-white/[0.04]">
              <Button type="button" variant="ghost" onClick={() => router.push('/')}>Cancel</Button>
              <Button type="submit" disabled={submitting || memberIds.length === 0 || !teamId || !orderId || !clientName || !reviewText || !screenshotUrl}>
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
