'use client';

import React, { useEffect, useRef } from 'react';
import { Activity, BarChart3, ShieldAlert } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const NUTRITION_FACTS = [
  { label: 'Energy', value: 440, unit: 'kcal', max: 600, color: 'from-amber-500 to-red-500', high: true },
  { label: 'Sugar', value: 24, unit: 'g', max: 50, color: 'from-red-500 to-amber-500', high: true },
  { label: 'Fat', value: 6, unit: 'g', max: 30, color: 'from-emerald-500 to-teal-500', high: false },
  { label: 'Saturated Fat', value: 2, unit: 'g', max: 15, color: 'from-amber-500 to-yellow-500', high: false },
  { label: 'Carbohydrates', value: 36, unit: 'g', max: 80, color: 'from-blue-500 to-indigo-500', high: false },
  { label: 'Fiber', value: 4, unit: 'g', max: 20, color: 'from-emerald-400 to-lime-400', high: false },
  { label: 'Protein', value: 16, unit: 'g', max: 40, color: 'from-lime-500 to-emerald-500', high: false },
  { label: 'Salt', value: 0.6, unit: 'g', max: 5, color: 'from-yellow-500 to-amber-500', high: false },
];

const MODEL_PROBABILITIES = [
  { grade: 'A', percent: 26.5, color: '#10B981' },
  { grade: 'B', percent: 33.5, color: '#84CC16' },
  { grade: 'C', percent: 36.0, color: '#F59E0B' },
  { grade: 'D', percent: 3.0, color: '#F97316' },
  { grade: 'E', percent: 1.0, color: '#EF4444' },
];

export default function NutritionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Animate bar widths on scroll
      gsap.fromTo(
        '.nutrition-bar-fill',
        { width: '0%' },
        {
          width: (i, target) => target.getAttribute('data-width') || '50%',
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: '.nutrition-grid',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="intelligence"
      ref={sectionRef}
      className="relative mx-auto max-w-7xl border-t border-white/5 px-4 py-16 sm:px-6 sm:py-24 lg:py-28"
    >
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
          <Activity className="w-3.5 h-3.5" />
          <span>Nutrition Normalization Engine</span>
        </div>

        <h2 className="mb-6 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Nutrition, without the <span className="text-gradient-green">nutrition-science degree.</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Raw nutrition labels are normalized to a uniform 100g basis, allowing machine learning models to analyze the nutritional balance objectively.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column — 100g Nutrition Metrics Grid */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl glass-panel border-white/10">
          <div className="mb-6 flex flex-col items-start gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
              <BarChart3 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>Normalized Nutritional Breakdown</span>
            </h3>
            <span className="shrink-0 rounded border border-emerald-500/30 bg-slate-900 px-3 py-1 font-mono text-xs text-emerald-400">
              PER 100g BASIS
            </span>
          </div>

          <div className="nutrition-grid space-y-4">
            {NUTRITION_FACTS.map((item, idx) => {
              const widthPct = Math.min(100, Math.round((item.value / item.max) * 100));
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      {item.label}
                      {item.high && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/30">
                          HIGH
                        </span>
                      )}
                    </span>
                    <span className="text-white font-bold">
                      {item.value} {item.unit}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-950 border border-white/5 overflow-hidden p-0.5">
                    <div
                      className={`nutrition-bar-fill h-full rounded-full bg-gradient-to-r ${item.color}`}
                      data-width={`${widthPct}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column — Nutri-Score & Random Forest Model Probability */}
        <div className="lg:col-span-5 space-y-6">
          {/* Nutri-Score Grade Card */}
          <div className="flex items-center justify-between gap-4 rounded-3xl border-emerald-500/30 bg-slate-900/80 glass-panel p-5 sm:p-8">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                PREDICTED GRADE
              </span>
              <h4 className="text-2xl font-extrabold text-white">NUTRI-SCORE</h4>
              <p className="text-xs text-slate-400 max-w-[200px] mt-2">
                Random Forest classification model based on normalized features.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 bg-gradient-to-br from-amber-400 to-amber-600 text-4xl font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] sm:h-24 sm:w-24 sm:text-6xl">
              C
            </div>
          </div>

          {/* Model Probability Distribution */}
          <div className="p-6 rounded-3xl glass-panel border-white/10">
            <div className="mb-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                Model Probability Distribution
              </span>
              <span className="font-mono text-[10px] text-slate-400">Random Forest (200 trees)</span>
            </div>

            <div className="space-y-3">
              {(() => {
                const maxPct = Math.max(...MODEL_PROBABILITIES.map((p) => p.percent));
                return MODEL_PROBABILITIES.map((p, idx) => {
                  const isSelected = p.percent === maxPct;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className={`font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                          Grade {p.grade} {isSelected && '(Selected)'}
                        </span>
                        <span className="text-slate-200">{p.percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.percent}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <p className="text-[11px] text-slate-400 mt-5 pt-4 border-t border-white/5 leading-normal">
              Model probability distribution represents statistical likelihood generated from normalized nutritional features, not clinical certainty.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
