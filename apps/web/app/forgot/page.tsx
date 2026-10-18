'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authRequest } from '../lib/auth';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await authRequest('/forgot', { email });
      setMessage(payload.data.message);
      setDevCode(payload.data.devCode ?? '');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the reset.');
    } finally {
      setBusy(false);
    }
  };

  const reset = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await authRequest('/reset', { email, code, password });
      setMessage(payload.data.message);
      setSent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#07080d] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1220] p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:tracking-[0.2em]">NutriLens</p>
        <h1 className="mt-3 text-3xl font-bold">Reset with email</h1>
        <p className="mt-2 text-sm text-slate-400">Enter the email on the account. We reply the same way whether or not it is registered.</p>

        {!sent ? (
          <form onSubmit={ask} className="mt-6 space-y-4">
            <label className="block text-sm">
              Email
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Send reset code</button>
          </form>
        ) : (
          <form onSubmit={reset} className="mt-6 space-y-4">
            <label className="block text-sm">
              6-digit code
              <input inputMode="numeric" required value={code} onChange={(event) => setCode(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
            </label>
            <label className="block text-sm">
              New password
              <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">Update password</button>
          </form>
        )}

        {message && <p className="mt-4 text-sm text-emerald-200">{message}</p>}
        {devCode && (
          <p className="mt-3 text-sm text-amber-200">
            No mail server is configured on this machine, so the code is shown here: {devCode}
          </p>
        )}
        {error && <p className="mt-4 text-sm text-red-200">{error}</p>}
        <Link href="/login" className="mt-5 inline-block text-sm text-emerald-300">Back to sign in</Link>
      </div>
    </main>
  );
}
