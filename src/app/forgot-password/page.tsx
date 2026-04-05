'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="fixed top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/3 right-1/3 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Star size={24} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-2xl text-text-primary">StarLedger</span>
        </div>

        {/* Card */}
        <div className="glass-light rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
              <p className="text-sm text-text-muted mb-8">
                We have sent a password reset link to <span className="font-medium text-text-primary">{email}</span>. 
                Please check your inbox (and spam folder) to continue.
              </p>
              <Link href="/login" className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-semibold bg-white/[0.04] text-text-primary border border-white/[0.06] hover:bg-white/[0.08] transition-all cursor-pointer">
                <ArrowLeft size={18} />
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-text-primary mb-1">Reset Password</h1>
                <p className="text-sm text-text-muted">Enter your email and we'll send you a recovery link</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@starledger.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-text-muted/50"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl animate-shake">
                    {error}
                  </div>
                )}

                <Button type="submit" variant="primary" loading={loading} className="w-full justify-center">
                  Send Recovery Link
                </Button>
                
                <div className="text-center mt-2">
                  <Link href="/login" className="text-sm text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1">
                    <ArrowLeft size={14} /> Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
