import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 180;
const SPREAD_X = 14;
const SPREAD_Y = 9;
const SPREAD_Z = 7;

function ParticleField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * SPREAD_X,
      y: (Math.random() - 0.5) * SPREAD_Y,
      z: (Math.random() - 0.5) * SPREAD_Z,
      bobAmplitude: 0.05 + Math.random() * 0.12,
      bobPeriod: 4 + Math.random() * 5,
      bobPhase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.04,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const y = s.y + Math.sin((t / s.bobPeriod) * Math.PI * 2 + s.bobPhase) * s.bobAmplitude;
      const x = s.x + Math.sin(t * 0.05 + s.bobPhase) * s.driftX;
      dummy.position.set(x, y, s.z);
      dummy.rotation.set(t * 0.02, t * 0.03 + i, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    groupRef.current.rotation.y = Math.sin(t * 0.05) * 0.04;
    groupRef.current.rotation.x = Math.sin(t * 0.04) * 0.02;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <octahedronGeometry args={[0.05, 0]} />
        <meshBasicMaterial color="#a3a3a3" transparent opacity={0.55} />
      </instancedMesh>
    </group>
  );
}

export function HeroParticles() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 6], fov: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 5, 12]} />
      <ParticleField />
    </Canvas>
  );
}
