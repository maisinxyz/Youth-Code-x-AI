import { ChromaticAberration, Bloom, EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

const CA_OFFSET = new Vector2(0.0007, 0.0007);

export function Postprocessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <ChromaticAberration
        offset={CA_OFFSET}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}
