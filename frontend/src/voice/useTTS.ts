import { useCallback, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface TTSHook {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  /** AnalyserNode fed from TTS audio — pass to BrainScene for SpeechPulse sync. */
  analyserNode: AnalyserNode | null;
}

export function useTTS(): TTSHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // All audio infrastructure lives in refs — created once on first speak()
  const ctxRef    = useRef<AudioContext | null>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  /** Lazily initialise AudioContext + MediaElementSource on first user gesture */
  const ensureAudioPipeline = useCallback(() => {
    if (ctxRef.current) {
      return {
        ctx:     ctxRef.current,
        audio:   audioRef.current!,
        analyser: analyserNode!,
      };
    }

    const ctx = new AudioContext();
    const audio = new Audio();
    audio.crossOrigin = "anonymous";

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    ctxRef.current   = ctx;
    audioRef.current = audio;
    sourceRef.current = source;
    setAnalyserNode(analyser);   // Triggers BrainScene re-render with real analyser

    return { ctx, audio, analyser };
  }, [analyserNode]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    stop(); // Cancel any in-flight audio first

    const { ctx, audio } = ensureAudioPipeline();

    // Resume context — required by browser autoplay policy after user gesture
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    try {
      const res = await fetch(`${BASE_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`TTS endpoint returned ${res.status}`);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("TTS returned empty audio");
      }

      // Revoke previous object URL to free memory
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;

      audio.src = url;
      audio.onended  = () => setIsSpeaking(false);
      audio.onerror  = () => setIsSpeaking(false);

      setIsSpeaking(true);
      await audio.play();
    } catch (err) {
      // ── Browser TTS fallback ──────────────────────────────────────────────────
      console.warn("[useTTS] ElevenLabs failed, falling back to browser TTS:", err);

      if (!window.speechSynthesis) {
        console.error("[useTTS] No TTS available.");
        return;
      }

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate  = 1.0;
      utter.pitch = 1.0;
      // Pick a neutral English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google"),
      );
      if (preferred) utter.voice = preferred;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend   = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utter);
    }
  }, [stop, ensureAudioPipeline]);

  return { speak, stop, isSpeaking, analyserNode };
}
