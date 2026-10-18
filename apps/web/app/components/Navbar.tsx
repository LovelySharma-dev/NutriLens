'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Leaf, Menu, Scan, X } from 'lucide-react';
import gsap from 'gsap';
import { cachedUser, type SessionUser } from '../lib/auth';
import { usePreferences } from './PreferencesProvider';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const { t, reduceMotion } = usePreferences();

  useEffect(() => {
    if (!reduceMotion) {
      gsap.fromTo(
        '#main-nav',
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
      );
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    const closeOnDesktop = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };

    setUser(cachedUser());
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', closeOnDesktop);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [reduceMotion]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const linkClass = 'rounded-2xl px-4 py-3 text-left text-base font-medium text-slate-200 hover:bg-white/5 hover:text-emerald-300';

  return (
    <header
      id="main-nav"
      className="safe-top fixed inset-x-0 top-0 z-40 flex justify-center px-3 pointer-events-none sm:top-5 sm:px-4"
    >
      <div className="pointer-events-auto w-full max-w-5xl">
        <nav
          className={`flex items-center justify-between gap-2 rounded-full border px-3 py-2.5 transition-all duration-300 sm:gap-4 sm:px-6 sm:py-3 ${
            isScrolled || menuOpen
              ? 'border-emerald-500/20 bg-[#0d0e17]/90 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl'
              : 'border-white/10 bg-[#0d0e17]/40 backdrop-blur-md'
          }`}
        >
          <a
            href="#"
            className="flex min-w-0 items-center gap-2 text-white transition-opacity hover:opacity-90 sm:gap-3"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 transition-colors group-hover:border-emerald-400/60">
              <Eye className="absolute h-5 w-5 text-emerald-400" />
              <Leaf className="absolute bottom-1 right-1 h-3 w-3 text-lime-400" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                NutriLens
              </div>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-emerald-400/80 sm:block">
                Food Label Intelligence
              </span>
            </div>
          </a>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex lg:gap-8">
            <button type="button" onClick={() => scrollToSection('problem')} className="hover:text-emerald-400">
              How It Works
            </button>
            <button type="button" onClick={() => scrollToSection('studio')} className="hover:text-emerald-400">
              {t('studio')}
            </button>
            <button type="button" onClick={() => scrollToSection('intelligence')} className="hover:text-emerald-400">
              Intelligence
            </button>
            <button type="button" onClick={() => scrollToSection('trust')} className="hover:text-emerald-400">
              Trust & Evidence
            </button>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={user ? '/dashboard' : '/login'}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
            >
              {user ? 'Account' : 'Sign in'}
            </a>
            <button
              type="button"
              onClick={() => scrollToSection('scan')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-5 py-2 text-xs font-semibold tracking-wide text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Scan className="h-4 w-4 text-slate-950" />
              <span>{t('scan')}</span>
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
        </nav>

        {menuOpen && (
          <div
            id="mobile-nav"
            className="mt-2 flex max-h-[calc(100svh-6rem)] flex-col gap-1 overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0e17]/95 p-3 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <button type="button" className={linkClass} onClick={() => scrollToSection('problem')}>How It Works</button>
            <button type="button" className={linkClass} onClick={() => scrollToSection('studio')}>{t('studio')}</button>
            <button type="button" className={linkClass} onClick={() => scrollToSection('intelligence')}>Intelligence</button>
            <button type="button" className={linkClass} onClick={() => scrollToSection('trust')}>Trust & Evidence</button>
            <a
              href={user ? '/dashboard' : '/login'}
              className={linkClass}
            >
              {user ? 'Account' : 'Sign in'}
            </a>
            <button
              type="button"
              onClick={() => scrollToSection('scan')}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              <Scan className="h-4 w-4" />
              {t('scan')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
