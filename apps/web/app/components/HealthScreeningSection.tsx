'use client';

import React, { useEffect, useRef } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SCREENING_ITEMS = [
  { nutrient: 'Sugar', value: '24 g/100g', level: 'HIGH', color: 'bg-red-500', pct: 85, badge: 'text-red-400 border-red-500/40 bg-red-950/60' },
  { nutrient: 'Energy Density', value: '440 kcal/100g', level: 'HIGH', color: 'bg-red-500', pct: 78, badge: 'text-red-400 border-red-500/40 bg-red-950/60' },
  { nutrient: 'Saturated Fat', value: '2 g/100g', level: 'MEDIUM', color: 'bg-amber-500', pct: 45, badge: 'text-amber-400 border-amber-500/40 bg-amber-950/60' },
  { nutrient: 'Salt (Sodium)', value: '0.6 g/100g', level: 'MEDIUM', color: 'bg-amber-500', pct: 40, badge: 'text-amber-400 border-amber-500/40 bg-amber-950/60' },
];

export default function HealthScreeningSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.risk-meter-fill',
        { width: '0%' },
        {
          width: (i, target) => target.getAttribute('data-pct') + '%',
          duration: 1,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.risk-meters-container',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column — Text & Disclaimer */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Targeted Nutrient Risk Analysis</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
            Know what deserves your <span className="text-gradient-green">attention.</span>
          </h2>

          <p className="text-slate-300 text-base leading-relaxed mb-8">
            High intake of refined sugars, dense calories, saturated fats, or sodium can impact long-term wellness. NutriLens automatically screens key nutrient thresholds against standard dietary guidance.
          </p>

          {/* Mandatory Disclaimer Callout */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              <strong className="text-slate-200 uppercase tracking-wide block mb-0.5">Disclaimer Notice:</strong>
              This screening is informational and is not a medical diagnosis. Consult qualified healthcare professionals for medical or dietary decisions.
            </p>
          </div>
        </div>

        {/* Right Column — Risk Visualization Meters */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border-red-500/20 bg-slate-950/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="text-lg font-bold font-mono text-white tracking-wide uppercase">
                NUTRITION SCREENING
              </h3>
              <span className="text-xs font-mono px-3 py-1 rounded bg-red-950 text-red-400 border border-red-500/30">
                OVERALL RISK: HIGH
              </span>
            </div>

            <div className="risk-meters-container space-y-6">
              {SCREENING_ITEMS.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-mono">
                    <span className="text-slate-200 font-semibold">{item.nutrient}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{item.value}</span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${item.badge}`}>
                        {item.level}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
                    <div
                      className={`risk-meter-fill h-full rounded-full ${item.color} shadow-sm`}
                      data-pct={item.pct}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
