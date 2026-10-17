'use client';

import React, { useState } from 'react';
import { Activity, ShieldCheck, ChevronDown, ChevronUp, AlertOctagon, CheckCircle2, ShieldAlert, AlertCircle, Volume2 } from 'lucide-react';
import { usePreferences } from './PreferencesProvider';

export interface AnalysisData {
  scanId: string;
  report?: {
    summary: string;
    riskLevel: string;
    recommendations: string[];
  };
  trustScore?: {
    score: number;
    confidence: number;
  };
  analysis: {
    claimsAnalyzed: number;
    riskLevel: string;
    averageScore: number | null;
    ingredientAnalysis?: {
      allergenFound: boolean;
      allergens: string[];
      additivesCount: number;
    } | null;
    nutrition: {
      mappedInput: {
        energy?: number;
        sugars?: number;
        fat?: number;
        saturatedFat?: number;
        carbohydrates?: number;
        fiber?: number;
        protein?: number;
        salt?: number;
      };
      servingSizeGrams?: number;
    };
    nutritionPrediction?: {
      status: string;
      missingFeatures?: string[];
      result?: {
        predictedGrade: string;
        probabilities: Record<string, number>;
        healthRisk?: {
          level: string;
          flags: Array<{
            nutrient: string;
            value: number;
            level: string;
          }>;
        };
        explanation?: {
          method: string;
          note?: string;
          features: Array<{
            feature: string;
            value: number;
            baseline: number;
            contribution: number;
          }>;
        } | null;
        imputedFeatures?: string[] | null;
      };
    };
    personalFit?: {
      status: 'CLEAR' | 'CONFLICT' | 'NO_PROFILE';
      reasons: string[];
    };
    recommendations: Array<{
      type: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      message: string;
      reason: string;
      action: string;
    }>;
  };
}

interface DashboardSectionProps {
  data: AnalysisData | null;
}

