'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
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
      className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-radial-gradient bg-grid-pattern pt-16"
    >
      {/* Background 3D Scene Container */}
      <div id="hero-3d-scene" className="absolute inset-0 z-0 pointer-events-auto transition-transform duration-75">
        <HeroLensScene />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center pointer-events-none">
        
        {/* Badge */}
        <div className="hero-badge pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
            Food Label Intelligence Engine
          </span>
        </div>

        {/* Editorial Hero Headline */}
        <h1
          ref={headlineRef}
          className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]"
        >
          <span className="block text-gradient-silver">You eat it.</span>
          <span className="block text-gradient-green">But do you know it?</span>
        </h1>

        {/* Subhead */}
        <p className="hero-subtext max-w-2xl text-lg sm:text-xl text-slate-300 font-normal mb-8 leading-relaxed">
          NutriLens turns confusing food labels into information you can actually understand.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="hero-cta pointer-events-auto flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          <button
            onClick={() => scrollToSection('scan')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-400 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
          >
            <span className="text-base">Scan a Label</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => scrollToSection('problem')}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-slate-300 bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-emerald-500/40 backdrop-blur-md transition-all hover:text-white"
          >
            <span>See How It Works</span>
            <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
          </button>
        </div>

        {/* Supporting Line */}
        <div className="hero-supporting text-xs sm:text-sm font-mono tracking-widest text-slate-400 uppercase">
          Ingredients • Nutrition • Claims • Evidence • One Intelligent Lens
        </div>
      </div>
    </section>
  );
}
