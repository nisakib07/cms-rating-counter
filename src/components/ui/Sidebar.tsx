'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Star, LogOut, ShieldCheck, Shield, Menu, X, Key, ClipboardCheck, FileText, Settings, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/members', label: 'Members', icon: UserCircle },
  { href: '/admin/ratings', label: 'Ratings', icon: Star },
  { href: '/admin/profiles', label: 'Profiles', icon: Globe },
  { href: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck },
];

const superAdminNavItems = [
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user, isSuperAdmin, memberName } = useAuth();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Star size={12} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-text-primary text-base">StarLedger</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-glass-light text-text-secondary transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 h-screen fixed left-0 top-0 bg-surface border-r border-border flex flex-col z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Star size={14} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-text-primary text-lg">StarLedger</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/15 text-primary-light border border-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-glass-light'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <span className="px-3 text-[9px] text-text-muted uppercase tracking-widest font-bold">Super Admin</span>
              {superAdminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/15 text-primary-light border border-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-glass-light'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2.5 mb-2 bg-glass rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {isSuperAdmin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger uppercase tracking-wider">
                  <ShieldCheck size={10} /> Super Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning uppercase tracking-wider">
                  <Shield size={10} /> Admin
                </span>
              )}
            </div>
            {memberName && <p className="text-sm font-medium text-text-primary truncate">{memberName}</p>}
            <p className="text-xs text-text-muted truncate">{user?.email || 'Admin'}</p>
          </div>
          <Link
            href="/reset-password"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all w-full cursor-pointer"
          >
            <Key size={18} />
            Change Password
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-all w-full cursor-pointer"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
