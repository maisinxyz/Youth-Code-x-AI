import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnectorsStore } from "../state/connectors";
import type { ConnectorName } from "../lib/api";
import * as THREE from "three";

// ─── Brain topology ────────────────────────────────────────────────────────
const NODE_COUNT = 80;
const RADIUS = 2.8;
const CONNECT_DIST = 1.5;

function makeBrainNodes(): THREE.Vector3[] {
  const phi = Math.PI * (Math.sqrt(5) - 1);
  return Array.from({ length: NODE_COUNT }, (_, i) => {
    const y = 1 - (i / (NODE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = phi * i;
    const rr = RADIUS * (0.88 + Math.sin(i * 7.3) * 0.12);
    return new THREE.Vector3(
      rr * r * Math.cos(t) + Math.sin(i * 13.1) * 0.1,
      rr * y + Math.cos(i * 9.7) * 0.1,
      rr * r * Math.sin(t) + Math.sin(i * 17.3) * 0.1,
    );
  });
}

function makeEdges(nodes: THREE.Vector3[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    let c = 0;
    for (let j = i + 1; j < nodes.length; j++) {
      if (c >= 4) break;
      if (nodes[i].distanceTo(nodes[j]) < CONNECT_DIST) {
        edges.push([i, j]);
        c++;
      }
    }
  }
  return edges;
}

const BRAIN_NODES = makeBrainNodes();
const BRAIN_EDGES = makeEdges(BRAIN_NODES);

// ─── Timing (seconds) ─────────────────────────────────────────────────────
const T_RAIN        = 2.0;   // rain lasts until here
const T_CONVERGE    = 3.8;   // convergence complete
const T_CRYSTAL     = 4.8;   // crystallization complete
const T_EDGES       = 5.8;   // edges fully drawn
const T_DONE        = 6.8;   // navigate

// ─── Helpers ──────────────────────────────────────────────────────────────
function easeOut(t: number) { return 1 - (1 - t) ** 3; }
function easeInOut(t: number) { return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; }
function clamp(v: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function norm(t: number, a: number, b: number) { return clamp((t - a) / (b - a)); }

// ─── Rain Points ──────────────────────────────────────────────────────────
const RAIN_COUNT = 280;

function RainPoints({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Fixed random starting positions for each rain streak
  const startX = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => ((i * 137.508 + 17) % 100) / 100 * 14 - 7),
    [],
  );
  const startZ = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => ((i * 73.1 + 5) % 100) / 100 * 6 - 3),
    [],
  );
  const fallSpeed = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => 3.5 + ((i * 31) % 100) / 100 * 3),
    [],
  );
  const startY = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => 6 + ((i * 17) % 100) / 100 * 5),
    [],
  );
  const convergeDelay = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => ((i * 53) % 100) / 100 * 0.8),
    [],
  );

  // Each rain particle maps to a brain node
  const targets = useMemo(
    () => Array.from({ length: RAIN_COUNT }, (_, i) => BRAIN_NODES[i % NODE_COUNT]),
    [],
  );

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(RAIN_COUNT * 3);
    // Start all off-screen top so there's no initial blob
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3]     = startX[i];
      pos[i * 3 + 1] = startY[i];
      pos[i * 3 + 2] = startZ[i];
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [startX, startY, startZ]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const t = elapsed.current;
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const tgt = targets[i];
      let x: number, y: number, z: number;

      if (t < T_RAIN) {
        // Fall straight down, loop when off-screen bottom
        const totalFall = startY[i] + 8; // how far to fall
        const rawY = startY[i] - t * fallSpeed[i];
        // loop: when below -6, wrap back to top
        const loopedY = ((rawY + 8) % totalFall) - 8;
        x = startX[i];
        y = loopedY;
        z = startZ[i];
      } else if (t < T_CONVERGE) {
        // Converge to brain node target
        const delay = convergeDelay[i];
        const rawT = norm(t, T_RAIN + delay, T_CONVERGE);
        const ct = easeInOut(rawT);

        // Rain end position
        const rainEndY = startY[i] - T_RAIN * fallSpeed[i];
        const loopedRainEndY = ((rainEndY + 8) % (startY[i] + 8)) - 8;

        x = startX[i] + (tgt.x - startX[i]) * ct;
        y = loopedRainEndY + (tgt.y - loopedRainEndY) * ct;
        z = startZ[i] + (tgt.z - startZ[i]) * ct;
      } else {
        // Fully converged — sit at target
        x = tgt.x;
        y = tgt.y;
        z = tgt.z;
      }

      pos.setXYZ(i, x, y, z);
    }

    pos.needsUpdate = true;

    // Fade out rain points once crystallization starts
    if (pointsRef.current.material) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      const fade = 1 - norm(t, T_CRYSTAL - 0.3, T_CRYSTAL + 0.2);
      mat.opacity = clamp(fade) * 0.9;
    }
  });

  return (
    <points ref={pointsRef} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.04}
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Brain Nodes (instanced mesh, invisible until crystallize) ────────────
function BrainNodes({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    // Initialize all to scale-0 so nothing shows before useFrame
    m.makeScale(0, 0, 0);
    for (let i = 0; i < NODE_COUNT; i++) {
      meshRef.current.setMatrixAt(i, m);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [m]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !groupRef.current) return;
    const t = elapsed.current;

    // Only animate during/after crystallization
    const crystalT = norm(t, T_CONVERGE, T_CRYSTAL);

    for (let i = 0; i < NODE_COUNT; i++) {
      const n = BRAIN_NODES[i];
      // Stagger crystallization per node
      const nodeDelay = (i / NODE_COUNT) * 0.6;
      const nt = clamp(easeOut(norm(t, T_CONVERGE + nodeDelay * (T_CRYSTAL - T_CONVERGE), T_CRYSTAL)));
      const scale = nt * 0.045;
      m.set(scale, 0, 0, n.x, 0, scale, 0, n.y, 0, 0, scale, n.z, 0, 0, 0, 1);
      meshRef.current.setMatrixAt(i, m);

      const bright = 1.0 + nt * 2.5;
      col.setRGB(bright, bright, bright);
      meshRef.current.setColorAt(i, col);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Gentle idle rotation after crystallization
    if (crystalT > 0) {
      const rt = clock.elapsedTime;
      groupRef.current.rotation.y = rt * 0.04;
      groupRef.current.rotation.x = Math.sin(rt * 0.03) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, NODE_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={1}
          roughness={0.1}
          metalness={0}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

// ─── Brain Edges ──────────────────────────────────────────────────────────
function BrainEdges({ elapsed }: { elapsed: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const edgeRevealTimes = useMemo(
    () => BRAIN_EDGES.map((_, i) => T_CRYSTAL + (i / BRAIN_EDGES.length) * (T_EDGES - T_CRYSTAL)),
    [],
  );

  useEffect(() => {
    if (!groupRef.current) return;
    BRAIN_EDGES.forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([BRAIN_NODES[a], BRAIN_NODES[b]]);
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      groupRef.current!.add(new THREE.Line(geo, mat));
    });
    return () => { groupRef.current?.clear(); };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = elapsed.current;
    groupRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Line).material as THREE.LineBasicMaterial;
      mat.opacity = easeOut(norm(t, edgeRevealTimes[i], edgeRevealTimes[i] + 0.5)) * 0.55;
    });
    const rt = clock.elapsedTime;
    groupRef.current.rotation.y = rt * 0.04;
    groupRef.current.rotation.x = Math.sin(rt * 0.03) * 0.03;
  });

  return <group ref={groupRef} />;
}

