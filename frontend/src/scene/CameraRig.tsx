import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

interface CameraRigProps {
  targetNodePos?: [number, number, number] | null;
}

export function CameraRig({ targetNodePos }: CameraRigProps) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.5, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.07}
      autoRotate
      autoRotateSpeed={0.35}
      minDistance={4}
      maxDistance={22}
      enablePan={false}
      target={targetNodePos ?? [0, 0, 0]}
    />
  );
}
