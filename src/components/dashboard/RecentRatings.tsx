'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, Clock, ExternalLink, FileText, Quote, User, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Rating } from '@/types/database';
import Badge from '@/components/ui/Badge';
import { toDriveDirectUrl } from '@/lib/utils';
import ScreenshotLightbox from '@/components/ui/ScreenshotLightbox';

interface RecentRatingsProps {
  ratings: Rating[];
}

function RatingCard({ rating, index, onOpenLightbox }: { rating: Rating; index: number; onOpenLightbox: () => void }) {
  const [imgError, setImgError] = useState(false);
  const screenshotSrc = rating.screenshot_url ? toDriveDirectUrl(rating.screenshot_url) : null;
  const profileSrc = rating.member?.profile_image ? toDriveDirectUrl(rating.member.profile_image) : null;

  return (
    <div
      className="group flex-shrink-0 w-[340px] glass rounded-2xl overflow-hidden border border-white/[0.04] hover:border-white/[0.12] transition-all duration-500 animate-fade-in flex flex-col card-hover"
      style={{ animationDelay: `${index * 80}ms`, scrollSnapAlign: 'start' }}
    >
      {/* Screenshot Hero */}
      <div className="relative w-full aspect-[16/10] bg-surface overflow-hidden cursor-pointer" onClick={onOpenLightbox}>
        {screenshotSrc && !imgError ? (
          <img
            src={screenshotSrc}
            alt="Rating proof"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <FileText size={32} className="text-text-muted/30" />
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Service line badge - top right */}
        <div className="absolute top-3 right-3">
          <Badge variant={rating.team?.service_line === 'CMS Hub' ? 'cms-hub' : 'cms-endgame'} size="sm" customColor={rating.team?.color}>
            {rating.team?.service_line === 'CMS Hub' ? 'Hub' : 'Endgame'}
          </Badge>
        </div>

        {/* Stars - bottom left over gradient */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <Star size={14} className="text-warning drop-shadow-lg" fill="#f59e0b" />
          <span className="text-xs font-bold text-warning drop-shadow-lg">{rating.rating_value}</span>
        </div>

        {/* External link on hover - bottom right */}
        {rating.screenshot_url && (
          <a
            href={rating.screenshot_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Member info row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary-light font-bold text-xs shrink-0 border border-primary/10 overflow-hidden">
            {profileSrc ? (
              <img
                src={profileSrc}
                alt={rating.member?.name || ''}
                className="w-full h-full object-cover"
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = rating.member?.name?.charAt(0) || '?'; }}
              />
            ) : (
              <span>{rating.member?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{rating.member?.name || 'Unknown'}</p>
            <p className="text-xs text-text-muted truncate">{rating.team?.name}</p>
          </div>
          <span className="text-[10px] text-text-muted whitespace-nowrap">
            {new Date(rating.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Review text */}
        {rating.review_text && (
          <div className="relative pl-3 border-l-2 border-primary/20">
            <Quote size={10} className="absolute -left-[7px] -top-0.5 text-primary/40 bg-surface rounded-full p-[1px]" />
            <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 italic">
              &ldquo;{rating.review_text}&rdquo;
            </p>
          </div>
        )}

        {/* Footer meta */}
        <div className="mt-auto flex items-center gap-3 pt-2 border-t border-white/[0.04]">
          {rating.order_id && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Hash size={10} className="text-text-muted/60" />
              <span className="font-mono">{rating.order_id}</span>
            </div>
          )}
          {rating.client_name && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted ml-auto">
              <User size={10} className="text-text-muted/60" />
              <span className="truncate max-w-[100px]">{rating.client_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecentRatings({ ratings }: RecentRatingsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    return () => { if (el) el.removeEventListener('scroll', checkScroll); };
  }, [ratings.length]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in delay-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-warning/50 via-primary/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center">
            <Clock size={18} className="text-warning" />
          </div>
          Recent Ratings
          {ratings.length > 0 && (
            <span className="text-xs font-normal text-text-muted ml-1">({ratings.length})</span>
          )}
        </h3>

        {/* Scroll controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-text-muted hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] text-text-muted hover:text-text-primary hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      {ratings.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {ratings.map((rating, i) => (
            <RatingCard key={rating.id} rating={rating} index={i} onOpenLightbox={() => setLightboxIndex(i)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center">
            <Star size={28} className="text-text-muted/20" />
          </div>
          <p className="text-sm font-medium">No ratings recorded yet</p>
          <p className="text-xs text-text-muted/60">Add ratings from the admin panel to see them here</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ScreenshotLightbox
          ratings={ratings}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
