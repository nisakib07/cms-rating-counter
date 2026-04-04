'use client';

import { useEffect, useState, ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  glowClass?: string;
  delay?: number;
}

export default function StatsCard({ icon, label, value, color, glowClass = '', delay = 0 }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplayValue(0); return; }
    const duration = 1800;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className={`relative glass rounded-2xl p-7 hover:scale-[1.02] transition-all duration-500 group animate-fade-in overflow-hidden ${glowClass}`}>
      {/* Accent gradient top border */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${color}`} />
      
      {/* Background glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-500`}>
            {icon}
          </div>
          <div className="w-16 h-8 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
        </div>
        <div className="text-4xl font-extrabold text-text-primary mb-1.5 tracking-tight tabular-nums">{displayValue.toLocaleString()}</div>
        <div className="text-sm font-medium text-text-muted tracking-wide uppercase">{label}</div>
      </div>
    </div>
  );
}
