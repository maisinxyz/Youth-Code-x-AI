import { useEffect, useRef, useState } from "react";
import { BrainScene } from "../scene/BrainScene";
import { LegendPanel } from "../panels/LegendPanel";
import { QueryBar } from "../panels/QueryBar";
import { ResponsePanel } from "../panels/ResponsePanel";
import { SourceDrawer } from "../panels/SourceDrawer";
import { SourcesPanel } from "../panels/SourcesPanel";
import { StatsPill } from "../panels/StatsPill";
import { WordmarkPanel } from "../panels/WordmarkPanel";
import { useGraphStore } from "../state/graph";
import { useQueryStore } from "../state/query";
import { useTTS } from "../voice/useTTS";

export default function Brain() {
  const { activatedNodeIds, setActivatedNodes, clearActivated } = useGraphStore();
  const { lastResponse, reset: resetQuery } = useQueryStore();
  const { speak, stop, isSpeaking, analyserNode } = useTTS();
  const [isTTSMuted, setIsTTSMuted] = useState(false);

  // Guard so we don't re-speak the same response on unrelated re-renders
  const lastSpokenAnswerRef = useRef<string | null>(null);

  // Wire: query response → activated nodes + auto-speak answer
  useEffect(() => {
    if (!lastResponse) {
      clearActivated();
      return;
    }

    const ids = lastResponse.activated_nodes ?? [];
    if (ids.length > 0) {
      setActivatedNodes(ids);
    } else {
      clearActivated();
    }

    if (
      lastResponse.answer &&
      lastResponse.answer !== lastSpokenAnswerRef.current
    ) {
      lastSpokenAnswerRef.current = lastResponse.answer;
      if (!isTTSMuted) {
        void speak(lastResponse.answer);
      }
    }
  }, [lastResponse, setActivatedNodes, clearActivated, speak, isTTSMuted]);

  /** Stop everything: audio, panel, and activated nodes */
  const handleFullStop = () => {
    stop();                           // Kill audio playback
    resetQuery();                     // Clear lastResponse → panel closes
    clearActivated();                 // Un-highlight nodes
    lastSpokenAnswerRef.current = null;
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Full-screen Three.js brain — canvas consumes pointer events not covered by panels */}
      <div className="absolute inset-0">
        <BrainScene activatedIds={activatedNodeIds} analyserNode={analyserNode} />
      </div>

      {/* ── Top row ── */}
      <WordmarkPanel />
      <LegendPanel />
      <StatsPill />

      {/* ── Bottom row ── */}
      <SourcesPanel />
      <QueryBar />
      <ResponsePanel 
        isSpeaking={isSpeaking}
        onStopTTS={handleFullStop}
        isTTSMuted={isTTSMuted}
        onToggleMute={() => {
          setIsTTSMuted(prev => !prev);
          if (!isTTSMuted) stop();
        }}
      />

      {/* ── Source drawer (slides in from right on citation chip click) ── */}
      <SourceDrawer />
    </div>
  );
}
