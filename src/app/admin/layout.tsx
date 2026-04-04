'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/ui/Sidebar';
import { ShieldX } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin, accessLevel, user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-text-muted">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // User is logged in but doesn't have admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-light rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-danger/15 flex items-center justify-center mx-auto mb-5">
            <ShieldX size={32} className="text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-text-muted mb-1">
            Signed in as <span className="text-text-secondary font-medium">{user?.email}</span>
          </p>
          <p className="text-sm text-text-muted mb-6">
            {accessLevel === 'member'
              ? 'Your role does not have admin panel access. Contact an Operations Manager to upgrade your role.'
              : 'Your email is not registered as a team member. Ask an admin to add you to a team with an admin role.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => router.push('/')}>Back to Dashboard</Button>
            <Button variant="danger" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
