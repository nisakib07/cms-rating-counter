'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword, session } = useAuth();
  const router = useRouter();

  // Redirect if not signed in via the recovery link
  useEffect(() => {
    // We delay this slightly to allow Supabase to establish the session from the URL hash
    const timeout = setTimeout(() => {
      if (!session) {
        // Uncomment below in production if you want strictly token-linked visits
        // router.push('/login');
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);
    
    if (updateError) {
      setError(updateError);
    } else {
      // Password updated successfully, go to admin dashboard
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="fixed top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/3 right-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Star size={24} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-2xl text-text-primary">StarLedger</span>
        </div>

        <div className="glass-light rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-1">Create New Password</h1>
            <p className="text-sm text-text-muted">Enter a new secure password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center mt-2">
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
