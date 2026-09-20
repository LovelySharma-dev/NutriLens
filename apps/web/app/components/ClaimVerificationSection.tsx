'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface ClaimItem {
  id: string;
  claim: string;
  source: string;
  status: 'SUPPORTED' | 'UNCERTAIN' | 'FLAGGED';
  score: number;
  explanation: string;
}

const CLAIMS: ClaimItem[] = [
  {
    id: 'c1',
    claim: 'High Protein',
    source: '16g protein per 100g meets nutrient threshold for high protein claims under standard guidelines.',
    status: 'SUPPORTED',
    score: 1.0,
    explanation: 'Supported: Protein density exceeds 12% of total energy value.',
  },
  {
    id: 'c2',
    claim: '100% Natural',
    source: 'Contains artificial flavorings and synthetic food color INS 110.',
    status: 'FLAGGED',
    score: 0.0,
    explanation: 'Flagged: Claim contradicts ingredient list which lists added synthetic colors and artificial flavorings.',
  },
  {
    id: 'c3',
    claim: 'Healthy Choice',
    source: 'General health claim without specific regulatory definition.',
    status: 'UNCERTAIN',
    score: 0.5,
    explanation: 'Uncertain: Broad marketing statement; high sugar content (24g/100g) conflicts with general wellness.',
  },
  {
    id: 'c4',
    claim: 'Low Fat',
    source: 'Fat level is 6g per 100g, slightly above standard 3g/100g threshold for low fat classification.',
    status: 'UNCERTAIN',
    score: 0.5,
    explanation: 'Uncertain: Fat content is moderate rather than strictly low.',
  },
];

export default function ClaimVerificationSection() {
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem>(CLAIMS[1]);

  return (
    <section
      ref={null}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/50 border border-blue-500/30 text-blue-400 text-xs font-mono mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evidence-Grounded Claim Audit</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          A claim is <span className="text-gradient-green">not evidence.</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Front-of-pack claims are audited against parsed ingredient matrices and nutritional values to determine scientific evidence support.
        </p>
      </div>

      {/* Interactive Evidence Graph Container */}
      <div className="p-6 sm:p-10 rounded-3xl glass-panel border-blue-500/30 bg-slate-950/90 shadow-2xl">
        <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <span>Claim & Evidence Grounding Graph</span>
          <span className="text-slate-400">SELECT A CLAIM BUBBLE TO INSPECT EVIDENCE</span>
        </div>

        {/* Claim Bubbles Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {CLAIMS.map((c) => {
            const isSelected = selectedClaim.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClaim(c)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/80 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-500">CLAIM</span>
                  {c.status === 'SUPPORTED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {c.status === 'UNCERTAIN' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  {c.status === 'FLAGGED' && <XCircle className="w-4 h-4 text-red-400" />}
                </div>

                <h4 className="text-base font-bold text-white mb-1">“{c.claim}”</h4>

                <span
                  className={`text-[10px] font-mono font-bold uppercase ${
                    c.status === 'SUPPORTED'
                      ? 'text-emerald-400'
                      : c.status === 'UNCERTAIN'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {c.status}
                </span>
              </button>
            );
          })}
        </div>

        {/* Evidence Pipeline Graph Visualizer for Selected Claim */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            {/* Step 1: Claim Node */}
            <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">NODE 1: CLAIM</span>
              <h5 className="text-lg font-bold text-white mb-1">“{selectedClaim.claim}”</h5>
              <span className="text-xs font-mono text-slate-400">Declared on Packaging</span>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-blue-400 shrink-0" />

            {/* Step 2: Evidence Source Node */}
            <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">NODE 2: EVIDENCE SOURCE</span>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                {selectedClaim.source}
              </p>
            </div>

            <ArrowRight className="hidden lg:block w-6 h-6 text-blue-400 shrink-0" />

            {/* Step 3: Verification Node */}
            <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-white/10">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">NODE 3: VERIFICATION RESULT</span>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    selectedClaim.status === 'SUPPORTED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : selectedClaim.status === 'UNCERTAIN'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : 'bg-red-950 text-red-400 border border-red-500/40'
                  }`}
                >
                  {selectedClaim.status}
                </span>
                <span className="text-xs font-mono text-slate-400">Score: {selectedClaim.score.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal font-mono">
                {selectedClaim.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
