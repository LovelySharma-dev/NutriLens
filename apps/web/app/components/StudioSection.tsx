'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, History, ScanBarcode, ShieldCheck, UserRound, Volume2 } from 'lucide-react';
import { usePreferences } from './PreferencesProvider';
import { ALLERGEN_OPTIONS, CATALOG, assessFit, safeShelf, screeningGrade, type CatalogProduct, type DietId, type Nutrients } from '../lib/safety';
import { auditTable, formulaGrade } from '../lib/readingAudit';
import { checkBarcode } from '../lib/barcode';
import { agreementSummary } from '../lib/household';
import findings from '../lib/letter-stability.json';
import factorial from '../lib/factorial-agreement.json';
import { matcherAudit } from '../lib/matcher-audit';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const DIETS: Array<{ id: DietId; key: 'vegan' | 'vegetarian' | 'jain' | 'diabetic' | 'sodium' | 'protein' }> = [
  { id: 'vegan', key: 'vegan' },
  { id: 'vegetarian', key: 'vegetarian' },
  { id: 'jain', key: 'jain' },
  { id: 'diabetic-screen', key: 'diabetic' },
  { id: 'low-sodium', key: 'sodium' },
  { id: 'high-protein', key: 'protein' },
];

const OCR_LANGUAGES = [
  ['en', 'English'],
  ['hi', 'Hindi'],
  ['fr', 'French'],
  ['es', 'Spanish'],
  ['de', 'German'],
  ['ta', 'Tamil'],
  ['bn', 'Bengali'],
  ['mr', 'Marathi'],
] as const;

const NUTRIENT_KEYS: Array<keyof Nutrients> = ['energy', 'sugars', 'saturatedFat', 'salt', 'fiber', 'proteins'];

type Tab = 'profile' | 'shelf' | 'history' | 'compare' | 'lookup' | 'stability';
type StabilityCorpus = 'reference-shelf' | 'constructed-bands';

type LookupProduct = {
  name: string;
  brand: string;
  allergens: string[];
  ingredients: string[];
  per100g: Nutrients;
  source: string;
};

