'use client';

import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileImage,
  ArrowRight,
} from 'lucide-react';

interface ScanSectionProps {
  onAnalyze: (scanId: string, file?: File | null) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
  loadingProgress: number;
  error: string | null;
  onResetError: () => void;
}

const DEMO_SCAN_ID = '25c77823-2897-4b31-b8a5-78d2766abe0e';

export default function ScanSection({
  onAnalyze,
  isLoading,
  loadingStep,
  loadingProgress,
  error,
  onResetError,
}: ScanSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    setSelectedFile(file);
    onResetError();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await onAnalyze(DEMO_SCAN_ID, selectedFile);
  };

  const handleDemo = async () => {
    await onAnalyze(DEMO_SCAN_ID, null);
  };

  return (
    <section
      id="scan"
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={handleDrop}
      className="relative mx-auto max-w-7xl scroll-mt-28 border-t border-white/5 px-4 py-16 sm:px-6 sm:py-24 lg:py-28"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFile(file);
          }
        }}
      />

      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
          <Camera className="w-3.5 h-3.5" />
          <span>Live Analysis Portal</span>
        </div>

        <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Scan Your Food Label
        </h2>
        <p className="text-slate-300 text-lg">
          Upload a food-label image and NutriLens will analyze nutrition, ingredients, allergens and claims.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Loading State Animation */}
        {isLoading ? (
          <div className="space-y-8 rounded-3xl border-emerald-500/40 bg-slate-950/90 p-6 text-center shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-pulse glass-panel sm:p-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-2">
                PROCESSING PIPELINE
              </span>
              <h3 className="text-2xl font-bold font-mono text-white mb-4">
                {loadingStep}
              </h3>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400 mt-2 block">
                {loadingProgress}% Complete
              </span>
            </div>
          </div>
        ) : (
          /* Main Dropzone & Controls */
          <div
            className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center transition-all duration-300 glass-panel sm:p-12 ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/30 scale-102 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                : 'border-white/15 hover:border-emerald-500/40 bg-slate-950/70'
            }`}
          >
            {error && (
              <div className="mb-6 flex w-full flex-col items-start gap-3 rounded-xl border border-red-500/40 bg-red-950/80 p-4 font-mono text-xs text-red-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="break-words text-left">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={onResetError}
                  className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-white flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Dismiss</span>
                </button>
              </div>
            )}

            <div className="w-16 h-16 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileImage className="w-8 h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              DROP LABEL IMAGE HERE
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 font-mono">
              Drag & drop a food packaging label, photo, or scan file (PNG, JPG, WEBP up to 10MB)
            </p>

            {selectedFile && (
              <div className="mb-6 flex max-w-full items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/80 px-4 py-2.5 font-mono text-xs text-emerald-300 shadow-md">
                <FileImage className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="break-all text-left">
                  <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/20 bg-slate-900 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{selectedFile ? 'Change Label Image' : 'Upload Label'}</span>
              </button>

              <button
                type="button"
                disabled={isLoading || !selectedFile}
                onClick={handleAnalyze}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 px-6 py-3.5 text-xs font-extrabold tracking-wide text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all active:scale-95 disabled:opacity-40 sm:px-8 sm:hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Analyze Label</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 w-full flex justify-center">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDemo}
                className="inline-flex max-w-full items-center justify-center gap-1.5 text-center font-mono text-xs text-slate-400 transition-colors hover:text-emerald-400"
              >
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <span>Try Demo Scan (Instant Pre-configured Analysis)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
