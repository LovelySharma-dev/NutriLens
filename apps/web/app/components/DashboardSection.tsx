'use client';

import React, { useState } from 'react';
import { Activity, ShieldCheck, ChevronDown, ChevronUp, AlertOctagon, CheckCircle2, ShieldAlert, AlertCircle, Volume2 } from 'lucide-react';
import { usePreferences } from './PreferencesProvider';
import { decisionPresentation } from '../lib/uncertainty';

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
        proteins?: number;
        salt?: number;
      };
      servingSizeGrams?: number;
      table?: Array<{
        nutrient: string;
        unit: string | null;
        per100g: number | null;
        perPortion: number | null;
      }>;
    };
    nutritionPrediction?: {
      status: string;
      missingFeatures?: string[];
      message?: string | null;
      healthRisk?: {
        level: string;
        flags: Array<{ nutrient: string; value: number; level: string }>;
      } | null;
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
        sensitivity?: {
          margin: number | null;
          nearestFlip: {
            feature: string;
            factor: number;
            fromValue: number;
            toValue: number;
            grade: string;
          } | null;
          rejected: number;
          note?: string;
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
    uncertainty?: {
      decision: 'reliable' | 'review_required' | 'insufficient_evidence';
      summary: string;
      reasons: string[];
      probabilitiesCalibrated: boolean;
      calibrationStatus: string;
      ocr: { value: number | null; kind: string; calibrated: boolean };
      completeness: { present: number; required: number; servingSizeRead: boolean };
      allergen: { status: string; kind: string };
      decisionScore: { topVoteShare: number | null; kind: string; calibrated: boolean };
    };
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
  const gradeStatus = analysis.nutritionPrediction?.status;
  const gradeWithheld = gradeStatus === 'WITHHELD';
  const gradeUnavailable = gradeStatus === 'UNAVAILABLE';
  const nutrition = analysis.nutrition.mappedInput;
  const protein = nutrition.protein ?? nutrition.proteins;
  const nutritionPrediction = analysis.nutritionPrediction?.result;
  const predictedGrade = nutritionPrediction?.predictedGrade ?? null;
  const gradeLabel = predictedGrade ?? (gradeWithheld ? '—' : '…');
  const healthRiskLevel = nutritionPrediction?.healthRisk?.level || analysis.nutritionPrediction?.healthRisk?.level || 'UNKNOWN';
  const presentation = decisionPresentation(analysis.uncertainty?.decision);
  const healthRiskFlags = nutritionPrediction?.healthRisk?.flags || analysis.nutritionPrediction?.healthRisk?.flags || [];

  return (
    <section
      id="dashboard"
      className="relative mx-auto max-w-7xl scroll-mt-28 border-t border-emerald-500/20 px-4 py-16 sm:px-6 sm:py-20"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>LIVE ANALYSIS DASHBOARD</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Product Analysis Report
          </h2>
          <span className="break-all font-mono text-xs text-slate-400">
            Scan ID: {data.scanId}
          </span>
        </div>

        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs ${
          presentation.tone === 'incomplete' ? 'border-amber-500/40 bg-amber-950/40 text-amber-200' :
          presentation.tone === 'review' ? 'border-amber-500/40 bg-slate-900 text-amber-200' :
          'border-white/10 bg-slate-900 text-slate-300'
        }`}>
          <span>{presentation.title}</span>
        </div>
      </div>

      {/* Data Incomplete Warning */}
      {analysis.uncertainty && (
        <div className={`mb-8 rounded-xl border p-4 text-sm ${
          presentation.tone === 'incomplete' || presentation.tone === 'review'
            ? 'border-amber-500/30 bg-amber-950/40 text-amber-100'
            : 'border-white/10 bg-slate-950/60 text-slate-200'
        }`}>
          <p className="font-semibold">{presentation.title}</p>
          <p className="mt-2">{analysis.uncertainty.summary}</p>
          <dl className="mt-4 grid gap-2 text-xs font-mono sm:grid-cols-2">
            <div>OCR score: {analysis.uncertainty.ocr.value ?? 'unavailable'} ({analysis.uncertainty.ocr.kind}, calibrated {String(analysis.uncertainty.ocr.calibrated)})</div>
            <div>Vote share: {analysis.uncertainty.decisionScore.topVoteShare ?? 'unavailable'} ({analysis.uncertainty.decisionScore.kind})</div>
            <div>Completeness: {analysis.uncertainty.completeness.present}/{analysis.uncertainty.completeness.required}, serving {analysis.uncertainty.completeness.servingSizeRead ? 'read' : 'missing'}</div>
            <div>Allergen evidence: {analysis.uncertainty.allergen.status} ({analysis.uncertainty.allergen.kind})</div>
            <div>Calibration: {analysis.uncertainty.calibrationStatus}</div>
          </dl>
        </div>
      )}

      {!analysis.uncertainty && (gradeWithheld || gradeUnavailable) && (
        <div className="mb-8 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            {analysis.nutritionPrediction?.message
              ?? (gradeWithheld
                ? 'Grade withheld. A required nutrient is missing or impossible, so no median was used.'
                : 'Grade unavailable.')}
          </p>
        </div>
      )}

      {analysis.personalFit && analysis.personalFit.status !== 'NO_PROFILE' && (
        <div className={`mb-8 p-4 rounded-xl border text-sm ${analysis.personalFit.status === 'CONFLICT' ? 'bg-red-950/40 border-red-500/40 text-red-100' : 'bg-slate-950/60 border-white/10 text-slate-200'}`}>
          <p className="font-semibold">{analysis.personalFit.status === 'CONFLICT' ? t('fitConflict') : t('fitClear')}</p>
          {analysis.personalFit.status === 'CLEAR' && (
            <p className="mt-1 text-xs text-slate-400">A preference match is not a safety clearance.</p>
          )}
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
      <div className="mb-12 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {/* Nutri-Score */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border-white/10 glass-panel p-4 sm:p-6">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">NUTRI-SCORE</span>
            <span className={`text-3xl font-black sm:text-4xl ${
              predictedGrade === 'A' ? 'text-emerald-400' :
              predictedGrade === 'B' ? 'text-lime-400' :
              predictedGrade === 'C' ? 'text-amber-400' :
              predictedGrade === 'D' ? 'text-orange-400' :
              predictedGrade === 'E' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {gradeLabel}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">
              {gradeWithheld ? 'Grade withheld' : gradeUnavailable ? 'Grade unavailable' : 'Grade prediction'}
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
            {gradeLabel}
          </div>
        </div>

        {/* Health Screening Risk */}
        <div className={`flex items-center justify-between gap-3 rounded-2xl glass-panel p-4 sm:p-6 ${
          healthRiskLevel === 'HIGH' ? 'border-red-500/30 bg-slate-950/80' :
          healthRiskLevel === 'MEDIUM' ? 'border-amber-500/30 bg-slate-950/60' :
          healthRiskLevel === 'LOW' ? 'border-emerald-500/30 bg-slate-950/60' :
          'border-white/10 bg-slate-950/40'
        }`}>
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">HEALTH SCREENING</span>
            <span className={`text-xl font-black sm:text-2xl ${
              healthRiskLevel === 'HIGH' ? 'text-red-400' :
              healthRiskLevel === 'MEDIUM' ? 'text-amber-400' :
              healthRiskLevel === 'LOW' ? 'text-emerald-400' :
              'text-slate-400'
            }`}>
              {healthRiskLevel}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">Nutrient screen, not a safety clearance</span>
          </div>
          <ShieldAlert className={`w-10 h-10 ${
            healthRiskLevel === 'HIGH' ? 'text-red-400' :
            healthRiskLevel === 'MEDIUM' ? 'text-amber-400' :
            healthRiskLevel === 'LOW' ? 'text-emerald-400' :
            'text-slate-400'
          }`} />
        </div>

        {/* Trust Score */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border-emerald-500/30 glass-panel p-4 sm:p-6">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">TRUST SCORE</span>
            <span className="font-mono text-3xl font-black text-emerald-400 sm:text-4xl">
              {trustScore?.score !== null && trustScore?.score !== undefined
                ? trustScore.score.toFixed(2)
                : 'N/A'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">Claim Verification</span>
          </div>
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border-white/10 glass-panel p-4 sm:p-6">
          <div>
            <span className="text-xs font-mono text-slate-400 block mb-1">CONFIDENCE</span>
            <span className="font-mono text-3xl font-black text-white sm:text-4xl">
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
                  {protein !== undefined ? `${protein} g` : 'N/A'}
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
                    className={`flex items-center justify-between gap-3 rounded-xl p-3 ${
                      flag.level === 'HIGH'
                        ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                        : flag.level === 'MEDIUM'
                        ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300'
                        : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-2 font-bold">
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
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-amber-300">
                  <span className="flex min-w-0 flex-wrap items-center gap-2 font-bold">
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
                className={`rounded-2xl border p-4 transition-all duration-300 glass-panel sm:p-6 ${
                  rec.severity === 'HIGH'
                    ? 'border-red-500/30 bg-slate-950/80'
                    : 'border-amber-500/30 bg-slate-950/60'
                }`}
              >
                <div
                  onClick={() => setExpandedCard(isExpanded ? null : idx)}
                  className="flex cursor-pointer items-start justify-between gap-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
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
                    <h4 className="min-w-0 text-base font-bold text-white">{rec.title}</h4>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
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
