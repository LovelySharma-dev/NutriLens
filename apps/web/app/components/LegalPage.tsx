import type { ReactNode } from 'react';
import Link from 'next/link';

export default function LegalPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-[#07080d] text-slate-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <Link href="/" className="font-bold text-white">NutriLens</Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/copyright" className="hover:text-white">Copyright</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
        </div>
      </header>
      <article className="legal-copy mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:tracking-[0.2em]">{kicker}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        {children}
      </article>
    </main>
  );
}
