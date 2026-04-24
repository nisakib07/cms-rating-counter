'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Global keyboard shortcuts for the dashboard.
 * N → /submit, L → /leaderboard, / → focus search
 * Only fires when no input/textarea is focused.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          router.push('/submit');
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          router.push('/leaderboard');
          break;
        case '/':
          e.preventDefault();
          // Focus the global search input
          const searchInput = document.querySelector<HTMLInputElement>('[data-global-search]');
          if (searchInput) searchInput.focus();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
}
