'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Orbiting nodes configuration
const NODES = [
  { label: 'INGREDIENTS', angle: 0, radius: 3.2, color: '#10B981' },
  { label: 'NUTRITION', angle: (Math.PI * 2) / 6, radius: 3.4, color: '#84CC16' },
  { label: 'CLAIMS', angle: (Math.PI * 4) / 6, radius: 3.1, color: '#3B82F6' },
  { label: 'ALLERGENS', angle: (Math.PI * 6) / 6, radius: 3.3, color: '#F59E0B' },
  { label: 'EVIDENCE', angle: (Math.PI * 8) / 6, radius: 3.5, color: '#10B981' },
  { label: 'TRUST', angle: (Math.PI * 10) / 6, radius: 3.2, color: '#84CC16' },
];

function InteractiveLens({ mousePos }: { mousePos: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const lensRef = useRef<THREE.Mesh>(null!);
  const innerRingRef = useRef<THREE.Mesh>(null!);

  // Generate random particles inside the lens
  const [particles, particlePositions] = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(theta);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return [count, positions];
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Slow continuous rotation
    groupRef.current.rotation.z += delta * 0.15;
    if (lensRef.current) {
      lensRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
      lensRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.5) * 0.15;
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.3;
    }

    // Mouse parallax
    if (mousePos.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        mousePos.current.x * 0.8,
        0.05
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        mousePos.current.y * 0.8,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Translucent Glass Ring / Lens */}
      <mesh ref={lensRef}>
        <torusGeometry args={[2, 0.08, 32, 100]} />
        <meshPhysicalMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner Glowing Aperture Ring */}
      <mesh ref={innerRingRef}>
        <ringGeometry args={[1.7, 1.75, 64]} />
        <meshBasicMaterial color="#84CC16" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Center Translucent Disc Lens */}
      <mesh>
        <circleGeometry args={[1.7, 64]} />
        <meshPhysicalMaterial
          color="#064e3b"
          transmission={0.85}
          opacity={0.3}
          transparent
          roughness={0.2}
          ior={1.4}
        />
      </mesh>

      {/* Floating Nutrition Particles inside Lens */}
      <Points positions={particlePositions} stride={3}>
        <PointMaterial
          transparent
          color="#10B981"
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>

      {/* Embedded Data Fragment Indicators inside Lens */}
      <Html transform position={[-0.6, 0.5, 0.1]} distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
          ENERGY: 440 kcal
        </div>
      </Html>
      <Html transform position={[0.4, -0.6, 0.1]} distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-lime-300/80 bg-lime-950/60 px-2 py-0.5 rounded border border-lime-500/30 whitespace-nowrap">
          SUGAR: 24g (HIGH)
        </div>
      </Html>
      <Html transform position={[-0.8, -0.3, 0.1]} distanceFactor={6} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono text-blue-300/80 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">
          PROTEIN: 16g
        </div>
      </Html>

      {/* Orbiting Data Nodes & Thin Connecting Lines */}
      {NODES.map((node, i) => {
        const x = Math.cos(node.angle) * node.radius;
        const y = Math.sin(node.angle) * node.radius;
        const lensConnX = Math.cos(node.angle) * 2;
        const lensConnY = Math.sin(node.angle) * 2;

        return (
          <group key={i}>
            {/* Connecting Line from Lens to Node */}
            <Line
              points={[
                [lensConnX, lensConnY, 0],
                [x, y, 0],
              ]}
              color={node.color}
              lineWidth={1}
              transparent
              opacity={0.4}
            />

            {/* Node Sphere */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
              <mesh position={[x, y, 0]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshBasicMaterial color={node.color} />
              </mesh>

              {/* Node Html Tag */}
              <Html transform position={[x * 1.15, y * 1.15, 0]} distanceFactor={7} style={{ pointerEvents: 'none' }}>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider shadow-lg whitespace-nowrap"
                  style={{
                    backgroundColor: 'rgba(13, 14, 23, 0.85)',
                    border: `1px solid ${node.color}60`,
                    color: node.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: node.color }} />
                  {node.label}
                </div>
              </Html>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export default function HeroLensScene() {
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { innerWidth, innerHeight } = window;
    mousePos.current = {
      x: (e.clientX / innerWidth) * 2 - 1,
      y: -(e.clientY / innerHeight) * 2 + 1,
    };
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full h-full relative flex items-center justify-center pointer-events-auto"
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#10B981" />
        <InteractiveLens mousePos={mousePos} />
      </Canvas>
    </div>
  );
}
