import { useCallback, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:8000`;

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
  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

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
      // Stream directly from the GET endpoint for zero latency
      const url = `${BASE_URL}/tts/stream?text=${encodeURIComponent(text)}`;
      audio.src = url;
      audio.onended  = () => setIsSpeaking(false);
      audio.onerror  = () => {
        // This handles cases where the backend returns a 5xx error
        setIsSpeaking(false);
        // Dispatch a custom event or just throw to trigger fallback
        audio.dispatchEvent(new Event('fallback-needed'));
      };

      setIsSpeaking(true);
      
      // Wait for play to finish or fail
      await new Promise<void>((resolve, reject) => {
        const handleFallback = () => reject(new Error("Audio element error"));
        audio.addEventListener('fallback-needed', handleFallback, { once: true });
        
        audio.play().then(() => {
          audio.removeEventListener('fallback-needed', handleFallback);
          resolve();
        }).catch(err => {
          audio.removeEventListener('fallback-needed', handleFallback);
          reject(err);
        });
      });

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[useTTS] Playback aborted");
        return;
      }
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
