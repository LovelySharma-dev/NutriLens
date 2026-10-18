'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ScanSection from '../components/ScanSection';
import DashboardSection, { AnalysisData } from '../components/DashboardSection';
import StudioSection from '../components/StudioSection';
import { usePreferences } from '../components/PreferencesProvider';
import { authRequest, cachedUser, clearSession, type SessionUser } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type ColumnRow = {
  nutrient: string;
  unit: string;
  perPortion: number | null;
  per100g: number | null;
  assumed: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { ocrLanguage, profile, rememberScan, reduceMotion, speak } = usePreferences();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  const [serving, setServing] = useState<number | null>(null);
  const [columnNote, setColumnNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Reading food label...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ColumnRow[] | null>(null);
  const [comparison, setComparison] = useState<{ raw: GradeLetter; corrected: GradeLetter; note: string } | null>(null);
  const [compareError, setCompareError] = useState('');
  const [compareBusy, setCompareBusy] = useState(false);

  useEffect(() => {
    const existing = cachedUser();
    if (!existing) {
      router.replace('/login');
      return;
    }
    setUser(existing);
    authRequest('/me').catch(() => {
      clearSession();
      router.replace('/login');
    });
  }, [router]);

  const handleAnalyze = async (scanId: string, file?: File | null) => {
    let analysisScanId = scanId;
    let productName = 'Scanned label';
    let ingredients: string[] = [];
    let ocrColumns: ColumnRow[] | null = null;
    let reading: { columnOrder?: string; meanBoxConfidence?: number; readersDisagree?: string[] } | undefined;
    try {
      setIsLoading(true);
      setError(null);
      setLoadingStep('Reading food label...');
      setLoadingProgress(20);

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('languages', ocrLanguage);
        setLoadingStep('Running OCR...');
        setLoadingProgress(35);

        const ocrResponse = await fetch(`${API_URL}/api/v1/ocr/extract`, { method: 'POST', body: formData });
        if (!ocrResponse.ok) throw new Error(`OCR failed: ${ocrResponse.status}`);
        const ocrResult = await ocrResponse.json();
        if (ocrResult.status !== 'success') throw new Error(ocrResult.message ?? 'OCR extraction failed');

        const parsed = ocrResult.data?.parsedLabel;
        if (parsed) {
          ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
          ocrColumns = toColumns(parsed.nutrition ?? {});
          reading = {
            columnOrder: parsed.columnOrder,
            meanBoxConfidence: typeof ocrResult.data?.confidence === 'number' ? ocrResult.data.confidence : undefined,
            readersDisagree: parsed.readersDisagree ?? parsed.reading?.readersDisagree ?? [],
          };
          setColumns(ocrColumns);
          setServing(parsed.servingSizeGrams ?? null);
          setColumnNote(parsed.columnOrder ?? '');
          if (parsed.productName) productName = parsed.productName;
        }
        if (ocrResult.data?.scanId) analysisScanId = ocrResult.data.scanId;
        setLoadingProgress(55);
      }

      setLoadingStep('Analyzing nutrition...');
      setLoadingProgress(70);
      const analysisResponse = await fetch(`${API_URL}/api/v1/analysis/scan/${analysisScanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, reading }),
      });
      if (!analysisResponse.ok) throw new Error(`Analysis failed: ${analysisResponse.status}`);
      const analysisResult = await analysisResponse.json();
      if (analysisResult.status !== 'success' || !analysisResult.data) {
        throw new Error(analysisResult.message ?? 'Analysis failed');
      }

      const data = analysisResult.data as AnalysisData;
      const nextColumns = data.analysis.nutrition.table?.length
        ? data.analysis.nutrition.table.map((row) => ({
          nutrient: row.nutrient,
          unit: row.unit ?? '',
          perPortion: row.perPortion,
          per100g: row.per100g,
          assumed: false,
        }))
        : null;
      const displayed = nextColumns ?? ocrColumns;
      if (displayed) {
        setColumns(displayed);
        setBaseline(displayed.map((row) => ({ ...row })));
      }
      setComparison(null);
      setCompareError('');
      setAnalysisData(data);
      rememberScan({
        id: data.scanId,
        productName,
        grade: data.analysis.nutritionPrediction?.result?.predictedGrade ?? null,
        riskLevel: data.analysis.riskLevel,
        allergens: (data.analysis.ingredientAnalysis?.allergens ?? []).map((item) =>
          typeof item === 'string' ? item : String((item as { ingredient?: string }).ingredient ?? ''),
        ).filter(Boolean),
        ingredients,
        per100g: toNutrients(displayed ?? []),
        summary: data.report?.summary ?? '',
        personalStatus: data.analysis.personalFit?.status ?? 'NO_PROFILE',
        trustScore: data.trustScore?.score ?? null,
      });
      const spokenGrade = data.analysis.nutritionPrediction?.status === 'WITHHELD'
        ? 'Grade withheld.'
        : `Grade ${data.analysis.nutritionPrediction?.result?.predictedGrade ?? 'unavailable'}.`;
      speak(`${productName}. ${spokenGrade}`);
      setLoadingProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while analyzing the label.');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        document.getElementById('dashboard')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 400);
    }
  };

  const changed = baseline ? changedRows(baseline, columns) : [];

  const recompute = async () => {
    if (!baseline || changed.length !== 1) return;
    setCompareBusy(true);
    setCompareError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/nutrition/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servingSizeGrams: 100,
          raw: nutritionPayload(baseline),
          corrected: nutritionPayload(columns),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'Could not recompute the grade.');
      setComparison(payload.data);
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'Could not recompute the grade.');
    } finally {
      setCompareBusy(false);
    }
  };

  const signOut = async () => {
    await authRequest('/logout', {}).catch(() => undefined);
    clearSession();
    router.push('/');
  };

  if (!user) {
    return <main className="min-h-screen bg-[#07080d] p-6 text-slate-300 sm:p-10">Checking your session...</main>;
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#07080d] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07080d]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-bold text-white">NutriLens</Link>
          <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-4">
            <Link href="/terms" className="hidden text-slate-400 hover:text-white sm:inline">Terms</Link>
            <span className="max-w-[8rem] truncate text-slate-300 min-[420px]:max-w-[14rem]">{user.email}</span>
            <button type="button" onClick={signOut} className="shrink-0 rounded-full border border-white/15 px-3 py-2 hover:border-emerald-400/40 sm:px-4">Sign out</button>
          </div>
        </div>
      </header>

      <ScanSection
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        loadingStep={loadingStep}
        loadingProgress={loadingProgress}
        error={error}
        onResetError={() => setError(null)}
      />

      {columns.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <h2 className="text-2xl font-bold text-white">Portion and per 100 g</h2>
          <p className="mt-2 text-sm text-slate-400">
            {serving ? `Packet portion: ${serving} g. ` : ''}
            {columns.every((row) => row.per100g == null)
              ? 'This label only printed a portion, so the per 100 g column stays blank.'
              : columnNote === 'unknown'
                ? 'The label did not name both columns, so the left number is shown as the portion and the right number as per 100 g.'
                : 'Values follow the column headings read from the label. The model uses the per 100 g figure.'}
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Nutrient</th>
                  <th className="px-4 py-3 font-medium">Portion{serving ? ` (${serving} g)` : ''}</th>
                  <th className="px-4 py-3 font-medium">Per 100 g</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((row) => (
                  <tr key={row.nutrient} className="border-t border-white/10">
                    <th className="px-4 py-3 font-medium text-white">{row.nutrient}</th>
                    <td className="px-4 py-3">{formatCell(row.perPortion, row.unit)}</td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`cell-${row.nutrient}`}>Correct {row.nutrient} per 100 g</label>
                      <input
                        id={`cell-${row.nutrient}`}
                        inputMode="decimal"
                        value={row.per100g ?? ''}
                        onChange={(event) => {
                          const next = event.target.value;
                          setColumns((current) => current.map((item) => item.nutrient === row.nutrient
                            ? { ...item, per100g: next === '' ? null : Number(next) }
                            : item));
                          setComparison(null);
                        }}
                        className="w-28 rounded-lg border border-white/15 bg-black px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-slate-400">
              {changed.length === 1
                ? `One cell changed: ${changed[0]?.nutrient}. The grade below compares the raw read with this correction.`
                : 'Change one per 100 g cell. A second edit would mix two corrections into one comparison.'}
            </p>
            <button
              type="button"
              disabled={changed.length !== 1 || compareBusy}
              onClick={() => void recompute()}
              className="w-fit rounded-full bg-emerald-400 px-5 py-2 font-semibold text-slate-950 disabled:opacity-50"
            >
              {compareBusy ? 'Recomputing…' : 'Recompute from this correction'}
            </button>
            {compareError && <p className="text-sm text-red-200">{compareError}</p>}
            {comparison && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
                <p>Model letter on the raw read: {comparison.raw.grade ?? comparison.raw.withheld ?? 'withheld'}.</p>
                <p className="mt-1">Model letter after this one correction: {comparison.corrected.grade ?? comparison.corrected.withheld ?? 'withheld'}.</p>
                <p className="mt-2 text-slate-400">{comparison.note}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {analysisData && <DashboardSection data={analysisData} />}
      <StudioSection />
    </main>
  );
}

function formatCell(value: number | null, unit: string) {
  if (value === null || value === undefined) return '—';
  return `${value} ${unit}`.trim();
}

type GradeLetter = { grade: string | null; withheld: string | null };

const NUTRIENT_FIELDS = ['energy', 'fat', 'saturatedFat', 'carbohydrates', 'sugars', 'fiber', 'proteins', 'salt'] as const;

function nutritionPayload(rows: ColumnRow[]) {
  const nutrition: Record<string, number> = {};
  for (const row of rows) {
    if (row.per100g === null || Number.isNaN(row.per100g)) continue;
    const key = row.nutrient === 'protein' ? 'proteins' : row.nutrient;
    if ((NUTRIENT_FIELDS as readonly string[]).includes(key)) nutrition[key] = row.per100g;
  }
  return nutrition;
}

function toNutrients(rows: ColumnRow[]) {
  const payload = nutritionPayload(rows);
  if (NUTRIENT_FIELDS.some((key) => typeof payload[key] !== 'number')) return null;
  return {
    energy: payload.energy,
    fat: payload.fat,
    saturatedFat: payload.saturatedFat,
    carbohydrates: payload.carbohydrates,
    sugars: payload.sugars,
    fiber: payload.fiber,
    proteins: payload.proteins,
    salt: payload.salt,
  };
}

function changedRows(raw: ColumnRow[], next: ColumnRow[]) {
  return next.filter((row) => {
    const previous = raw.find((item) => item.nutrient === row.nutrient);
    return previous && previous.per100g !== row.per100g;
  });
}

function toColumns(nutrition: Record<string, {
  value?: number;
  unit?: string;
  perPortion?: { value: number; unit: string } | null;
  per100g?: { value: number; unit: string } | null;
  basis?: string;
  assumedColumnOrder?: boolean;
}>): ColumnRow[] {
  return Object.entries(nutrition).map(([nutrient, detail]) => ({
    nutrient,
    unit: detail.per100g?.unit || detail.perPortion?.unit || detail.unit || '',
    perPortion: detail.perPortion?.value ?? (detail.basis === 'perPortion' ? detail.value ?? null : null),
    per100g: detail.per100g?.value ?? (detail.basis === 'per100g' ? detail.value ?? null : null),
    assumed: Boolean(detail.assumedColumnOrder),
  }));
}
