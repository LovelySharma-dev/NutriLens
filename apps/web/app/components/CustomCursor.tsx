'use client';

import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.body.classList.add('custom-cursor-enabled');

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a') ||
          target.getAttribute('role') === 'button' ||
          target.classList.contains('interactive-hover'))
      ) {
        isHovered.current = true;
        if (ringRef.current) {
          ringRef.current.classList.add('ring-expanded');
        }
      } else {
        isHovered.current = false;
        if (ringRef.current) {
          ringRef.current.classList.remove('ring-expanded');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    let rafId: number;

    const animate = () => {
      // Smooth lerp: 0.35 factor for ultra-snappy responsiveness
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;
      currentPos.current.x += dx * 0.35;
      currentPos.current.y += dy * 0.35;

      if (ringRef.current) {
        const size = isHovered.current ? 48 : 32;
        ringRef.current.style.transform = `translate3d(${currentPos.current.x - size / 2}px, ${
          currentPos.current.y - size / 2
        }px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      document.body.classList.remove('custom-cursor-enabled');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ringRef}
      className="fixed top-0 left-0 pointer-events-none z-50 rounded-full border border-emerald-400/40 bg-emerald-500/5 transition-[width,height,background-color,border-color,box-shadow] duration-200 ease-out w-8 h-8 opacity-80 backdrop-blur-[1px] [&.ring-expanded]:w-12 [&.ring-expanded]:h-12 [&.ring-expanded]:border-emerald-400 [&.ring-expanded]:bg-emerald-500/15 [&.ring-expanded]:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
      style={{
        transform: 'translate3d(-100px, -100px, 0)',
        willChange: 'transform',
      }}
    />
  );
}
