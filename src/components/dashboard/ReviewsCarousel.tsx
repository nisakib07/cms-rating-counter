'use client';

import { useRef, useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Rating } from '@/types/database';

interface ReviewsCarouselProps {
  ratings: Rating[];
}

export default function ReviewsCarousel({ ratings }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Only show ratings that have review text
  const reviews = ratings.filter(r => r.review_text && r.review_text.trim().length > 10);

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
  }, [reviews.length]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (reviews.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary/50 via-primary/30 to-warning/30" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
            <Quote size={18} className="text-secondary" />
          </div>
          Client Reviews
          <span className="text-xs font-normal text-text-muted ml-1">({reviews.length})</span>
        </h3>
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

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {reviews.map((r, i) => (
          <div
            key={r.id}
            className="flex-shrink-0 w-[320px] p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 flex flex-col gap-3"
            style={{ scrollSnapAlign: 'start', animationDelay: `${i * 80}ms` }}
          >
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={12} className="text-warning" fill="#f59e0b" />
              ))}
              <span className="text-xs font-bold text-warning ml-1.5">{r.rating_value}</span>
            </div>

            {/* Review text */}
            <p className="text-sm text-text-secondary leading-relaxed italic line-clamp-4">
              &ldquo;{r.review_text}&rdquo;
            </p>

            {/* Attribution */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div>
                <div className="text-xs font-semibold text-text-primary">{r.client_name || 'Anonymous Client'}</div>
                <div className="text-[10px] text-text-muted">to {r.member?.name}</div>
              </div>
              <div className="text-[10px] text-text-muted">
                {new Date(r.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
