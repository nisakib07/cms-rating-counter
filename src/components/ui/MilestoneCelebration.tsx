'use client';

import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { MILESTONE_THRESHOLDS } from '@/lib/achievements';

interface MilestoneCelebrationProps {
  memberName: string;
  count: number;
  onClose: () => void;
}

export default function MilestoneCelebration({ memberName, count, onClose }: MilestoneCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const milestone = MILESTONE_THRESHOLDS.filter(t => count >= t).pop();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!milestone) return null;

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
              background: ['#f59e0b', '#10b981', '#7c3aed', '#ef4444', '#3b82f6', '#ec4899'][i % 6],
              animation: `confetti-fall ${2 + Math.random() * 3}s ${Math.random() * 2}s ease-in forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative z-10 glass-light rounded-3xl p-10 max-w-md text-center shadow-2xl transform transition-all duration-700 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-text-muted hover:text-text-primary transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-extrabold text-text-primary mb-2">
          Milestone Reached!
        </h2>
        <p className="text-lg text-text-secondary mb-4">
          <span className="font-bold text-primary-light">{memberName}</span> just hit
        </p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-warning to-orange-400 text-white font-extrabold text-4xl shadow-xl shadow-warning/30 mb-4">
          {milestone}
          <Star size={32} fill="white" />
        </div>
        <p className="text-base text-text-secondary">
          five-star ratings! Incredible work! 🚀
        </p>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
