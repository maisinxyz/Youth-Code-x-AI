import { ChromaticAberration, Bloom, EffectComposer } from "@react-three/postprocessing";
import { Vector2 } from "three";

const CA_OFFSET = new Vector2(0.0007, 0.0007);

export function Postprocessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
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
