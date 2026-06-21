import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export function BrainVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInView = useInView(containerRef, { margin: "-20%" });

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch((err) => console.log("Video play error:", err));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView]);

  return (
    <div ref={containerRef} className="h-full w-full relative bg-black rounded-2xl overflow-hidden">
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        className="h-full w-full object-cover transition-opacity duration-1000"
        style={{
          // Optional: Add a subtle filter to match the dark aesthetic
          filter: "brightness(0.9) contrast(1.1) saturate(1.2)",
        }}
        src="/engram-demo.mp4"
      />
      {/* Noise texture overlay to match the rest of the site */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}
