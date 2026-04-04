'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Keyboard, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const { login, register } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setLoading(false);
      setTab(defaultTab);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, defaultTab]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(loginEmail.trim(), loginPassword);
      setSuccess('Signed in! Closing...');
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (regUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(regUsername.trim(), regEmail.trim(), regPassword);
      setSuccess('Account created! Closing...');
      setTimeout(onClose, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-bg-secondary border border-white/8 rounded-2xl shadow-2xl shadow-black/60 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-accent" />
            </div>
            <span className="font-mono font-semibold text-text-primary tracking-tight">
              type<span className="text-accent">craft</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-5 pb-0 border-b border-white/5">
          <TabButton active={tab === 'login'} onClick={() => { setTab('login'); setError(''); }}>
            Sign In
          </TabButton>
          <TabButton active={tab === 'register'} onClick={() => { setTab('register'); setError(''); }}>
            Register
          </TabButton>
        </div>

        {/* Form */}
        <div className="p-6">
          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-text-error bg-text-error/10 rounded-xl px-3 py-2.5 mb-4 border border-text-error/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-text-success bg-text-success/10 rounded-xl px-3 py-2.5 mb-4 border border-text-success/20">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Field label="Email">
                <input
                  ref={firstInputRef}
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  disabled={loading}
                  autoComplete="email"
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn(inputClass, 'pr-10')}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <SubmitButton loading={loading}>Sign In</SubmitButton>

              <p className="text-center text-xs text-text-tertiary pt-1">
                No account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(''); }}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <Field label="Username">
                <input
                  ref={firstInputRef}
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="swift_typist"
                  className={inputClass}
                  disabled={loading}
                  autoComplete="username"
                  maxLength={20}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  disabled={loading}
                  autoComplete="email"
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={cn(inputClass, 'pr-10')}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <SubmitButton loading={loading}>Create Account</SubmitButton>

              <p className="text-center text-xs text-text-tertiary pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(''); }}
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Guest mode notice */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-text-tertiary">
            You can also{' '}
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
              continue as guest
            </button>{' '}
            — no signup required.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-surface border border-white/5 rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-mono';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px',
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-text-secondary hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 mt-1 bg-accent text-bg font-semibold text-sm rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-accent/20"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}
