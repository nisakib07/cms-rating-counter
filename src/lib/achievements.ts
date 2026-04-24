import type { Rating } from '@/types/database';

// Achievement definitions
export interface Achievement {
  id: string;
  label: string;
  description: string;
  emoji: string;
  threshold: number;
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_star', label: 'First Star', description: 'Received your first 5-star rating', emoji: '⭐', threshold: 1, color: 'from-yellow-500 to-amber-500' },
  { id: 'rising_star', label: 'Rising Star', description: 'Earned 5 five-star ratings', emoji: '🌟', threshold: 5, color: 'from-orange-400 to-amber-400' },
  { id: 'ten_club', label: 'Ten Club', description: 'Reached 10 five-star ratings', emoji: '🔟', threshold: 10, color: 'from-blue-400 to-cyan-400' },
  { id: 'quarter_century', label: 'Quarter Century', description: '25 five-star ratings earned', emoji: '🏅', threshold: 25, color: 'from-emerald-400 to-green-400' },
  { id: 'half_century', label: 'Half Century', description: '50 five-star ratings', emoji: '🏆', threshold: 50, color: 'from-violet-500 to-purple-500' },
  { id: 'century', label: 'Century Star', description: 'An incredible 100 five-star ratings', emoji: '💯', threshold: 100, color: 'from-rose-500 to-pink-500' },
];

export const MILESTONE_THRESHOLDS = [10, 25, 50, 100];

/**
 * Get all unlocked achievements for a given 5-star count.
 */
export function getUnlockedAchievements(fiveStarCount: number): Achievement[] {
  return ACHIEVEMENTS.filter(a => fiveStarCount >= a.threshold);
}

/**
 * Get the next achievement to unlock.
 */
export function getNextAchievement(fiveStarCount: number): Achievement | null {
  return ACHIEVEMENTS.find(a => fiveStarCount < a.threshold) || null;
}

/**
 * Calculate the current weekly streak.
 * A streak counts consecutive weeks that have at least one 5-star rating.
 */
export function getWeeklyStreak(ratings: Rating[]): number {
  if (ratings.length === 0) return 0;

  const fiveStars = ratings
    .filter(r => r.rating_value === 5)
    .map(r => new Date(r.date_received));

  if (fiveStars.length === 0) return 0;

  // Get ISO week number for a date
  const getWeekKey = (d: Date) => {
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = d.getTime() - start.getTime() + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
    const weekNo = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  };

  // Collect unique weeks with ratings
  const weeks = new Set(fiveStars.map(getWeekKey));
  
  // Count back from current week
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 52; i++) {
    const d = new Date(now.getTime() - i * 7 * 86400000);
    const key = getWeekKey(d);
    if (weeks.has(key)) {
      streak++;
    } else if (i > 0) {
      // Allow current week to be empty (it's not over yet)
      break;
    }
  }

  return streak;
}

/**
 * Build heatmap data: day-level rating counts for the last N months.
 */
export function buildHeatmapData(ratings: Rating[], months: number = 6): Map<string, number> {
  const counts = new Map<string, number>();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  for (const r of ratings) {
    const date = r.date_received.split('T')[0]; // YYYY-MM-DD
    if (date >= cutoff.toISOString().split('T')[0]) {
      counts.set(date, (counts.get(date) || 0) + 1);
    }
  }

  return counts;
}