// ─── Scene root ───────────────────────────────────────────────────────────
function Scene({ elapsed, skipped, onDone }: {
  elapsed: React.MutableRefObject<number>;
  skipped: boolean;
  onDone: () => void;
}) {
  const { camera } = useThree();
  const doneFired = useRef(false);

  useEffect(() => {
    camera.position.set(0, 0, 11);
    (camera as THREE.PerspectiveCamera).fov = 52;
    camera.updateProjectionMatrix();
  }, [camera]);

  useFrame((_, delta) => {
    elapsed.current += skipped ? 2 : delta;
    if (elapsed.current >= T_DONE && !doneFired.current) {
      doneFired.current = true;
      onDone();
    }
  });

  return (
    <>
      <RainPoints elapsed={elapsed} />
      <BrainNodes elapsed={elapsed} />
      <BrainEdges elapsed={elapsed} />
    </>
  );
}

const ALL_CONNECTORS: ConnectorName[] = ["slack", "notion", "drive", "confluence", "jira", "teams"];

// ─── Route ────────────────────────────────────────────────────────────────
export default function Loading() {
  const navigate = useNavigate();
  const [skipped, setSkipped] = useState(false);
  const elapsed = useRef(0);
  const { ingestConnector } = useConnectorsStore();

  const [label, setLabel] = useState("Ingesting sources");

  // Kick off all connector ingests in parallel when the loading screen mounts
  useEffect(() => {
    ALL_CONNECTORS.forEach((name) => { void ingestConnector(name); });
  }, [ingestConnector]);

  useEffect(() => {
    const t1 = setTimeout(() => setLabel("Building semantic graph"), T_RAIN * 1000);
    const t2 = setTimeout(() => setLabel("Crystallizing memory"),   T_CONVERGE * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleDone = () => navigate("/brain");
  const handleSkip = () => {
    setSkipped(true);
    setTimeout(() => navigate("/brain"), 500);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black" onClick={handleSkip}>
      <Canvas
        className="absolute inset-0 !h-full !w-full"
        camera={{ position: [0, 0, 11], fov: 52 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMappingExposure: 1 }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 10, 22]} />
        <ambientLight intensity={0.05} />
        <Scene elapsed={elapsed} skipped={skipped} onDone={handleDone} />
        <EffectComposer>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* Status */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-0 flex flex-col items-center justify-end pb-16">
        <AnimatePresence mode="wait">
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-xs uppercase tracking-widest text-white/30"
          >
            {label}
          </motion.p>
        </AnimatePresence>
        <p className="mt-3 font-mono text-[10px] text-white/15">
          Click anywhere to skip
        </p>
      </div>
    </div>
  );
}
