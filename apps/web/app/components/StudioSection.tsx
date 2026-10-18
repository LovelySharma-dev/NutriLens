'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, History, ScanBarcode, ShieldCheck, UserRound, Volume2 } from 'lucide-react';
import { usePreferences } from './PreferencesProvider';
import { ALLERGEN_OPTIONS, CATALOG, assessFit, safeShelf, type CatalogProduct, type DietId, type Nutrients } from '../lib/safety';
import { checkBarcode } from '../lib/barcode';
import { agreementSummary } from '../lib/household';

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

type Tab = 'profile' | 'shelf' | 'history' | 'compare' | 'lookup';

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
                    <p className="text-sm text-slate-300">{shelf.length} matches. These twelve foods are a demonstration.</p>
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
  return (
    <li className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{product.name}</h3>
          <p className="text-sm text-slate-400">{product.category}</p>
        </div>
        <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">{grade}</span>
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
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProductSelect({ id, value, onChange }: { id: string; value: string; onChange: (id: string) => void }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-white/15 bg-black px-3 py-2">
      {CATALOG.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
    </select>
  );
}

function LookupResult({ product }: { product: LookupProduct }) {
  const { profile } = usePreferences();
  const fit = assessFit({ ...product, additives: false }, profile);
  return (
    <div className={`rounded-2xl border p-4 ${fit.safe ? 'border-emerald-400/40' : 'border-red-400/40'}`}>
      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
      <p className="text-sm text-slate-400">{product.brand} · {product.source}</p>
      <p className="mt-2 text-sm text-slate-200">{fit.safe ? `Screening grade ${fit.grade}. No profile conflict in the public record.` : fit.reasons.join(' ')}</p>
    </div>
  );
}
