'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function TrustScoreSection() {
  const [score, setScore] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: 0.92,
        duration: 2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
        onUpdate: () => {
          setScore(obj.val);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="trust"
      ref={sectionRef}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evidence Verification Engine</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-12">
          Evidence Verification Score
        </h2>

        {/* Circular Radar Graphic Centerpiece */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-10">
          {/* Animated SVG Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-900"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Glowing Accent Arc */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-emerald-400 transition-all duration-300"
              strokeWidth="6"
              strokeDasharray={276}
              strokeDashoffset={276 * (1 - score)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Pulse aura */}
          <div className="absolute inset-4 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />

          {/* Center Text */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-7xl font-extrabold font-mono text-gradient-green tracking-tight">
              {score.toFixed(2)}
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">
              VERIFICATION INDEX
            </span>
          </div>
        </div>

        {/* Details Card */}
        <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel border-emerald-500/30 bg-slate-950/90 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">DATA CONFIDENCE</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                20%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">ALGORITHM ID: EV-2026</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Methodology:</strong>
                <p>Calculated as the average verification score across available package claim evidence and ingredient mappings.</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 font-mono leading-normal">
            <strong className="text-amber-400 uppercase tracking-wide block mb-0.5">Important Technical Distinction:</strong>
            This score measures specific claim/evidence verification, NOT probability of overall healthiness, safety, or medical suitability.
          </div>
        </div>
      </div>
    </section>
  );
}
