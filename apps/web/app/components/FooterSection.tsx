'use client';

import React from 'react';
import { Eye, Leaf, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FooterSection() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#050609] pt-24 pb-12 border-t border-emerald-500/20 text-white overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Emotional Closing Banner */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center mb-20">
          <h2 className="text-4xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Know what's inside.
            <span className="block text-gradient-green">Choose with confidence.</span>
          </h2>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 mb-8 backdrop-blur-md">
            <p className="text-lg sm:text-xl font-bold font-mono text-emerald-300">
              “Label Samjhega India, Tabhi Sahi Chunega India.”
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('scan')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-lime-400 hover:from-emerald-300 hover:to-lime-300 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95"
            >
              <span>Scan a Label</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 transition-all"
            >
              <span>Explore the Technology</span>
            </button>
          </div>
        </div>

        {/* Footer Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-12 border-t border-white/10 text-slate-400 text-sm">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Eye className="w-4 h-4 text-emerald-400" />
                <Leaf className="w-2.5 h-2.5 text-lime-400 absolute bottom-0.5 right-0.5" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">NutriLens</span>
            </div>
            <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-widest">
              Food Label Intelligence Platform
            </p>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Built for transparent, explainable food intelligence. Transforming confusing food label claims into actionable insights.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <span className="text-white font-bold uppercase tracking-wider block mb-2">Platform</span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-400 transition-colors">
                  Technology Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('intelligence')} className="hover:text-emerald-400 transition-colors">
                  Nutrition ML Engine
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('trust')} className="hover:text-emerald-400 transition-colors">
                  Claim Verification
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Metadata */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <span className="text-white font-bold uppercase tracking-wider block mb-2">Public Trust</span>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
              <span className="text-slate-300 font-bold block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FSSAI Informed
              </span>
              <p className="text-[11px] text-slate-400">
                Designed for consumer food label transparency.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4">
          <span>© {new Date().getFullYear()} NutriLens. All rights reserved.</span>
          <span>Label Samjhega India, Tabhi Sahi Chunega India.</span>
        </div>
      </div>
    </footer>
  );
}
