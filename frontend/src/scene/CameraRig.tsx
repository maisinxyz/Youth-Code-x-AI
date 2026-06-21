import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CameraRigProps {
  /**
   * Centroid of the currently-activated nodes, in world space. When set, the
   * orbit target eases toward this point AND the camera distance pulls in to
   * ZOOM_DISTANCE. When null, both ease back to the home position.
   */
  zoomTarget?: [number, number, number] | null;
}

const HOME_DISTANCE = 18;
const ZOOM_DISTANCE = 10;
const LERP_RATE = 0.05;

export function CameraRig({ zoomTarget }: CameraRigProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Reusable scratch vectors — never allocate inside useFrame.
  const desiredTarget = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 2, HOME_DISTANCE);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (zoomTarget) {
      desiredTarget.current.set(zoomTarget[0], zoomTarget[1], zoomTarget[2]);
    } else {
      desiredTarget.current.set(0, 0, 0);
    }

    const targetVec = controls.target as THREE.Vector3;

    // 1) Ease the orbit target toward the desired centroid (or origin).
    targetVec.lerp(desiredTarget.current, LERP_RATE);

    // 2) Ease the camera-to-target distance toward the desired distance,
    //    preserving the camera's current orbital direction so autoRotate
    //    doesn't get jerked around.
    offset.current.subVectors(camera.position, targetVec);
    const currentDistance = offset.current.length();
    const desiredDistance = zoomTarget ? ZOOM_DISTANCE : HOME_DISTANCE;
    const newDistance =
      currentDistance + (desiredDistance - currentDistance) * LERP_RATE;
    if (currentDistance > 0.0001) {
      offset.current.multiplyScalar(newDistance / currentDistance);
      camera.position.copy(targetVec).add(offset.current);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.07}
      autoRotate
      autoRotateSpeed={0.35}
      minDistance={6}
      maxDistance={32}
      enablePan={false}
    />
  );
}
