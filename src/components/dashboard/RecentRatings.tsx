'use client';

import { useState } from 'react';
import { Star, Clock, ChevronDown, ExternalLink, FileText } from 'lucide-react';
import type { Rating } from '@/types/database';
import Badge from '@/components/ui/Badge';
import { toDriveDirectUrl } from '@/lib/utils';

interface RecentRatingsProps {
  ratings: Rating[];
}

export default function RecentRatings({ ratings }: RecentRatingsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-warning/50 via-primary/30 to-transparent" />
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
          <Clock size={18} className="text-warning" />
        </div>
        Recent Ratings
      </h3>

      {ratings.length > 0 ? (
        <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-2">
          {ratings.map((rating, i) => {
            const isExpanded = expandedId === rating.id;
            const hasDetails = rating.review_text || rating.order_id || rating.screenshot_url;
            return (
              <div
                key={rating.id}
                className={`rounded-xl border transition-all duration-300 animate-fade-in ${isExpanded ? 'bg-white/[0.04] border-white/[0.1]' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Main row */}
                <div
                  className={`flex items-center gap-4 p-4 ${hasDetails ? 'cursor-pointer' : ''}`}
                  onClick={() => hasDetails && toggle(rating.id)}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold text-sm shrink-0 border border-primary/10 overflow-hidden">
                    {rating.member?.profile_image ? (
                      <img src={toDriveDirectUrl(rating.member.profile_image)} alt={rating.member?.name || ''} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = rating.member?.name?.charAt(0) || '?'; }} />
                    ) : (rating.member?.name?.charAt(0) || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-text-primary truncate">{rating.member?.name || 'Unknown'}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rating.rating_value }).map((_, j) => (
                          <Star key={j} size={11} className="text-warning" fill="#f59e0b" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted truncate">{rating.team?.name}</span>
                      {rating.client_name && (
                        <>
                          <span className="text-text-muted/30">•</span>
                          <span className="text-xs text-text-muted">{rating.client_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={rating.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm">
                      {rating.team?.service_line === 'CMS Hub' ? 'Hub' : 'Endgame'}
                    </Badge>
                    <span className="text-[10px] text-text-muted">{new Date(rating.date_received).toLocaleDateString()}</span>
                  </div>
                  {hasDetails && (
                    <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/[0.04] mt-0">
                    <div className="pt-3 flex flex-col gap-2.5">
                      {rating.order_id && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-text-muted">Order ID:</span>
                          <span className="text-text-primary font-mono bg-white/[0.04] px-2 py-0.5 rounded">{rating.order_id}</span>
                        </div>
                      )}
                      {rating.review_text && (
                        <div className="flex items-start gap-2 text-xs">
                          <FileText size={12} className="text-text-muted mt-0.5 shrink-0" />
                          <p className="text-text-secondary leading-relaxed">{rating.review_text}</p>
                        </div>
                      )}
                      {rating.screenshot_url && (
                        <div className="flex items-center gap-3 mt-1">
                          <img
                            src={toDriveDirectUrl(rating.screenshot_url)}
                            alt="Rating screenshot"
                            className="w-20 h-14 rounded-lg object-cover border border-border bg-surface"
                            onError={e => (e.currentTarget.style.display = 'none')}
                          />
                          <a
                            href={rating.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-light hover:underline flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink size={10} /> View full screenshot
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
          <Star size={32} className="text-text-muted/20" />
          <p className="text-sm">No ratings recorded yet</p>
          <p className="text-xs text-text-muted/60">Add ratings from the admin panel to see them here</p>
        </div>
      )}
    </div>
  );
}
