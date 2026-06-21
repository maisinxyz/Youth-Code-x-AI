import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import type { KeyDef, NavAction } from "./KEYS";
import { KEY_GAP, KEY_H, KEY_UNIT, HOUSING_H } from "./KEYS";

// Shared geometries (created once, reused)
const _capGeo    = new THREE.BoxGeometry(1, KEY_H, 1);
const _housingGeo = new THREE.BoxGeometry(1, HOUSING_H, 1);
const _ledGeo    = new THREE.PlaneGeometry(1, 1);
const _topGeo    = new THREE.PlaneGeometry(1, 1);

interface KeyCapProps {
  keyDef: KeyDef;
  position: [number, number, number];
  wavePhase: number; // radians — position in the RGB wave
  onAction?: (action: NavAction) => void;
}

export function KeyCap({ keyDef, position, wavePhase, onAction }: KeyCapProps) {
  const groupRef   = useRef<THREE.Group>(null);
  const ledRef     = useRef<THREE.Mesh>(null);
  const capRef     = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const pressYRef  = useRef(0);  // current Y offset for spring press
  const targetYRef = useRef(0);
  const liftRef    = useRef(0);
  const targetLiftRef = useRef(0);

  // Key physical dimensions
  const capW = keyDef.width * KEY_UNIT - KEY_GAP;
  const capD = KEY_UNIT - KEY_GAP;

  useFrame(({ clock }) => {
    if (!groupRef.current || !ledRef.current || !capRef.current) return;
    const t = clock.elapsedTime;

    // ── RGB wave color ────────────────────────────────────────────────
    const hue = ((t * 45 + wavePhase * 57.3) % 360) / 360;
    const sat = hovered ? 0.9 : keyDef.isNav ? 0.75 : 0.72;
    const lit = hovered ? 0.65 : 0.45;
    const color = new THREE.Color().setHSL(hue, sat, lit);

    const ledMat = ledRef.current.material as THREE.MeshBasicMaterial;
    ledMat.color.lerp(color, 0.15);

    // Cap emissive: faint tint on hover / nav keys
    const capMat = capRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = hovered
      ? new THREE.Color().setHSL(hue, 0.3, 0.12)
      : new THREE.Color(0x040404);
    capMat.emissive.lerp(targetEmissive, 0.12);

    // ── Spring press ──────────────────────────────────────────────────
    const spring = 22;
    const damping = 0.65;
    pressYRef.current += (targetYRef.current - pressYRef.current) * spring * 0.016;
    pressYRef.current *= damping + (1 - damping) * Math.min(1, Math.abs(targetYRef.current - pressYRef.current) * 8);
    // Use exponential decay approach: lerp toward target each frame
    pressYRef.current = pressYRef.current + (targetYRef.current - pressYRef.current) * 0.28;

    // ── Hover lift ────────────────────────────────────────────────────
    liftRef.current += (targetLiftRef.current - liftRef.current) * 0.14;

    groupRef.current.position.y = position[1] + pressYRef.current + liftRef.current;
  });

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    targetLiftRef.current = 0.06;
    document.body.style.cursor = keyDef.isNav ? "pointer" : "default";
  }, [keyDef.isNav]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    targetLiftRef.current = 0;
    targetYRef.current = 0;
    document.body.style.cursor = "default";
  }, []);

  const handlePointerDown = useCallback(() => {
    targetYRef.current = -KEY_H * 0.55;
  }, []);

  const handlePointerUp = useCallback(() => {
    targetYRef.current = 0;
    if (keyDef.isNav && keyDef.action) {
      onAction?.(keyDef.action);
    }
  }, [keyDef, onAction]);

  // Choose label font size based on key width and label length
  const labelSize = keyDef.width >= 1.5
    ? (keyDef.label.length > 4 ? 0.09 : 0.11)
    : (keyDef.label.length > 2 ? 0.09 : 0.13);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ── Layer 1: Switch housing ────────────────────────────────── */}
      <mesh
        scale={[capW * 0.92, 1, capD * 0.92]}
        position={[0, -(KEY_H / 2 + HOUSING_H / 2), 0]}
        geometry={_housingGeo}
      >
        <meshStandardMaterial
          color="#090909"
          metalness={0.2}
          roughness={0.85}
        />
      </mesh>

      {/* ── Layer 2: RGB LED underglow plane ──────────────────────── */}
      <mesh
        ref={ledRef}
        scale={[capW * 0.85, 1, capD * 0.85]}
        position={[0, -(KEY_H / 2) + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={_ledGeo}
      >
        <meshBasicMaterial
          color="#ffffff"
          toneMapped={false}
        />
      </mesh>

      {/* ── Layer 3a: Keycap body ──────────────────────────────────── */}
      <mesh
        ref={capRef}
        scale={[capW, 1, capD]}
        geometry={_capGeo}
      >
        <meshStandardMaterial
          color="#0f0f0f"
          metalness={0.04}
          roughness={0.58}
          emissive="#040404"
          envMapIntensity={1.1}
        />
      </mesh>

      {/* ── Layer 3b: Top surface specular highlight ──────────────── */}
      <mesh
        scale={[capW * 0.88, 1, capD * 0.88]}
        position={[0, KEY_H / 2 + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={_topGeo}
      >
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={hovered ? 0.06 : 0.025}
          roughness={0.05}
          metalness={0.0}
          toneMapped={false}
        />
      </mesh>

      {/* ── Legend: nav key shows logo name as text; regular key shows label */}
      {keyDef.label && !keyDef.isSpacer && (
        <Text
          position={[0, KEY_H / 2 + 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={keyDef.isNav ? labelSize * 0.78 : labelSize}
          maxWidth={capW * 0.82}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          fillOpacity={hovered ? 1.0 : keyDef.isNav ? 0.75 : 0.45}
          color="#ffffff"
        >
          {keyDef.isNav && keyDef.logo !== "engram"
            ? keyDef.logo?.toUpperCase() ?? keyDef.label
            : keyDef.label}
        </Text>
      )}

      {/* Nav key sub-label */}
      {keyDef.isNav && keyDef.width >= 1.75 && (
        <Text
          position={[0, KEY_H / 2 + 0.012, capD * 0.25]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.065}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          fillOpacity={hovered ? 0.7 : 0.3}
          color="#ffffff"
        >
          {keyDef.logo === "ArrowRight" ? "PROCEED" : ""}
        </Text>
      )}
    </group>
  );
}
