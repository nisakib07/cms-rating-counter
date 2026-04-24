'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Quote, ChevronLeft, ChevronRight, Link2 } from 'lucide-react';
import type { Rating } from '@/types/database';
import StarRating from '@/components/ui/StarRating';
import { toDriveDirectUrl, getNickname } from '@/lib/utils';

interface ReviewsCarouselProps {
  ratings: Rating[];
}

interface GroupedReview {
  key: string;
  rating_value: number;
  review_text: string;
  client_name: string;
  date_received: string;
  members: { name: string; profileImage: string | null }[];
  isShared: boolean;
}

export default function ReviewsCarousel({ ratings }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Only show ratings that have review text
  const reviews = ratings.filter(r => r.review_text && r.review_text.trim().length > 10);

  // Group reviews by order_id so shared projects appear as a single card
  const groupedReviews: GroupedReview[] = useMemo(() => {
    const orderMap = new Map<string, Rating[]>();
    const standalone: Rating[] = [];

    for (const r of reviews) {
      if (r.order_id && r.order_id.trim()) {
        const key = r.order_id.trim();
        if (!orderMap.has(key)) orderMap.set(key, []);
        orderMap.get(key)!.push(r);
      } else {
        standalone.push(r);
      }
    }

    const groups: GroupedReview[] = [];

    // Add grouped entries
    for (const [orderId, rats] of orderMap.entries()) {
      const primary = rats[0];
      groups.push({
        key: `order-${orderId}`,
        rating_value: primary.rating_value,
        review_text: primary.review_text!,
        client_name: primary.client_name || 'Anonymous Client',
        date_received: primary.date_received,
        members: rats.map(r => ({
          name: r.member?.name || 'Unknown',
          profileImage: r.member?.profile_image || null,
        })),
        isShared: rats.length > 1,
      });
    }

    // Add standalone entries
    for (const r of standalone) {
      groups.push({
        key: r.id,
        rating_value: r.rating_value,
        review_text: r.review_text!,
        client_name: r.client_name || 'Anonymous Client',
        date_received: r.date_received,
        members: [{
          name: r.member?.name || 'Unknown',
          profileImage: r.member?.profile_image || null,
        }],
        isShared: false,
      });
    }

    // Sort by most recent date
    groups.sort((a, b) => b.date_received.localeCompare(a.date_received));

    return groups;
  }, [reviews]);

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
  }, [groupedReviews.length]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (groupedReviews.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-7 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary/50 via-primary/30 to-warning/30" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
            <Quote size={18} className="text-secondary" />
          </div>
          Client Reviews
          <span className="text-xs font-normal text-text-muted ml-1">({groupedReviews.length})</span>
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
        {groupedReviews.map((review, i) => (
          <div
            key={review.key}
            className="flex-shrink-0 w-[320px] p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 flex flex-col gap-3"
            style={{ scrollSnapAlign: 'start', animationDelay: `${i * 80}ms` }}
          >
            {/* Stars + Shared badge */}
            <div className="flex items-center justify-between">
              <StarRating rating={review.rating_value} size={12} showText={true} />
              {review.isShared && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-sm shadow-violet-500/30 border border-white/20">
                  <Link2 size={9} className="text-white" />
                  <span className="text-[9px] font-bold text-white tracking-wide uppercase">Collab</span>
                </div>
              )}
            </div>

            {/* Review text */}
            <p className="text-sm text-text-secondary leading-relaxed italic line-clamp-4">
              &ldquo;{review.review_text}&rdquo;
            </p>

            {/* Attribution */}
            <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.04]">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary">{review.client_name}</div>
                {review.isShared ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    {/* Avatar stack */}
                    <div className="flex items-center -space-x-1.5">
                      {review.members.map((m, idx) => (
                        <div
                          key={idx}
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-[8px] font-bold text-primary-light border border-surface overflow-hidden shrink-0"
                          style={{ zIndex: review.members.length - idx }}
                          title={m.name}
                        >
                          {m.profileImage ? (
                            <img
                              src={toDriveDirectUrl(m.profileImage)}
                              alt={m.name}
                              className="w-full h-full object-cover"
                              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.textContent = m.name.charAt(0); }}
                            />
                          ) : m.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-text-muted truncate">
                      {review.members.map(m => getNickname(m.name)).join(' & ')}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-text-muted">to {review.members[0].name}</div>
                )}
              </div>
              <div className="text-[10px] text-text-muted shrink-0">
                {new Date(review.date_received).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
