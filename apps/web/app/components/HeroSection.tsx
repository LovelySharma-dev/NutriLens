'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { cachedUser } from '../lib/auth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Dynamically import Three.js scene (with SSR disabled)
const HeroLensScene = dynamic(() => import('./HeroLensScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full border border-emerald-500/20 animate-pulse flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-lime-500/30" />
      </div>
    </div>
  ),
});

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [platformHref, setPlatformHref] = useState('/login');

  useEffect(() => {
    setPlatformHref(cachedUser() ? '/dashboard' : '/login');
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Entrance timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.hero-badge',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4 }
      )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          '-=0.4'
        )
        .fromTo(
          '.hero-subtext',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.6'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.6'
        )
        .fromTo(
          '.hero-supporting',
          { opacity: 0 },
          { opacity: 1, duration: 1 },
          '-=0.4'
        );

      // ScrollTrigger camera zoom / scale effect on scroll
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const sceneEl = document.getElementById('hero-3d-scene');
          if (sceneEl) {
            sceneEl.style.transform = `scale(${1 + progress * 0.4}) translateY(${progress * 60}px)`;
            sceneEl.style.opacity = `${1 - progress * 0.8}`;
          }
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-radial-gradient bg-grid-pattern px-4 pb-16 pt-28 sm:px-6 sm:pt-24"
    >
      {/* Background 3D Scene Container */}
      <div id="hero-3d-scene" className="absolute inset-0 z-0 pointer-events-auto transition-transform duration-75">
        <HeroLensScene />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-1 text-center pointer-events-none sm:px-2">
        
        {/* Badge */}
        <div className="hero-badge pointer-events-auto mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md sm:px-4">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300 sm:text-xs sm:tracking-wider">
            Food Label Intelligence Engine
          </span>
        </div>

        {/* Editorial Hero Headline */}
        <h1
          ref={headlineRef}
          className="mb-6 text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-white min-[380px]:text-5xl sm:text-7xl sm:leading-[1.05] lg:text-8xl"
        >
          <span className="block text-gradient-silver">You eat it.</span>
          <span className="block text-gradient-green">But do you know it?</span>
        </h1>

        {/* Subhead */}
        <p className="hero-subtext mb-8 max-w-2xl text-base font-normal leading-relaxed text-slate-300 sm:text-xl">
          NutriLens turns confusing food labels into information you can actually understand. Sign in to open the label reader.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="hero-cta pointer-events-auto mb-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
        >
          <a
            href={platformHref}
            className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-400 bg-[length:200%_auto] px-6 py-4 font-bold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-500 hover:bg-[position:right_center] active:scale-95 sm:px-8 sm:hover:scale-105"
          >
            <span className="text-base">{platformHref === '/dashboard' ? 'Open the reader' : 'Sign in to scan'}</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>

          <button
            onClick={() => scrollToSection('problem')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-6 py-4 font-semibold text-slate-300 backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-slate-800/80 hover:text-white sm:px-7"
          >
            <span>See How It Works</span>
            <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
          </button>
        </div>

        {/* Supporting Line */}
        <div className="hero-supporting flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-1 text-[11px] font-mono uppercase tracking-wide text-slate-400 sm:text-sm sm:tracking-widest">
          <span>Ingredients</span>
          <span aria-hidden="true">•</span>
          <span>Nutrition</span>
          <span aria-hidden="true">•</span>
          <span>Claims</span>
          <span aria-hidden="true">•</span>
          <span>Evidence</span>
          <span aria-hidden="true">•</span>
          <span>One Intelligent Lens</span>
        </div>
      </div>
    </section>
  );
}
