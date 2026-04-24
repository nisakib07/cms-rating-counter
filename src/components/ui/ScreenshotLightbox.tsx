'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ExternalLink, Star, User, Hash, ZoomIn, ZoomOut, RotateCcw, Link2 } from 'lucide-react';
import { toDriveDirectUrl } from '@/lib/utils';
import type { Rating } from '@/types/database';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';

export interface MemberGroup {
  name: string;
  profileImage: string | null;
  teamName: string;
  teamServiceLine: string;
  teamColor?: string;
}

interface ScreenshotLightboxProps {
  ratings: Rating[];
  initialIndex: number;
  onClose: () => void;
  memberGroups?: MemberGroup[][];  // per-index array of collaborating members
}

export default function ScreenshotLightbox({ ratings, initialIndex, onClose, memberGroups }: ScreenshotLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  const rating = ratings[index];
  const screenshotSrc = rating?.screenshot_url ? toDriveDirectUrl(rating.screenshot_url) : null;
  const currentMembers = memberGroups?.[index];

  const goNext = useCallback(() => {
    setZoom(1);
    setImgLoaded(false);
    setIndex(i => (i + 1) % ratings.length);
  }, [ratings.length]);

  const goPrev = useCallback(() => {
    setZoom(1);
    setImgLoaded(false);
    setIndex(i => (i - 1 + ratings.length) % ratings.length);
  }, [ratings.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, z + 0.25));
      if (e.key === '-') setZoom(z => Math.max(0.5, z - 0.25));
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!rating) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in" style={{ animationDuration: '0.2s' }} />

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
      >
        <X size={20} />
      </button>

      {/* Navigation arrows */}
      {ratings.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Main content area */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full" onClick={e => e.stopPropagation()}>
        {/* Image area */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-hidden min-h-0">
          {screenshotSrc ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                </div>
              )}
              <img
                src={screenshotSrc}
                alt="Rating screenshot"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-300 cursor-zoom-in select-none"
                style={{ transform: `scale(${zoom})`, opacity: imgLoaded ? 1 : 0 }}
                onLoad={() => setImgLoaded(true)}
                onClick={e => { e.stopPropagation(); setZoom(z => z === 1 ? 2 : 1); }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="text-white/30 text-center">
              <p className="text-lg">No screenshot available</p>
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <div
          className="lg:w-80 xl:w-96 bg-black/40 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/[0.08] p-6 flex flex-col gap-5 overflow-y-auto shrink-0"
          onClick={e => e.stopPropagation()}
        >
          {/* Rating stars */}
          <div className="flex items-center gap-1.5">
            <StarRating rating={rating.rating_value} size={20} />
            <span className="text-white font-semibold text-lg">{rating.rating_value}</span>
            <span className="text-white/40 text-sm ml-2">{rating.rating_value}-star rating</span>
          </div>

          {/* Member info */}
          {currentMembers && currentMembers.length > 1 ? (
            /* Shared order — show all collaborators */
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Link2 size={12} className="text-primary-light" />
                <span className="text-[10px] font-semibold text-primary-light uppercase tracking-wider">Shared Order · {currentMembers.length} Members</span>
              </div>
              {currentMembers.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-white/10">
                    {m.profileImage ? (
                      <img src={toDriveDirectUrl(m.profileImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{m.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={m.teamServiceLine === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={m.teamColor}>
                        {m.teamName}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single member */
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/40 to-secondary/40 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-white/10">
                {rating.member?.profile_image ? (
                  <img src={toDriveDirectUrl(rating.member.profile_image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{rating.member?.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{rating.member?.name || 'Unknown'}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={rating.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={rating.team?.color}>
                    {rating.team?.name}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Review text */}
          {rating.review_text && (
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-sm text-white/80 italic leading-relaxed">&ldquo;{rating.review_text}&rdquo;</p>
            </div>
          )}

          {/* Meta details */}
          <div className="flex flex-col gap-3 text-sm">
            {rating.order_id && (
              <div className="flex items-center gap-2 text-white/60">
                <Hash size={14} className="text-white/40" />
                <span className="font-mono">{rating.order_id}</span>
              </div>
            )}
            {rating.client_name && (
              <div className="flex items-center gap-2 text-white/60">
                <User size={14} className="text-white/40" />
                <span>{rating.client_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-white/40 text-xs">📅</span>
              <span>{new Date(rating.date_received).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* External link */}
          {rating.screenshot_url && (
            <a
              href={rating.screenshot_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/70 hover:text-white text-sm font-medium transition-all mt-auto"
            >
              <ExternalLink size={14} /> Open original
            </a>
          )}

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/[0.06]">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-white/40 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ZoomIn size={14} />
            </button>
            <button onClick={() => setZoom(1)} className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-all ml-1">
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Pagination indicator */}
          {ratings.length > 1 && (
            <div className="text-center text-xs text-white/30">
              {index + 1} of {ratings.length}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