export default function DashboardSection({ data }: DashboardSectionProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const { speak, t } = usePreferences();

  if (!data) return null;

  const { analysis, trustScore } = data;
  const isDataIncomplete = analysis.nutritionPrediction?.status === 'INCOMPLETE';
  const nutrition = analysis.nutrition.mappedInput;
  const nutritionPrediction = analysis.nutritionPrediction?.result;
  const predictedGrade = nutritionPrediction?.predictedGrade || 'N/A';
  const healthRiskLevel = nutritionPrediction?.healthRisk?.level || analysis.riskLevel;
  const healthRiskFlags = nutritionPrediction?.healthRisk?.flags || [];

  return (
    <section
      id="dashboard"
      className="relative py-20 px-6 max-w-7xl mx-auto border-t border-emerald-500/20 scroll-mt-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>LIVE ANALYSIS DASHBOARD</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Product Analysis Report
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Scan ID: {data.scanId}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time API Verified</span>
        </div>
      </div>

      {/* Data Incomplete Warning */}
      {isDataIncomplete && (
        <div className="mb-8 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Partial data:</span> Some nutrition features were not on the label. Only those missing fields use a dataset median, and a printed zero is kept as zero.
          </div>
        </div>
      )}

      {analysis.personalFit && analysis.personalFit.status !== 'NO_PROFILE' && (
        <div className={`mb-8 p-4 rounded-xl border text-sm ${analysis.personalFit.status === 'CONFLICT' ? 'bg-red-950/40 border-red-500/40 text-red-100' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'}`}>
          <p className="font-semibold">{analysis.personalFit.status === 'CONFLICT' ? t('fitConflict') : t('fitClear')}</p>
          <ul className="mt-2 space-y-1">
            {analysis.personalFit.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            {analysis.personalFit.reasons.length === 0 && <li>{t('fitClearDetail')}</li>}
          </ul>
        </div>
      )}

      {nutritionPrediction?.explanation && nutritionPrediction.explanation.features.length > 0 && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{t('whyGrade')}</h3>
              <p className="text-sm text-slate-400">{nutritionPrediction.explanation.note}</p>
            </div>
            <button
              type="button"
              onClick={() => speak(`${t('whyGrade')}. ${nutritionPrediction.explanation?.features.slice(0, 3).map((row) => `${row.feature} ${row.contribution}`).join('. ')}`)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              {t('readAloud')}
            </button>
          </div>
          <ul className="space-y-3">
            {nutritionPrediction.explanation.features.map((row) => {
              const width = Math.min(100, Math.abs(row.contribution) * 100);
              return (
                <li key={row.feature}>
                  <div className="flex justify-between text-sm text-slate-300 mb-1">
                    <span>{row.feature.replaceAll('_', ' ').replace('-', ' ')}</span>
                    <span className="font-mono">{row.contribution > 0 ? '+' : ''}{row.contribution.toFixed(3)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className={`h-2 rounded-full ${row.contribution >= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${Math.max(width, 4)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Nutri-Score */}
        <div className="p-6 rounded-2xl glass-panel border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">NUTRI-SCORE</span>
            <span className={`text-4xl font-black ${
              predictedGrade === 'A' ? 'text-emerald-400' :
              predictedGrade === 'B' ? 'text-lime-400' :
              predictedGrade === 'C' ? 'text-amber-400' :
              predictedGrade === 'D' ? 'text-orange-400' :
              predictedGrade === 'E' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {predictedGrade}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">
              {analysis.nutritionPrediction?.status === 'INCOMPLETE' ? 'Incomplete Data' : 'Grade Prediction'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-xl ${
            predictedGrade === 'A' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' :
            predictedGrade === 'B' ? 'bg-lime-950/60 border-lime-500/30 text-lime-400' :
            predictedGrade === 'C' ? 'bg-amber-950/60 border-amber-500/30 text-amber-400' :
            predictedGrade === 'D' ? 'bg-orange-950/60 border-orange-500/30 text-orange-400' :
            predictedGrade === 'E' ? 'bg-red-950/60 border-red-500/30 text-red-400' :
            'bg-slate-900 border-white/10 text-slate-400'
          }`}>
            {predictedGrade}
          </div>
        </div>

        {/* Health Screening Risk */}
        <div className={`p-6 rounded-2xl glass-panel flex items-center justify-between ${
          healthRiskLevel === 'HIGH' ? 'border-red-500/30 bg-slate-950/80' :
          healthRiskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-slate-950/60' :
          healthRiskLevel === 'LOW' ? 'border-emerald-500/30 bg-slate-950/60' :
          'border-white/10 bg-slate-950/40'
        }`}>
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">HEALTH SCREENING</span>
            <span className={`text-2xl font-black ${
              healthRiskLevel === 'HIGH' ? 'text-red-400' :
              healthRiskLevel === 'MEDIUM' ? 'text-amber-400' :
              healthRiskLevel === 'LOW' ? 'text-emerald-400' :
              'text-slate-400'
            }`}>
              {healthRiskLevel}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">Nutrient Alert</span>
          </div>
          <ShieldAlert className={`w-10 h-10 ${
            healthRiskLevel === 'HIGH' ? 'text-red-400' :
            healthRiskLevel === 'MEDIUM' ? 'text-amber-400' :
            healthRiskLevel === 'LOW' ? 'text-emerald-400' :
            'text-slate-400'
          }`} />
        </div>

        {/* Trust Score */}
        <div className="p-6 rounded-2xl glass-panel border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">TRUST SCORE</span>
            <span className="text-4xl font-black text-emerald-400 font-mono">
              {trustScore?.score !== null && trustScore?.score !== undefined
                ? trustScore.score.toFixed(2)
                : 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">Claim Verification</span>
          </div>
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>

        {/* Confidence */}
        <div className="p-6 rounded-2xl glass-panel border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">CONFIDENCE</span>
            <span className="text-4xl font-black text-white font-mono">
              {Math.round((trustScore?.confidence ?? 0.2) * 100)}%
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">Available Evidence</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 font-mono font-bold text-sm">
            20%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column — 100g Nutrition & Findings */}
        <div className="lg:col-span-6 space-y-8">
          {/* Nutrition Table */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border-white/10">
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide mb-6 border-b border-white/10 pb-3">
              Nutrition Facts (per 100g)
            </h3>

            <div className="grid grid-cols-2 gap-4 font-mono text-sm">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400 text-xs block">Energy</span>
                <span className="text-white font-bold">
                  {nutrition.energy !== undefined ? `${nutrition.energy} kcal` : 'N/A'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-red-500/20">
                <span className="text-red-400 text-xs block">Sugar</span>
                <span className="text-red-400 font-bold">
                  {nutrition.sugars !== undefined ? `${nutrition.sugars} g` : 'N/A'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400 text-xs block">Protein</span>
                <span className="text-emerald-400 font-bold">
                  {nutrition.protein !== undefined ? `${nutrition.protein} g` : 'N/A'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400 text-xs block">Fat</span>
                <span className="text-white font-bold">
                  {nutrition.fat !== undefined ? `${nutrition.fat} g` : 'N/A'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400 text-xs block">Saturated Fat</span>
                <span className="text-amber-400 font-bold">
                  {nutrition.saturatedFat !== undefined ? `${nutrition.saturatedFat} g` : 'N/A'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5">
                <span className="text-slate-400 text-xs block">Salt</span>
                <span className="text-amber-400 font-bold">
                  {nutrition.salt !== undefined ? `${nutrition.salt} g` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Findings List */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border-white/10">
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide mb-4">
              Key Screening Findings
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {healthRiskFlags.length > 0 ? (
                healthRiskFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      flag.level === 'HIGH'
                        ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                        : flag.level === 'MEDIUM'
                        ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300'
                        : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] ${
                          flag.level === 'HIGH'
                            ? 'bg-red-500/20 border-red-500/40'
                            : flag.level === 'MEDIUM'
                            ? 'bg-amber-500/20 border-amber-500/40'
                            : 'bg-emerald-500/20 border-emerald-500/40'
                        }`}
                      >
                        {flag.level}
                      </span>
                      {flag.nutrient.charAt(0).toUpperCase() + flag.nutrient.slice(1)} ({flag.value})
                    </span>
                    <AlertOctagon
                      className={`w-4 h-4 ${
                        flag.level === 'HIGH'
                          ? 'text-red-400'
                          : flag.level === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    />
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-white/10 text-slate-400">
                  No health risk flags detected from available nutrition data.
                </div>
              )}

              {analysis.ingredientAnalysis?.allergenFound && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
                  <span className="font-bold flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px]">
                      HIGH
                    </span>
                    Potential Allergen(s) — {analysis.ingredientAnalysis.allergens.join(', ')}
                  </span>
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Expandable Recommendation Cards */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide mb-6">
            Actionable Recommendations ({analysis.recommendations.length})
          </h3>

          {analysis.recommendations.map((rec, idx) => {
            const isExpanded = expandedCard === idx;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl glass-panel border transition-all duration-300 ${
                  rec.severity === 'HIGH'
                    ? 'border-red-500/30 bg-slate-950/80'
                    : 'border-amber-500/30 bg-slate-950/60'
                }`}
              >
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 ${
                        rec.severity === 'HIGH'
                          ? 'bg-red-950 text-red-400 border border-red-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      {rec.severity}
                    </span>
                    <h4 className="text-base font-bold text-white">{rec.title}</h4>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <p className="text-slate-300 text-sm mt-3 font-normal leading-relaxed">
                  {rec.message}
                </p>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
                      <span className="text-slate-400 block mb-0.5">Why?</span>
                      <p className="text-slate-200">{rec.reason}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <span className="text-emerald-400 font-bold block mb-0.5">What you can do:</span>
                      <p>{rec.action}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
