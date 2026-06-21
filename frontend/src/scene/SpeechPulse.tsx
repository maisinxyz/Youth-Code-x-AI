import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useQueryStore } from "../state/query";
import { speechAmplitudeRef } from "./speechAmplitude";

interface SpeechPulseProps {
  /**
   * Pass a Web Audio AnalyserNode here once §16 (Voice) is wired.
   * When absent, a synthetic amplitude curve is generated from the response text.
   */
  analyserNode?: AnalyserNode | null;
}

export function SpeechPulse({ analyserNode }: SpeechPulseProps) {
  const { lastResponse, isPending } = useQueryStore();
  const synthElapsedRef = useRef(0);
  const prevResponseRef = useRef<string | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame((_, delta) => {
    let amplitude = 0;

    if (analyserNode) {
      // §16 real-audio path — reads actual frequency data from ElevenLabs audio
      if (
        !dataArrayRef.current ||
        dataArrayRef.current.length !== analyserNode.frequencyBinCount
      ) {
        dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      }
      analyserNode.getByteFrequencyData(dataArrayRef.current);
      const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
      amplitude = sum / (dataArrayRef.current.length * 255);
    } else if (lastResponse && !isPending) {
      // Synthetic pulse: when a new response arrives, animate a decaying sine for
      // ~(text_length / 15) seconds — approximates a speaking cadence.
      const key = lastResponse.answer ?? "";
      if (key !== prevResponseRef.current) {
        prevResponseRef.current = key;
        synthElapsedRef.current = 0;
      }

      const duration = Math.min(8, Math.max(2, key.length / 15));
      if (synthElapsedRef.current < duration) {
        synthElapsedRef.current += delta;
        const t = synthElapsedRef.current / duration;
        // Decaying sine that varies like natural speech amplitude
        amplitude =
          (0.35 + Math.sin(synthElapsedRef.current * 7.4) * 0.22) * (1 - t);
        amplitude = Math.max(0, amplitude);
      }
    }

    speechAmplitudeRef.current = amplitude;
  });

  return null;
}