export default function StudioSection() {
  const prefs = usePreferences();
  const [tab, setTab] = useState<Tab>('profile');
  const [draftName, setDraftName] = useState(prefs.profile.name);
  useEffect(() => {
    setDraftName(prefs.profile.name);
  }, [prefs.profile.name]);
  const [notice, setNotice] = useState('');
  const [leftId, setLeftId] = useState(CATALOG[0]?.id ?? '');
  const [rightId, setRightId] = useState(CATALOG[2]?.id ?? '');
  const [barcode, setBarcode] = useState('');
  const [lookup, setLookup] = useState<LookupProduct | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [stabilityCorpus, setStabilityCorpus] = useState<StabilityCorpus>('reference-shelf');
  const [stabilityId, setStabilityId] = useState(findings.corpora['reference-shelf'].rows[0]?.id ?? '');

  const shelf = useMemo(() => safeShelf(prefs.profile), [prefs.profile]);
  const household = prefs.household ?? [];
  const agreement = useMemo(() => agreementSummary(household), [household]);
  const conflicts = prefs.history.filter((item) => item.personalStatus === 'CONFLICT').length;

  const toggleAllergen = (allergen: string) => {
    const allergens = prefs.profile.allergens.includes(allergen)
      ? prefs.profile.allergens.filter((item) => item !== allergen)
      : [...prefs.profile.allergens, allergen];
    prefs.update({ profile: { ...prefs.profile, allergens } });
  };

  const toggleDiet = (diet: DietId) => {
    const diets = prefs.profile.diets.includes(diet)
      ? prefs.profile.diets.filter((item) => item !== diet)
      : [...prefs.profile.diets, diet];
    prefs.update({ profile: { ...prefs.profile, diets } });
  };

  const save = () => {
    const profile = { ...prefs.profile, name: draftName.trim() };
    prefs.saveProfile(profile);
    setNotice(prefs.t('saved'));
    prefs.speak(`${prefs.t('saved')}. ${profile.allergens.length} allergens.`);
  };

  const readShelf = () => {
    const names = shelf.map((item) => item.product.name).join(', ') || prefs.t('emptyShelf');
    prefs.speak(`${prefs.t('shelf')}. ${names}`);
  };

  const searchBarcode = async () => {
    setLookupBusy(true);
    setLookupError('');
    setLookup(null);
    const code = barcode.replace(/\D/g, '');
    const checked = checkBarcode(code);
    if (!checked.ok) {
      setLookupError(checked.reason ?? 'That barcode did not pass the check digit.');
      setLookupBusy(false);
      return;
    }
    try {
      let product: LookupProduct | null = null;
      const api = await fetch(`${API_URL}/api/v1/studio/barcode/${checked.digits}`);
      if (api.ok) {
        product = (await api.json()).data as LookupProduct;
      } else if (api.status === 400) {
        const body = await api.json();
        throw new Error(body.message ?? 'That barcode did not pass the check digit.');
      } else {
        const direct = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
        const payload = await direct.json();
        if (payload.status !== 1) throw new Error('No public product record was found.');
        const nutriments = payload.product.nutriments ?? {};
        product = {
          name: payload.product.product_name || 'Unknown product',
          brand: payload.product.brands || '',
          allergens: (payload.product.allergens_tags ?? []).map((tag: string) => tag.replace(/^en:/, '').replace(/-/g, ' ')),
          ingredients: String(payload.product.ingredients_text || '').split(',').map((part) => part.trim()).filter(Boolean),
          per100g: {
            energy: Number(nutriments['energy-kcal_100g'] ?? 0),
            fat: Number(nutriments.fat_100g ?? 0),
            saturatedFat: Number(nutriments['saturated-fat_100g'] ?? 0),
            carbohydrates: Number(nutriments.carbohydrates_100g ?? 0),
            sugars: Number(nutriments.sugars_100g ?? 0),
            fiber: Number(nutriments.fiber_100g ?? 0),
            proteins: Number(nutriments.proteins_100g ?? 0),
            salt: Number(nutriments.salt_100g ?? 0),
          },
          source: 'Open Food Facts',
        };
      }
      setLookup(product);
      const fit = assessFit({ ...product, additives: false }, prefs.profile);
      const sentence = fit.safe
        ? `${product.name} matches your current profile on the available public data.`
        : `${product.name}. ${fit.reasons[0]}`;
      prefs.speak(sentence);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Lookup failed');
    } finally {
      setLookupBusy(false);
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'profile', label: prefs.t('profile'), icon: <UserRound className="w-4 h-4" aria-hidden="true" /> },
    { id: 'shelf', label: prefs.t('shelf'), icon: <ShieldCheck className="w-4 h-4" aria-hidden="true" /> },
    { id: 'history', label: prefs.t('history'), icon: <History className="w-4 h-4" aria-hidden="true" /> },
    { id: 'compare', label: prefs.t('compare'), icon: <BarChart3 className="w-4 h-4" aria-hidden="true" /> },
    { id: 'lookup', label: prefs.t('lookup'), icon: <ScanBarcode className="w-4 h-4" aria-hidden="true" /> },
    { id: 'stability', label: prefs.t('stability'), icon: <Activity className="w-4 h-4" aria-hidden="true" /> },
  ];

  return (
    <section id="studio" className="relative scroll-mt-28 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-emerald-400/20 bg-[#0c1220] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300 sm:tracking-[0.2em]">NutriLens</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-4xl">{prefs.t('studio')}</h2>
            <p className="mt-2 max-w-2xl text-base text-slate-300">{prefs.t('shelfNote')}</p>
          </div>
          <p className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200">
            {prefs.t('pantry')}: {prefs.history.length} scans, {conflicts} profile conflicts, {shelf.length} shelf matches.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-200">
            {prefs.t('language')}
            <select className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" value={prefs.language} onChange={(event) => prefs.update({ language: event.target.value as typeof prefs.language })}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </label>
          <label className="text-sm text-slate-200">
            {prefs.t('ocrLanguage')}
            <select className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2" value={prefs.ocrLanguage} onChange={(event) => prefs.update({ ocrLanguage: event.target.value })}>
              {OCR_LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap content-end gap-2 sm:col-span-2">
            <Toggle pressed={prefs.contrast} onClick={() => prefs.update({ contrast: !prefs.contrast })}>{prefs.t('contrast')}</Toggle>
            <Toggle pressed={prefs.textScale > 0} onClick={() => prefs.update({ textScale: prefs.textScale === 2 ? 0 : ((prefs.textScale + 1) as 0 | 1 | 2) })}>{prefs.t('text')}</Toggle>
            <Toggle pressed={prefs.reduceMotion} onClick={() => prefs.update({ reduceMotion: !prefs.reduceMotion, plainCursor: !prefs.reduceMotion || prefs.plainCursor })}>{prefs.t('motion')}</Toggle>
            <Toggle pressed={prefs.readAloud} onClick={() => prefs.update({ readAloud: !prefs.readAloud })}>{prefs.t('vision')}</Toggle>
            <Toggle pressed={prefs.hearingCaptions} onClick={() => prefs.update({ hearingCaptions: !prefs.hearingCaptions })}>{prefs.t('hearing')}</Toggle>
            <Toggle pressed={prefs.plainCursor} onClick={() => prefs.update({ plainCursor: !prefs.plainCursor })}>{prefs.t('cursor')}</Toggle>
          </div>
        </div>

        <div role="tablist" aria-label={prefs.t('studio')} className="mt-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === item.id ? 'bg-emerald-400 text-slate-950' : 'border border-white/15 text-white'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6" role="tabpanel">
          {tab === 'profile' && (
            <div className="space-y-5">
              <label className="block text-sm text-slate-200">
                {prefs.t('name')}
                <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="mt-1 w-full max-w-md rounded-xl border border-white/15 bg-black px-3 py-2" />
              </label>
              <fieldset>
                <legend className="text-sm font-semibold text-white">{prefs.t('allergens')}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <Toggle key={allergen} pressed={prefs.profile.allergens.includes(allergen)} onClick={() => toggleAllergen(allergen)}>{allergen}</Toggle>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold text-white">{prefs.t('diets')}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETS.map((diet) => (
                    <Toggle key={diet.id} pressed={prefs.profile.diets.includes(diet.id)} onClick={() => toggleDiet(diet.id)}>{prefs.t(diet.key)}</Toggle>
                  ))}
                  <Toggle pressed={prefs.profile.avoidAdditives} onClick={() => prefs.update({ profile: { ...prefs.profile, avoidAdditives: !prefs.profile.avoidAdditives } })}>{prefs.t('additives')}</Toggle>
                </div>
              </fieldset>
              <button type="button" onClick={save} className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-slate-950">{prefs.t('save')}</button>
              {notice && <p className="text-sm text-emerald-200">{notice}</p>}
            </div>
          )}

          {tab === 'shelf' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white">{prefs.t('household')}</h3>
                <p className="mt-1 text-sm text-slate-300">{prefs.t('householdNote')}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {agreement.measured
                    ? `${agreement.agrees} of ${agreement.answered} week-later answers still agreed. ${agreement.due - agreement.answered} due answers are still open.`
                    : prefs.t('weekEmpty')}
                </p>
                {household.length === 0 ? <p className="mt-3 text-slate-200">Confirm a finished scan to start this shelf.</p> : (
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {household.map((item) => {
                      const due = Date.parse(item.followUpAt) <= Date.now();
                      return (
                        <li key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <h4 className="font-semibold text-white">{item.productName}</h4>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.fitAtConfirm.safe ? 'At confirmation, the preference check found no conflict.' : item.fitAtConfirm.reasons[0]}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Ask again {new Date(item.followUpAt).toLocaleDateString()}</p>
                          {due && item.weekLaterAgrees === null && (
                            <div className="mt-3">
                              <p className="text-sm text-slate-200">{prefs.t('weekLater')}</p>
                              <div className="mt-2 flex gap-2">
                                <button type="button" onClick={() => prefs.answerWeekLater(item.id, true)} className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-semibold text-slate-950">{prefs.t('weekYes')}</button>
                                <button type="button" onClick={() => prefs.answerWeekLater(item.id, false)} className="rounded-full border border-white/20 px-3 py-1 text-sm">{prefs.t('weekNo')}</button>
                              </div>
                            </div>
                          )}
                          {item.weekLaterAgrees !== null && (
                            <p className="mt-2 text-sm text-emerald-200">{item.weekLaterAgrees ? prefs.t('weekYes') : prefs.t('weekNo')}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div>
                <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{prefs.t('referenceShelf')}</h3>
                    <p className="text-sm text-slate-300">{shelf.length} matches. These twelve foods are a demonstration. Screen is the traffic-light grade. Formula is the 2017 Nutri-Score foods table, with fruit percent counted as zero.</p>
                  </div>
                  <button type="button" onClick={readShelf} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm">
                    <Volume2 className="w-4 h-4" aria-hidden="true" /> {prefs.t('readAloud')}
                  </button>
                </div>
                {shelf.length === 0 ? <p className="text-slate-200">{prefs.t('emptyShelf')}</p> : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {shelf.map(({ product, fit }) => <ProductCard key={product.id} product={product} grade={fit.grade} />)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {tab === 'history' && (
            prefs.history.length === 0 ? <p className="text-slate-200">{prefs.t('noHistory')}</p> : (
              <ul className="space-y-3">
                {prefs.history.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-white">{item.productName}</h3>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{item.grade ?? '—'} · {item.personalStatus}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{item.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()} {item.allergens.length ? `· ${item.allergens.join(', ')}` : ''}</p>
                    {item.per100g && (
                      <button
                        type="button"
                        onClick={() => {
                          const fit = assessFit({
                            per100g: item.per100g!,
                            allergens: item.allergens,
                            ingredients: item.ingredients ?? [],
                            additives: false,
                          }, prefs.profile);
                          prefs.confirmHousehold({
                            id: item.id,
                            productName: item.productName,
                            per100g: item.per100g!,
                            allergens: item.allergens,
                            ingredients: item.ingredients ?? [],
                            fitAtConfirm: { safe: fit.safe, reasons: fit.reasons },
                          });
                        }}
                        className="mt-3 rounded-full border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200"
                      >
                        {prefs.t('confirmScan')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )
          )}

          {tab === 'compare' && (
            <ComparePanel leftId={leftId} rightId={rightId} setLeftId={setLeftId} setRightId={setRightId} hint={prefs.t('compareHint')} />
          )}

          {tab === 'lookup' && (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void searchBarcode(); }}>
              <p className="text-sm text-slate-300">{prefs.t('barcodeHint')}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="barcode">Barcode</label>
                <input id="barcode" inputMode="numeric" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="8901234567890" className="w-full rounded-xl border border-white/15 bg-black px-3 py-2" />
                <button type="submit" disabled={lookupBusy} className="rounded-full bg-emerald-400 px-5 py-2 font-semibold text-slate-950 disabled:opacity-60">{prefs.t('barcodeAction')}</button>
              </div>
              {lookupError && <p className="text-sm text-red-200">{lookupError}</p>}
              {lookup && <LookupResult product={lookup} />}
            </form>
          )}

          {tab === 'stability' && (
            <StabilityPanel
              corpus={stabilityCorpus}
              rowId={stabilityId}
              note={prefs.t('stabilityNote')}
              factorialNote={prefs.t('factorialNote')}
              claimLead={prefs.t('claimLead')}
              stableOnGrid={prefs.t('stableOnGrid')}
              screeningBeside={prefs.t('screeningBeside')}
              onCorpus={(next) => {
                setStabilityCorpus(next);
                setStabilityId(findings.corpora[next].rows[0]?.id ?? '');
              }}
              onRow={setStabilityId}
              onSpeak={prefs.speak}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`rounded-full px-3 py-2 text-sm ${pressed ? 'bg-lime-300 text-slate-950' : 'border border-white/15 text-white'}`}>
      {children}
    </button>
  );
}

function ProductCard({ product, grade }: { product: CatalogProduct; grade: string }) {
  const formula = formulaGrade(product.per100g);
  const formulaLetter = formula.status === 'ready' ? formula.letter : '—';
  return (
    <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{product.name}</h3>
          <p className="text-sm text-slate-400">{product.category}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">Screen {grade}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formulaLetter === 'D' || formulaLetter === 'E' ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-white'}`}>Formula {formulaLetter}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">
        {product.per100g.proteins} g protein · {product.per100g.sugars} g sugars · {product.per100g.salt} g salt
      </p>
      <p className="mt-1 text-xs text-slate-500">{product.allergens.length ? product.allergens.join(', ') : 'No listed allergen in the reference record'}</p>
    </li>
  );
}

function ComparePanel({ leftId, rightId, setLeftId, setRightId, hint }: { leftId: string; rightId: string; setLeftId: (id: string) => void; setRightId: (id: string) => void; hint: string }) {
  const left = CATALOG.find((item) => item.id === leftId) ?? CATALOG[0];
  const right = CATALOG.find((item) => item.id === rightId) ?? CATALOG[1];
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ProductSelect id="compare-left" value={left?.id ?? ''} onChange={setLeftId} />
        <ProductSelect id="compare-right" value={right?.id ?? ''} onChange={setRightId} />
      </div>
      {left && right && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="py-2 font-medium">Per 100 g</th>
              <th className="py-2 font-medium">{left.name}</th>
              <th className="py-2 font-medium">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            {NUTRIENT_KEYS.map((key) => (
              <tr key={key} className="border-t border-white/10">
                <th className="py-2 font-medium text-slate-200">{key}</th>
                <td>{left.per100g[key]}</td>
                <td className={right.per100g[key] < left.per100g[key] ? 'text-emerald-300' : 'text-slate-200'}>{right.per100g[key]}</td>
              </tr>
            ))}
            <tr className="border-t border-white/10">
              <th className="py-2 font-medium text-slate-200">Screen letter</th>
              <td>{screeningGrade(left.per100g)}</td>
              <td>{screeningGrade(right.per100g)}</td>
            </tr>
            <tr className="border-t border-white/10">
              <th className="py-2 font-medium text-slate-200">Formula letter</th>
              <td>{formulaText(left.per100g)}</td>
              <td>{formulaText(right.per100g)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function formulaText(nutrients: Nutrients) {
  const formula = formulaGrade(nutrients);
  if (formula.status !== 'ready') return 'uncomputed';
  const points = formula.margin.points;
  return `${formula.letter}, ${points} point${points === 1 ? '' : 's'} from ${formula.margin.toward.join(' or ')}`;
}

function ProductSelect({ id, value, onChange }: { id: string; value: string; onChange: (id: string) => void }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-white/15 bg-black px-3 py-2">
      {CATALOG.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
    </select>
  );
}

const PAIR_LABEL = {
  forestScreen: { title: 'Forest and screening', right: 'Screening' },
  forestFormula: { title: 'Forest and formula', right: 'Formula' },
  screenFormula: { title: 'Screening and formula', right: 'Formula' },
} as const;

type PairKey = keyof typeof PAIR_LABEL;

function FactorialBlock({ note, claimLead, onSpeak }: { note: string; claimLead: string; onSpeak: (text: string) => void }) {
  const [pairKey, setPairKey] = useState<PairKey>('forestScreen');
  const pair = factorial.pairs[pairKey];
  const label = PAIR_LABEL[pairKey];
  const audit = matcherAudit();
  const misses = audit.rows.filter((row) => row.expect === 'miss').map((row) => row.text);
  const alarms = audit.rows.filter((row) => row.expect === 'false-alarm').map((row) => row.text);
  const nearest = Object.entries(factorial.probes.nearestFlipByFeature)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);
  const shelf = factorial.shelf.forestScreen;
  const exact = factorial.pairs.forestScreen;
  const odd = factorial.anatomy.oddReader;
  const topMismatch = factorial.anatomy.forestScreenOffDiagonal[0];
  const shuffled = factorial.anatomy.forestScreenPermutation;
  const spoken = `${claimLead} Exact kappa ${exact.kappa}. Linear weighted kappa ${exact.linearWeightedKappa}. Within one letter, ${exact.withinOneLetter.k} of ${exact.withinOneLetter.n}. Screening is the odd letter on ${odd.screeningOdd} tables. ${label.title}: observed ${pair.observed}, kappa ${pair.kappa}.`;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-base font-semibold text-white">{claimLead}</p>
      <p>
        Exact-letter kappa is {exact.kappa}. Counting a one-letter miss as a quarter of an A-versus-E miss, linear weighted kappa is {exact.linearWeightedKappa}.
        Forest and screening stay within one letter on {exact.withinOneLetter.k} of {exact.withinOneLetter.n} tables
        {' '}(Wilson {exact.withinOneLetter.low} to {exact.withinOneLetter.high}).
        The largest mismatch is forest {topMismatch.forest} with screening {topMismatch.screening}, {topMismatch.n} tables.
        When the three letters are not the same, screening is the odd letter on {odd.screeningOdd} tables, the forest on {odd.forestOdd}, and the formula on {odd.formulaOdd}.
        Shuffling the screening letters {shuffled.draws} times left a null median of {shuffled.nullMedian}. {shuffled.nullsAtOrAboveObserved} of those draws reached the observed kappa.
      </p>
      <p>{note}</p>
      <p>
        {factorial.design.tables} declared tables. Energy is the 4/4/9/2 estimate, so the energy check flags {factorial.energyCheckFlagged}.
        All three letters agree on {factorial.threeWayAgreement.k} of {factorial.threeWayAgreement.n}
        {' '}(Wilson {factorial.threeWayAgreement.low} to {factorial.threeWayAgreement.high}).
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PAIR_LABEL) as PairKey[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={pairKey === key}
            onClick={() => setPairKey(key)}
            className={`rounded-full px-4 py-2 font-semibold ${pairKey === key ? 'bg-lime-300 text-slate-950' : 'border border-white/15 text-white'}`}
          >
            {PAIR_LABEL[key].title}
          </button>
        ))}
        <button type="button" onClick={() => onSpeak(spoken)} className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-emerald-200">
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          Read this pair
        </button>
      </div>
      <p>
        {label.title}: {pair.agreed} of {pair.n} tables share a letter.
        Observed agreement {pair.observed}. Chance agreement {pair.chance}. Cohen&apos;s kappa {pair.kappa}.
        Wilson 95% interval on that share: {pair.wilson.low} to {pair.wilson.high}.
        Mean distance {pair.meanAbsoluteLetterSteps} letter steps.
        {label.right} is harsher by two or more letters on {pair.rightHarsherByTwoOrMore} tables and milder on {pair.rightMilderByTwoOrMore}.
      </p>
      <p>
        A one-cell probe moves the forest letter on {factorial.probes.tablesWithAFlip} of {factorial.design.tables} tables
        {' '}(Wilson {factorial.probes.tablesWithAFlipWilson.low} to {factorial.probes.tablesWithAFlipWilson.high}).
        Close margin: {factorial.probes.byMarginBucket.close.flips} of {factorial.probes.byMarginBucket.close.accepted} accepted probes.
        Mid: {factorial.probes.byMarginBucket.mid.flips} of {factorial.probes.byMarginBucket.mid.accepted}.
        Wide: {factorial.probes.byMarginBucket.wide.flips} of {factorial.probes.byMarginBucket.wide.accepted}.
        Nearest moves: {nearest.map(([feature, count]) => `${nutrientName(feature)} ${count}`).join(', ')}.
      </p>
      <p className="text-slate-400">
        The twelve-food shelf agrees on {shelf.agreed} of {shelf.n}. Its Wilson interval is {shelf.wilson.low} to {shelf.wilson.high}, and its kappa is {shelf.kappa}. That interval is too wide to be the headline.
      </p>
      <p>
        Matcher fixture, {audit.rows.length} lines: {audit.hits} hits, {audit.misses} misses ({misses.join(', ')}), {audit.falseAlarms} false alarms ({alarms.join(', ')}), {audit.clears} clears.
        {audit.failed.length ? ` Failed: ${audit.failed.join(', ')}.` : ' Every line matched its expected mode.'}
      </p>
    </div>
  );
}

function StabilityPanel({
  corpus,
  rowId,
  note,
  factorialNote,
  claimLead,
  stableOnGrid,
  screeningBeside,
  onCorpus,
  onRow,
  onSpeak,
}: {
  corpus: StabilityCorpus;
  rowId: string;
  note: string;
  factorialNote: string;
  claimLead: string;
  stableOnGrid: string;
  screeningBeside: string;
  onCorpus: (next: StabilityCorpus) => void;
  onRow: (id: string) => void;
  onSpeak: (text: string) => void;
}) {
  const selected = findings.corpora[corpus];
  const summary = selected.summary;
  const row = selected.rows.find((item) => item.id === rowId) ?? selected.rows[0];
  const audit = row?.per100g ? auditTable(row.per100g) : null;
  const formulaLetter = audit?.status === 'ready' ? audit.formula.letter : null;
  const nearest = row?.nearestFlip;
  const spoken = row
    ? `${note} Forest ${row.forest}. Screening ${row.screening}. ${formulaLetter ? `Formula ${formulaLetter}.` : ''} ${nearest ? `${nutrientName(nearest.feature)} times ${nearest.factor} moves the forest letter to ${nearest.grade}.` : stableOnGrid}`
    : note;

  return (
    <div className="space-y-4 text-sm text-slate-200">
      <p className="text-slate-300">{note}</p>
      <FactorialBlock note={factorialNote} claimLead={claimLead} onSpeak={onSpeak} />
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={corpus === 'reference-shelf'} onClick={() => onCorpus('reference-shelf')} className={`rounded-full px-4 py-2 font-semibold ${corpus === 'reference-shelf' ? 'bg-emerald-400 text-slate-950' : 'border border-white/15 text-white'}`}>Reference shelf</button>
        <button type="button" aria-pressed={corpus === 'constructed-bands'} onClick={() => onCorpus('constructed-bands')} className={`rounded-full px-4 py-2 font-semibold ${corpus === 'constructed-bands' ? 'bg-emerald-400 text-slate-950' : 'border border-white/15 text-white'}`}>Constructed tables</button>
        <button type="button" onClick={() => onSpeak(spoken)} className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2 text-emerald-200">
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          Read aloud
        </button>
      </div>
      <p>
        Forest letter matched the screening letter on {summary.exactLetterAgreement} of {summary.tables} tables.
        Mean absolute distance is {summary.meanAbsoluteLetterSteps} letter steps.
        {summary.tablesWithAFlip} tables have at least one accepted probe that moves the forest letter.
      </p>
      <ul className="space-y-1 text-slate-300">
        {(['close', 'mid', 'wide'] as const).map((bucket) => {
          const item = summary.byMarginBucket[bucket];
          const share = item.flipShareOfAccepted == null ? 'no accepted probes' : `${item.flips} of ${item.accepted} accepted probes moved the letter`;
          return <li key={bucket}>{bucket} margin, {findings.marginBuckets[bucket]}: {item.tables} tables, {share}.</li>;
        })}
      </ul>
      <p className="text-slate-400">{screeningBeside} The aggregate flip share is {summary.flipShareOfAccepted}. Read it beside the margin buckets. Rejected probes: {summary.rejected}.</p>
      {row && (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <label className="block text-slate-300" htmlFor="stability-row">
            Table
            <select id="stability-row" value={row.id} onChange={(event) => onRow(event.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-white">
              {selected.rows.map((item) => <option key={item.id} value={item.id}>{rowLabel(item.id)}</option>)}
            </select>
          </label>
          <p className="mt-3">Forest {row.forest.toUpperCase()}. Screening {row.screening}.{formulaLetter ? ` Formula ${formulaLetter}.` : ''} Margin {row.margin} ({row.marginBucket}).</p>
          <p className="mt-2">{nearest ? `Nearest grid change: ${nutrientName(nearest.feature)} × ${nearest.factor} (${nearest.fromValue} to ${nearest.toValue}) moves the forest letter to ${nearest.grade.toUpperCase()}.` : stableOnGrid}</p>
          <p className="mt-2 text-slate-400">{row.flips} of {row.accepted} accepted probes moved this letter. {row.rejected} were rejected.</p>
        </div>
      )}
    </div>
  );
}

function rowLabel(id: string) {
  return CATALOG.find((item) => item.id === id)?.name ?? id.replaceAll('-', ' ');
}

function nutrientName(feature: string) {
  return feature.replace(/_100g$/, '').replaceAll('-', ' ').replace('proteins', 'protein');
}

function LookupResult({ product }: { product: LookupProduct }) {
  const { profile } = usePreferences();
  const fit = assessFit({ ...product, additives: false }, profile);
  return (
    <div className={`rounded-2xl border p-4 ${fit.safe ? 'border-emerald-400/40' : 'border-red-400/40'}`}>
      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
      <p className="text-sm text-slate-400">{product.brand} · {product.source}</p>
      <p className="mt-2 text-sm text-slate-200">
        {fit.safe
          ? `Screening grade ${fit.grade}. Formula letter ${formulaText(product.per100g)}. No profile conflict in the public record. A missing public nutrient is already stored as 0.`
          : `${fit.reasons.join(' ')} Formula letter ${formulaText(product.per100g)}. A missing public nutrient is already stored as 0.`}
      </p>
    </div>
  );
}
