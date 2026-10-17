'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Language, translate, type CopyKey } from '../lib/i18n';
import type { ConsumerProfile, DietId } from '../lib/safety';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const STORAGE_KEY = 'nutrilens-preferences-v1';

export type ScanMemory = {
  id: string;
  createdAt: string;
  productName: string;
  grade: string | null;
  riskLevel: string | null;
  allergens: string[];
  summary: string;
  personalStatus: string;
  trustScore: number | null;
};

type Preferences = {
  language: Language;
  ocrLanguage: string;
  contrast: boolean;
  textScale: 0 | 1 | 2;
  reduceMotion: boolean;
  readAloud: boolean;
  hearingCaptions: boolean;
  plainCursor: boolean;
  profile: ConsumerProfile;
  history: ScanMemory[];
};

const defaultPreferences: Preferences = {
  language: 'en',
  ocrLanguage: 'en',
  contrast: false,
  textScale: 0,
  reduceMotion: false,
  readAloud: false,
  hearingCaptions: false,
  plainCursor: false,
  profile: { name: '', allergens: [], diets: [], avoidAdditives: false },
  history: [],
};

type PreferencesContextValue = Preferences & {
  t: (key: CopyKey) => string;
  caption: string;
  setCaption: (text: string) => void;
  speak: (text: string) => void;
  update: (patch: Partial<Preferences>) => void;
  saveProfile: (profile: ConsumerProfile) => void;
  rememberScan: (entry: Omit<ScanMemory, 'id' | 'createdAt'> & { id?: string }) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const speechLang: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [caption, setCaptionState] = useState('');

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!raw) {
      if (reduce) setPrefs((current) => ({ ...current, reduceMotion: true, plainCursor: true }));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Preferences;
      setPrefs({ ...defaultPreferences, ...parsed, reduceMotion: parsed.reduceMotion || reduce });
    } catch {
      setPrefs(defaultPreferences);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.language === 'hi' ? 'hi' : prefs.language;
    root.dataset.contrast = prefs.contrast ? 'high' : 'normal';
    root.dataset.text = String(prefs.textScale);
    root.dataset.motion = prefs.reduceMotion ? 'off' : 'on';
    root.dataset.cursor = prefs.plainCursor || prefs.reduceMotion ? 'system' : 'fancy';
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setCaption = (text: string) => setCaptionState(text);

  const speak = (text: string) => {
    setCaptionState(text);
    if (!prefs.readAloud || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang[prefs.language];
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const update = (patch: Partial<Preferences>) => {
    setPrefs((current) => ({ ...current, ...patch }));
  };

  const saveProfile = (profile: ConsumerProfile) => {
    setPrefs((current) => ({ ...current, profile }));
    setCaptionState(translate(prefs.language, 'saved'));
    void fetch(`${API_URL}/api/v1/studio/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).catch(() => undefined);
  };

  const rememberScan = (entry: Omit<ScanMemory, 'id' | 'createdAt'> & { id?: string }) => {
    const saved: ScanMemory = {
      id: entry.id ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      productName: entry.productName,
      grade: entry.grade,
      riskLevel: entry.riskLevel,
      allergens: entry.allergens,
      summary: entry.summary,
      personalStatus: entry.personalStatus,
      trustScore: entry.trustScore,
    };
    setPrefs((current) => ({ ...current, history: [saved, ...current.history].slice(0, 40) }));
    void fetch(`${API_URL}/api/v1/studio/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => undefined);
  };

  const value = useMemo<PreferencesContextValue>(() => ({
    ...prefs,
    caption,
    setCaption,
    speak,
    update,
    saveProfile,
    rememberScan,
    t: (key) => translate(prefs.language, key),
  }), [prefs, caption]);

  return (
    <PreferencesContext.Provider value={value}>
      <a href="#studio" className="skip-link">Skip to your kitchen</a>
      {children}
      <div className="sr-only" role="status" aria-live="polite">{caption}</div>
      {(prefs.hearingCaptions || prefs.readAloud) && caption && (
        <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-3xl rounded-2xl border border-white bg-black px-4 py-3 text-base text-white shadow-2xl" role="status">
          {caption}
        </div>
      )}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  return value;
}

export type { DietId };
