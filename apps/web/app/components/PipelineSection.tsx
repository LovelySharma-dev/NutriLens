'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface PipelineNode {
  id: string;
  name: string;
  description: string;
  category: string;
}

const PIPELINE_NODES: PipelineNode[] = [
  { id: 'label', name: 'LABEL', description: 'Raw food label image ingestion from mobile camera or upload.', category: 'Input' },
  { id: 'ocr', name: 'OCR', description: 'Optical Character Recognition extracts text from package surfaces.', category: 'Processing' },
  { id: 'structure', name: 'STRUCTURE', description: 'Parses unstructured text into key-value pairs and tables.', category: 'Processing' },
  { id: 'nutrition', name: 'NUTRITION', description: 'Normalize values to a common 100g basis and analyze nutritional profile.', category: 'Intelligence' },
  { id: 'ingredients', name: 'INGREDIENTS', description: 'Identifies ingredient tokens, additives (INS codes), and potential allergens.', category: 'Intelligence' },
  { id: 'claims', name: 'CLAIMS', description: 'Detects explicit marketing assertions made on packaging.', category: 'Verification' },
  { id: 'evidence', name: 'EVIDENCE', description: 'Cross-references claims against scientific and regulatory standards.', category: 'Verification' },
  { id: 'analysis', name: 'ANALYSIS', description: 'Runs ML classification models and calculates health risk metrics.', category: 'Output' },
  { id: 'insight', name: 'INSIGHT', description: 'Generates explainable, actionable recommendations for consumers.', category: 'Output' },
];

export default function PipelineSection() {
  const [activeNode, setActiveNode] = useState<PipelineNode>(PIPELINE_NODES[3]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pipeline-step',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '.pipeline-grid',
            start: 'top 75%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
          <Layers className="w-3.5 h-3.5" />
          <span>Intelligence Pipeline</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          So we built a lens for food labels.
        </h2>
        <p className="text-slate-400 text-lg sm:text-xl">
          NutriLens converts raw label information into structured, explainable insights through an end-to-end data processing pipeline.
        </p>
      </div>

      {/* Interactive Pipeline Node Grid */}
      <div className="pipeline-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-10">
        {PIPELINE_NODES.map((node, index) => {
          const isSelected = activeNode.id === node.id;
          return (
            <div key={node.id} className="relative flex flex-col items-center">
              <button
                onMouseEnter={() => setActiveNode(node)}
                onClick={() => setActiveNode(node)}
                className={`pipeline-step w-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105'
                    : 'bg-slate-900/40 border-white/10 text-slate-400 hover:border-emerald-500/40 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-500 mb-1">0{index + 1}</span>
                <span className="text-xs font-bold font-mono tracking-wider">{node.name}</span>
                {isSelected && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-1" />
                )}
              </button>

              {/* Connecting arrow for desktop view */}
              {index < PIPELINE_NODES.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none z-10" />
              )}
            </div>
          );
        })}
      </div>

      {/* Active Node Detail Card */}
      <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl glass-panel border-emerald-500/30 bg-slate-900/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all duration-300">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {activeNode.category} Stage
            </span>
            <h3 className="text-xl font-bold font-mono text-white tracking-wide">
              {activeNode.name}
            </h3>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {activeNode.description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-lg border border-emerald-500/30">
          <span>Active Pipeline Node</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>
    </section>
  );
}
