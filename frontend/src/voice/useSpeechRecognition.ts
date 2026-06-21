import { useCallback, useEffect, useRef, useState } from "react";

// Minimal constructor shape — Web Speech API not yet uniformly typed in all TS DOM builds
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((ev: Event) => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export interface SpeechRecognitionHook {
  start: () => void;
  stop: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as SpeechRecognitionCtor | null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const SR = getSpeechRecognition();
  const isSupported = SR !== null;

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  /** Flag to track if user intentionally stopped listening */
  const intentionalStopRef = useRef(false);

  const start = useCallback(() => {
    if (!SR) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    recogRef.current?.abort();
    intentionalStopRef.current = false;

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
    };

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      setTranscript(full);
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "aborted" && e.error !== "no-speech") setError(e.error);
      setIsListening(false);
    };

    recog.onend = () => {
      // If the user didn't intentionally stop, restart recognition
      // (browsers auto-stop after silence; we want to keep listening)
      if (!intentionalStopRef.current && recogRef.current) {
        try {
          recog.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recogRef.current = recog;
    recog.start();
  }, [SR]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    recogRef.current?.stop();
    recogRef.current = null;
  }, []);

  useEffect(() => () => { recogRef.current?.abort(); }, []);

  return { start, stop, transcript, isListening, error, isSupported };
}
