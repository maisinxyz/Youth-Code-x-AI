import { motion, useInView } from "framer-motion";
import { useRef, type CSSProperties } from "react";

type WordsPullUpProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
  staggerMs?: number;
};

export function WordsPullUp({
  text,
  className = "",
  style,
  staggerMs = 80,
}: WordsPullUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.6,
              delay: (i * staggerMs) / 1000,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
}

type Segment = { text: string; className?: string };

type WordsPullUpMultiStyleProps = {
  segments: Segment[];
  className?: string;
  style?: CSSProperties;
  staggerMs?: number;
};

export function WordsPullUpMultiStyle({
  segments,
  className = "",
  style,
  staggerMs = 80,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div
      ref={ref}
      className={`inline-flex flex-wrap justify-center ${className}`}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 24, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.6,
            delay: (i * staggerMs) / 1000,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
}
