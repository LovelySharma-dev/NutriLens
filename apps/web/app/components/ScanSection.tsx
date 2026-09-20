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
      className="relative py-28 px-6 max-w-7xl mx-auto border-t border-white/5 scroll-mt-20"
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

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Scan Your Food Label
        </h2>
        <p className="text-slate-300 text-lg">
          Upload a food-label image and NutriLens will analyze nutrition, ingredients, allergens and claims.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Loading State Animation */}
        {isLoading ? (
          <div className="p-10 rounded-3xl glass-panel border-emerald-500/40 bg-slate-950/90 text-center space-y-8 animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.2)]">
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
            className={`relative p-8 sm:p-12 rounded-3xl glass-panel border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/30 scale-102 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                : 'border-white/15 hover:border-emerald-500/40 bg-slate-950/70'
            }`}
          >
            {error && (
              <div className="w-full mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
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
              <div className="mb-6 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-md">
                <FileImage className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-white/20 transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{selectedFile ? 'Change Label Image' : 'Upload Label'}</span>
              </button>

              <button
                type="button"
                disabled={isLoading || !selectedFile}
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-extrabold tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 to-lime-400 hover:from-emerald-300 hover:to-lime-300 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
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
                className="text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
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
