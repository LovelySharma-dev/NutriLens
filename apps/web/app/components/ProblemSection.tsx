'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, FileText, Info } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Reveal header
      gsap.fromTo(
        '.problem-headline',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );

      // Stagger qualitative phrases
      gsap.fromTo(
        '.problem-phrase',
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.2,
          scrollTrigger: {
            trigger: '.problem-phrases-container',
            start: 'top 75%',
          },
        }
      );

      // Animate confusing label mock items
      gsap.fromTo(
        '.label-item-highlight',
        { opacity: 0.2, scale: 0.98 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: '.confusing-label-card',
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const phrases = [
    'Small print.',
    'Complex ingredients.',
    'Marketing claims.',
    'Too much information.',
  ];

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      {/* Section Header */}
      <div className="problem-headline max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400 text-xs font-mono mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>The Consumer Dilemma</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          We read the brand.
          <span className="block text-gradient-green">We rarely read the label.</span>
        </h2>
      </div>

      {/* Editorial Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full">
          <div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-100 mb-8 leading-snug">
              A packet can look healthy without being easy to understand.
            </h3>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Modern food packaging is designed to capture attention with bold health claims on the front, while pushing dense, cryptic nutritional tables and legal terminology to the tiny back print.
            </p>
          </div>

          {/* Qualitative Phrases Stagger */}
          <div className="problem-phrases-container space-y-3">
            {phrases.map((phrase, idx) => (
              <div
                key={idx}
                className="problem-phrase flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-slate-200 font-mono text-sm sm:text-base"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>“{phrase}”</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column — Confusing Label Graphic */}
        <div className="lg:col-span-7">
          <div className="confusing-label-card relative p-6 sm:p-8 rounded-2xl glass-panel border-amber-500/20 shadow-2xl overflow-hidden">
            {/* Background noise tint */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
                  Standard Packaging Label (Back Print)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                HIGH DENSITY DATA
              </span>
            </div>

            {/* Confusing Label Grid */}
            <div className="space-y-4">
              <div className="label-item-highlight grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-950/70 border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-500 block">Serving Size</span>
                  <span className="text-xs font-mono text-slate-300">30g (approx 2 tbsp)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Energy (per 100g)</span>
                  <span className="text-xs font-mono text-amber-400 font-bold">440 kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Sugars</span>
                  <span className="text-xs font-mono text-red-400 font-bold">24.0 g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Sat Fat</span>
                  <span className="text-xs font-mono text-amber-400">2.0 g</span>
                </div>
              </div>

              <div className="label-item-highlight p-4 rounded-lg bg-slate-950/70 border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Ingredients List (Raw)
                </span>
                <p className="text-xs font-mono text-slate-400 leading-relaxed">
                  Whole Grain Oats, Refined Sugar, Vegetable Palm Oil, Maltodextrin, Emulsifier (INS 322), Antioxidant (INS 320), Permitted Synthetic Food Color (INS 110), Added Artificial Flavouring Substances, Milk Solids.
                </p>
              </div>

              <div className="label-item-highlight grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">Front Claim</span>
                  <span className="text-xs font-bold text-emerald-400">“100% Natural & High Protein”</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-amber-500/30 bg-amber-950/20">
                  <span className="text-[10px] font-mono text-amber-400 block mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Label Reality
                  </span>
                  <span className="text-xs text-slate-300">Added sugar accounts for 24% of total weight.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
