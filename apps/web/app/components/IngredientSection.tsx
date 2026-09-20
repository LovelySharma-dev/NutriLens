'use client';

import React, { useState } from 'react';
import { Tag, AlertTriangle, Check, Layers, Filter } from 'lucide-react';

const INGREDIENT_CHIPS = [
  { name: 'Oats', type: 'Grain', allergen: false },
  { name: 'Milk Solids', type: 'Dairy', allergen: true, allergenCategory: 'Milk' },
  { name: 'Refined Sugar', type: 'Sweetener', allergen: false },
  { name: 'Palm Oil', type: 'Fat', allergen: false },
  { name: 'Maltodextrin', type: 'Carbohydrate', allergen: false },
];

const ADDITIVE_CATEGORIES = [
  { category: 'Preservatives', count: 1, examples: 'INS 320 (BHA)', status: 'Categorized' },
  { category: 'Colors', count: 1, examples: 'INS 110 (Sunset Yellow)', status: 'Categorized' },
  { category: 'Sweeteners', count: 0, examples: 'None detected', status: 'Clean' },
  { category: 'Emulsifiers', count: 1, examples: 'INS 322 (Lecithin)', status: 'Categorized' },
  { category: 'Raising Agents', count: 0, examples: 'None detected', status: 'Clean' },
  { category: 'Flavouring Agents', count: 1, examples: 'Added Artificial Vanilla', status: 'Categorized' },
];

export default function IngredientSection() {
  const [selectedIngredient, setSelectedIngredient] = useState<string>('Milk Solids');

  const activeChip = INGREDIENT_CHIPS.find((c) => c.name === selectedIngredient) || INGREDIENT_CHIPS[1];

  return (
    <section
      ref={null}
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5"
    >
      {/* Section Header */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-950/50 border border-lime-500/30 text-lime-400 text-xs font-mono mb-4">
          <Tag className="w-3.5 h-3.5" />
          <span>Ingredient Parsing & Taxonomy</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
          Ingredients tell a story.
          <span className="block text-gradient-green">We help you read it.</span>
        </h2>
        <p className="text-slate-400 text-lg">
          Raw ingredient declarations are parsed into structured items, tagged for recognized allergens, and organized by additive category for clear consumer review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column — Ingredient Tokens & Allergen Flow */}
        <div className="lg:col-span-6 p-8 rounded-3xl glass-panel border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Parsed Ingredient Tokens</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Click an ingredient token to inspect allergen flags and classification details:
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2.5 mb-8">
              {INGREDIENT_CHIPS.map((chip, idx) => {
                const isSelected = chip.name === selectedIngredient;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedIngredient(chip.name)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border ${
                      isSelected
                        ? chip.allergen
                          ? 'bg-amber-950/80 border-amber-400 text-amber-300 ring-2 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-emerald-950/80 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <span>{chip.name}</span>
                    {chip.allergen && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Chip Inspection Panel */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-slate-400">Target Ingredient</span>
              <span className="text-xs font-mono font-bold text-white">{activeChip.name}</span>
            </div>

            {activeChip.allergen ? (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold font-mono text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Potential Allergen Detected ({activeChip.allergenCategory})</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Consumer-specific attention required: Contains dairy derivatives which may trigger reactions in lactose-intolerant or allergic individuals.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Standard ingredient token. No major common allergen flags triggered.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Additive Categories */}
        <div className="lg:col-span-6 p-8 rounded-3xl glass-panel border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-lime-400" />
                <span>Additive Functional Categories</span>
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-white/10">
                FSSAI / INS MAPPED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {ADDITIVE_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1"
                >
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-200 font-bold">{cat.category}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        cat.count > 0
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {cat.count > 0 ? `${cat.count} Found` : '0'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {cat.examples}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Balanced Non-alarmist Note */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300 leading-relaxed font-mono">
            <strong className="text-emerald-400 uppercase tracking-wide block mb-1">
              Scientific Transparency Note:
            </strong>
            “Detected ingredients and additives are categorized for further review. Additives with approved INS codes satisfy regulatory food-safety limits.”
          </div>
        </div>
      </div>
    </section>
  );
}
