import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function StarRating({ rating, maxStars = 5, size = 14, className, showText = false }: StarRatingProps) {
  // Handle edge cases like rating > maxStars or negative ratings
  const safeRating = Math.max(0, Math.min(rating, maxStars));
  const fullStars = Math.floor(safeRating);
  const decimalPart = safeRating - fullStars;

  return (
    <div className={`flex items-center gap-0.5 ${className || ''}`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        if (i < fullStars) {
          // Full star
          return <Star key={i} size={size} className="text-warning shrink-0" fill="#f59e0b" />;
        } else if (i === fullStars && decimalPart > 0) {
          // Partial star
          const percent = `${(decimalPart * 100).toFixed(0)}%`;
          return (
            <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
              {/* Empty background star */}
              <Star size={size} className="text-warning/20 absolute inset-0" fill="currentColor" />
              {/* Filled foreground star */}
              <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: percent }}>
                <Star size={size} className="text-warning" fill="#f59e0b" />
              </div>
            </div>
          );
        } else {
          // Empty star
          return <Star key={i} size={size} className="text-warning/20 shrink-0" fill="currentColor" />;
        }
      })}
      {showText && (
        <span className="text-xs font-bold text-warning ml-1 drop-shadow-sm">{rating.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
      )}
    </div>
  );
}
