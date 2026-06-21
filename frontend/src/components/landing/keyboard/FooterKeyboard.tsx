import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { KeyCap } from "./KeyCap";
import {
  KEYBOARD_DEPTH,
  KEYBOARD_WIDTH,
  KEY_UNIT,
  KEY_GAP,
  PLATE_H,
  ROW_SPACING,
  TKL_ROWS,
  type NavAction,
} from "./KEYS";

// ─── Layout computation ───────────────────────────────────────────────────────

type PlacedKey = {
  keyIndex: number;
  rowIndex: number;
  colIndex: number;
  x: number; // world X (centered on keyboard)
  z: number; // world Z
  wavePhase: number;
  keyDef: (typeof TKL_ROWS)[0][0];
};

function buildLayout(): PlacedKey[] {
  const placed: PlacedKey[] = [];

  // Center the keyboard: offset so plate center = origin
  const startX = -KEYBOARD_WIDTH / 2;
  const startZ = -(TKL_ROWS.length * ROW_SPACING) / 2 + ROW_SPACING / 2;

  TKL_ROWS.forEach((row, rowIndex) => {
    let curX = startX;
    const z = startZ + rowIndex * ROW_SPACING;

    row.forEach((key, colIndex) => {
      const keyWorldW = key.width * KEY_UNIT;

      if (!key.isSpacer && key.label !== undefined) {
        const cx = curX + keyWorldW / 2;
        const wavePhase = (rowIndex * 0.35 + colIndex * 0.18); // diagonal wave
        placed.push({
          keyIndex: placed.length,
          rowIndex,
          colIndex,
          x: cx,
          z,
          wavePhase,
          keyDef: key,
        });
      }
      curX += keyWorldW + KEY_GAP;
    });
  });

  return placed;
}

// ─── Scene contents ───────────────────────────────────────────────────────────

function KeyboardScene({
  onAction,
}: {
  onAction: (action: NavAction) => void;
}) {
  const layout = useMemo(() => buildLayout(), []);
  const plateY = 0;
  const keyY   = plateY + PLATE_H / 2 + 0.01; // keys sit on plate top face

  return (
    <>
      {/* ── Lighting ──────────────────────────────────────────────── */}
      <ambientLight intensity={0.05} />

      {/* Main front-top spot — creates shadow relief on key sides */}
      <spotLight
        position={[0, 10, 6]}
        intensity={1.4}
        angle={0.45}
        penumbra={0.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color="#ffffff"
      />

      {/* Left rim light — catches plate left edge */}
      <pointLight position={[-12, 4, 0]} intensity={0.3} color="#c8d8ff" />

      {/* Right rim light — catches plate right edge */}
      <pointLight position={[12, 4, 0]} intensity={0.25} color="#ffd8c8" />

      {/* Back fill — prevents harsh shadow on back of keyboard */}
      <pointLight position={[0, 3, -8]} intensity={0.15} color="#ffffff" />

      {/* ── Keyboard plate ────────────────────────────────────────── */}
      {/* Outer bezel */}
      <mesh position={[0, plateY, 0]} receiveShadow>
        <boxGeometry args={[KEYBOARD_WIDTH + 1.2, PLATE_H, KEYBOARD_DEPTH + 0.8]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.88}
          roughness={0.12}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Inner plate surface (slightly raised, different material) */}
      <mesh position={[0, plateY + PLATE_H * 0.3, 0]} receiveShadow>
        <boxGeometry args={[KEYBOARD_WIDTH + 0.4, PLATE_H * 0.4, KEYBOARD_DEPTH + 0.2]} />
        <meshStandardMaterial
          color="#181818"
          metalness={0.6}
          roughness={0.25}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* ── All keys ──────────────────────────────────────────────── */}
      {layout.map((placed) => (
        <KeyCap
          key={placed.keyIndex}
          keyDef={placed.keyDef}
          position={[placed.x, keyY, placed.z]}
          wavePhase={placed.wavePhase}
          onAction={onAction}
        />
      ))}

      {/* ── Desk surface ──────────────────────────────────────────── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, plateY - PLATE_H / 2 - 0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#060606"
          metalness={0.3}
          roughness={0.85}
        />
      </mesh>

      {/* IBL environment for plate/cap reflections */}
      <Environment preset="studio" />

      {/* ── Post-processing ───────────────────────────────────────── */}
      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface FooterKeyboardProps {
  onWaitlist: () => void;
}

export function FooterKeyboard({ onWaitlist }: FooterKeyboardProps) {
  const navigate = useNavigate();

  const handleAction = useCallback(
    (action: NavAction) => {
      if (action.type === "navigate") {
        void navigate(action.to);
      } else if (action.type === "scroll") {
        const el = document.querySelector(action.target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (action.type === "modal" && action.name === "waitlist") {
        onWaitlist();
      }
    },
    [navigate, onWaitlist],
  );

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 5, 9], fov: 44, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMappingExposure: 1.1,
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#000000",
      }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <KeyboardScene onAction={handleAction} />
      </Suspense>
    </Canvas>
  );
}
