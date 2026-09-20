'use client';

import React from 'react';
import { UserCheck, Sparkles, Clock } from 'lucide-react';

const PREFERENCES = [
  { label: 'Allergen awareness', desc: 'Custom alerts for specific food sensitivities' },
  { label: 'Lower sugar target', desc: 'Threshold filtering for diabetes & sugar reduction' },
  { label: 'Lower salt / sodium', desc: 'Hypertension dietary monitoring' },
  { label: 'Higher protein goal', desc: 'Fitness & muscle recovery intake tracking' },
  { label: 'Vegetarian / Vegan', desc: 'Plant-based derivative verification' },
  { label: 'Fitness goals', desc: 'Personalized macronutrient balancing' },
];

export default function PersonalizationSection() {
  return (
    <section
      ref={null}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-950/50 border border-lime-500/30 text-lime-400 text-xs font-mono mb-4">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Consumer Customization</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          Your food choices are <span className="text-gradient-green">personal.</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Upcoming release features will allow tailored profile parameters for personal health conditions, dietary preferences, and fitness goals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREFERENCES.map((pref, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl glass-panel border-white/10 glass-panel-hover flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Prominent Coming Next Badge */}
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="w-5 h-5 text-lime-400" />
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-lime-400 border border-lime-500/30">
                <Clock className="w-3 h-3" /> Coming next
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">{pref.label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">{pref.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
