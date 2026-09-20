'use client';

import React, { useEffect, useRef } from 'react';
import { HelpCircle, Utensils, ShieldAlert, Activity, ShieldCheck, Lightbulb } from 'lucide-react';
import gsap from 'gsap';

const QUESTIONS = [
  {
    icon: Utensils,
    title: 'What am I eating?',
    category: 'Ingredient Analysis',
    color: 'emerald',
    text: 'Deconstructs raw ingredient declarations into base items, identifies additives with INS codes, and categorizes processing levels.',
  },
  {
    icon: ShieldAlert,
    title: 'Is there an allergen?',
    category: 'Allergen Detection',
    color: 'amber',
    text: 'Scans ingredient matrices for common allergens like Milk, Nuts, Soy, Gluten, and Shellfish to issue consumer attention alerts.',
  },
  {
    icon: Activity,
    title: 'How nutritious is it?',
    category: 'Nutrition & ML',
    color: 'lime',
    text: 'Normalizes nutrition data per 100g, calculates Nutri-Score grades, and runs ML probability models across macro profiles.',
  },
  {
    icon: ShieldCheck,
    title: 'Are claims supported?',
    category: 'Evidence Grounding',
    color: 'blue',
    text: 'Verifies marketing assertions like “High Protein” or “Low Sugar” against verified scientific literature and FSSAI standards.',
  },
  {
    icon: Lightbulb,
    title: 'What needs attention?',
    category: 'Actionable Insights',
    color: 'green',
    text: 'Synthesizes findings into plain-language health recommendations focused on high sugars, energy density, and sodium levels.',
  },
];

// Duplicated array for seamless infinite looping
const INFINITE_QUESTIONS = [...QUESTIONS, ...QUESTIONS];

export default function HorizontalScrollSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    // Create endless seamless horizontal scroll animation
    const tween = gsap.to(trackRef.current, {
      xPercent: -50,
      repeat: -1,
      duration: 35,
      ease: 'none',
    });

    tweenRef.current = tween;

    return () => {
      tween.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 0.2, duration: 0.5 });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, { timeScale: 1, duration: 0.5 });
    }
  };

  return (
    <div className="relative w-full py-24 overflow-hidden bg-[#07080d] flex flex-col justify-center border-t border-white/5">
      {/* Title Header */}
      <div className="px-6 max-w-7xl mx-auto w-full mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-400 text-xs font-mono mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Infinite Loop Exploration</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
          One label. <span className="text-gradient-green">Many questions.</span>
        </h2>
      </div>

      {/* Infinite Horizontal Track Container */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full overflow-hidden flex items-center py-4 cursor-pointer"
      >
        <div ref={trackRef} className="flex gap-8 px-4 w-max items-center">
          {INFINITE_QUESTIONS.map((q, idx) => {
            const Icon = q.icon;
            const originalIndex = (idx % QUESTIONS.length) + 1;
            return (
              <div
                key={idx}
                className="w-[300px] sm:w-[380px] h-[360px] p-7 rounded-3xl glass-panel border-white/10 glass-panel-hover flex flex-col justify-between shrink-0 relative overflow-hidden group"
              >
                {/* Background ambient lens circle inside card */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-white/5">
                      0{originalIndex} / 05
                    </span>
                  </div>

                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 block mb-1.5">
                    {q.category}
                  </span>

                  <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                    {q.title}
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {q.text}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>NutriLens Intelligence</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Explore →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
