'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/lib/stores/authStore';
import { Loader } from '@/components/ui/Loader';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, profile, refreshAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const reason = searchParams.get('reason');
  const sessionExpired = reason === 'session_expired';


 
  useEffect(() => {
    if (!isLoading && user) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        router.push(returnTo);
        return;
      }

      if (profile?.role === 'admin') {
        router.push('/');
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, profile, router, searchParams]);

  const performSignIn = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403 && result.unverified) {
          setUnverifiedEmail(email);
          throw new Error(result.error || 'Please verify your email address.');
        }
        throw new Error(result.error || 'Sign in failed');
      }

      useAuthStore.getState().setUser(result.user);
      useAuthStore.getState().setProfile(result.user);

      refreshAuth();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setResendStatus('sending');
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendStatus('sent');
      setResendMessage(data.message || 'Verification email sent!');
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err.message || 'An error occurred');
    }
  };

  // Populate form with query params if provided (user will click sign in button to trigger API)
  useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');

    if (email && password) {
      setForm(prev => ({
        ...prev,
        email: decodeURIComponent(email),
        password: decodeURIComponent(password),
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
    setUnverifiedEmail(null);
    setResendStatus('idle');
    setResendMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSignIn(form.email, form.password);
  };



  if (user || isLoading) {
    return <Loader fullScreen />;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-rare-background">
        <Section background="gradient-soft" padding="lg" withTexture>
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <h1 className="text-3xl font-bold text-rare-primary mb-2">Sign In</h1>
              <p className="text-rare-text-light mb-6 text-sm">
                Enter your email and password to sign in!
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session-expired notice */}
              {sessionExpired && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <p className="font-semibold mb-0.5">Your session has expired</p>
                  <p className="text-amber-700 font-normal">Please sign in again to continue where you left off.</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
                  {error}
                  {unverifiedEmail && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="text-red-800 underline hover:text-red-900 font-medium"
                        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                      >
                        {resendStatus === 'sending' ? 'Sending...' : resendStatus === 'sent' ? 'Email Sent!' : 'Resend Verification Email'}
                      </button>
                      {resendMessage && (
                        <p className={`mt-1 text-xs ${resendStatus === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                          {resendMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="mail@example.com"
                  fullWidth
                />

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-body font-medium text-rare-text">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 border border-rare-border rounded-lg font-body text-rare-text placeholder:text-rare-text-light/50 focus:outline-none focus:ring-2 focus:ring-rare-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-rare-text-light hover:text-rare-primary transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <RiEyeCloseLine size={20} /> : <MdOutlineRemoveRedEye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center text-rare-text cursor-pointer group">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={handleChange}
                      className="h-4 w-4 text-rare-primary rounded border-rare-border focus:ring-rare-primary mr-2 cursor-pointer"
                    />
                    <span className="group-hover:text-rare-primary transition-colors">Keep me logged in</span>
                  </label>
                  <Link href="/forgot-password" title="Forgot Password" className="text-rare-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  fullWidth
                  className="py-4 shadow-md hover:shadow-lg transform transition-all active:scale-[0.98]"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 text-center space-y-4">
                <p className="text-sm text-rare-text-light">
                  Not registered yet?
                </p>
                <Button
                  href="/signup"
                  variant="outline"
                  fullWidth
                  className="py-3"
                >
                  Create an Account
                </Button>
              </div>
            </div>
          </div>
        </Section >
      </main >
      <Footer />
    </>
  );
}

function AuthSkeleton() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-rare-background">
        <Section background="gradient-soft" padding="lg" withTexture>
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
              {/* Header Skeleton */}
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-8" />

              {/* Form Skeleton */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>

                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>

                <Skeleton className="h-14 w-full rounded-lg" />
              </div>

              {/* Footer Links Skeleton */}
              <div className="mt-8 text-center space-y-4">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

export default function SignInPage() {
  return (
    <>
      <Suspense fallback={<AuthSkeleton />}>
        <SignInForm />
      </Suspense>
    </>
  );
}
