'use client';

import React, { useEffect, useState } from 'react';
import { Eye, Leaf, Scan } from 'lucide-react';
import gsap from 'gsap';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // GSAP entrance animation for navbar
    gsap.fromTo(
      '#main-nav',
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
    );

    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-nav"
      className="fixed top-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <nav
        className={`pointer-events-auto flex items-center justify-between gap-6 px-6 py-3 rounded-full border transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0d0e17]/90 backdrop-blur-xl border-emerald-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] w-full max-w-5xl'
            : 'bg-[#0d0e17]/40 backdrop-blur-md border-white/10 w-full max-w-5xl'
        }`}
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-3 group text-white transition-opacity hover:opacity-90"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 group-hover:border-emerald-400/60 transition-colors">
            <Eye className="w-5 h-5 text-emerald-400 absolute transition-transform group-hover:scale-110" />
            <Leaf className="w-3 h-3 text-lime-400 absolute bottom-1 right-1 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-lg text-white">
              <span>NutriLens</span>
            </div>
            <span className="text-[10px] tracking-wider font-mono text-emerald-400/80 uppercase -mt-1">
              Food Label Intelligence
            </span>
          </div>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <button
            onClick={() => scrollToSection('problem')}
            className="hover:text-emerald-400 transition-colors"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('intelligence')}
            className="hover:text-emerald-400 transition-colors"
          >
            Intelligence
          </button>
          <button
            onClick={() => scrollToSection('trust')}
            className="hover:text-emerald-400 transition-colors"
          >
            Trust & Evidence
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => scrollToSection('scan')}
          className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 to-lime-400 hover:from-emerald-300 hover:to-lime-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95"
        >
          <Scan className="w-4 h-4 text-slate-950" />
          <span>Scan Label</span>
        </button>
      </nav>
    </header>
  );
}
