'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authRequest, saveSession } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await authRequest(mode === 'login' ? '/login' : '/register', {
        email,
        password,
        name,
      });
      saveSession(payload.data.token, payload.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#07080d] px-4 py-10 text-slate-100 sm:py-16">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1220] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">NutriLens</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">Email and a password. The same reply on reset, whether or not the address is registered.</p>

        {mode === 'register' && (
          <label className="mt-6 block text-sm">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
          </label>
        )}
        <label className="mt-4 block text-sm">
          Email
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm">
          Password
          <input type="password" required minLength={mode === 'login' ? 5 : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
        </label>

        {error && <p className="mt-4 text-sm text-red-200">{error}</p>}

        <button type="submit" disabled={busy} className="mt-6 w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
          {busy ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="mt-5 flex flex-col gap-2 text-sm text-slate-300">
          <button type="button" className="text-left text-emerald-300" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account? Create one' : 'Already registered? Sign in'}
          </button>
          <Link href="/forgot" className="text-emerald-300">Forgot password? Reset with email</Link>
          <Link href="/terms" className="text-slate-400">Terms</Link>
          <Link href="/" className="text-slate-400">Back to the landing page</Link>
        </div>
      </form>
    </main>
  );
}
