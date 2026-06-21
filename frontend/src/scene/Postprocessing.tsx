import { Bloom, EffectComposer } from "@react-three/postprocessing";

export function Postprocessing() {
  // Bloom only the brightest pixels — baseline node emission stays under the
  // 1.0 luminance threshold so 185 nodes don't merge into one white blob.
  return (
    <EffectComposer>
      <Bloom
        intensity={0.6}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
    </EffectComposer>
  );
}
