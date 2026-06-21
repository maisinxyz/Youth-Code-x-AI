import { useState } from "react";
import { motion } from "framer-motion";

// Connectors that feed into Engram
const FLOW_SOURCES = [
  { id: "slack",      label: "Slack",         src: "/logos/slack.svg",       x: 0,   y: 0 },
  { id: "notion",     label: "Notion",        src: "/logos/notion.svg",      x: 120, y: 0 },
  { id: "drive",      label: "Google Drive",  src: "/logos/googledrive.svg", x: 240, y: 0 },
  { id: "jira",       label: "Jira",          src: "/logos/jira.svg",        x: 60,  y: 80 },
  { id: "confluence", label: "Confluence",    src: "/logos/confluence.svg",  x: 180, y: 80 },
  { id: "teams",      label: "Teams",         src: "/logos/teams.svg",       x: 300, y: 80 },
];

// Central Engram node position
const CENTER_X = 170;
const CENTER_Y = 210;

// Animated particle that flows along a path
function FlowParticle({
  startX,
  startY,
  endX,
  endY,
  delay,
  active,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  active: boolean;
}) {
  // Midpoint with curve offset
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 10;

  return (
    <motion.circle
      cx={startX}
      cy={startY}
      r={active ? 3 : 2}
      fill={active ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)"}
      initial={{ cx: startX + 20, cy: startY + 20, opacity: 0 }}
      animate={{
        cx: [startX + 20, midX, endX],
        cy: [startY + 20, midY, endY],
        opacity: [0, active ? 0.9 : 0.4, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeInOut",
      }}
    />
  );
}

export default function DataFlowViz() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      className="mt-6 w-full max-w-[380px]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <svg
        viewBox="0 -5 380 270"
        className="w-full h-auto"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter for active state */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial glow for center node */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Connection lines from each source to center */}
        {FLOW_SOURCES.map((src) => {
          const isActive = hoveredId === src.id;
          const srcCenterX = src.x + 20;
          const srcCenterY = src.y + 20;
          const midX = (srcCenterX + CENTER_X) / 2;
          const midY = (srcCenterY + CENTER_Y) / 2 - 15;

          return (
            <g key={`line-${src.id}`}>
              {/* Path line */}
              <motion.path
                d={`M ${srcCenterX} ${srcCenterY + 20} Q ${midX} ${midY} ${CENTER_X} ${CENTER_Y}`}
                fill="none"
                stroke={isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)"}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeDasharray={isActive ? "none" : "3 6"}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{
                  duration: 1.2,
                  delay: 0.5 + FLOW_SOURCES.indexOf(src) * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
              />

              {/* Flowing particles */}
              <FlowParticle
                startX={srcCenterX}
                startY={srcCenterY + 20}
                endX={CENTER_X}
                endY={CENTER_Y}
                delay={FLOW_SOURCES.indexOf(src) * 0.6}
                active={isActive}
              />
              <FlowParticle
                startX={srcCenterX}
                startY={srcCenterY + 20}
                endX={CENTER_X}
                endY={CENTER_Y}
                delay={FLOW_SOURCES.indexOf(src) * 0.6 + 1.8}
                active={isActive}
              />
            </g>
          );
        })}

        {/* Source icons */}
        {FLOW_SOURCES.map((src, i) => {
          const isActive = hoveredId === src.id;

          return (
            <motion.g
              key={src.id}
              onMouseEnter={() => setHoveredId(src.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true }}
            >
              {/* Hover glow ring */}
              {isActive && (
                <motion.circle
                  cx={src.x + 20}
                  cy={src.y + 20}
                  r={24}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  filter="url(#glow)"
                />
              )}

              {/* Icon background */}
              <rect
                x={src.x}
                y={src.y}
                width={40}
                height={40}
                rx={12}
                fill={isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
                stroke={isActive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}
                strokeWidth={1}
                style={{
                  transition: "all 0.3s ease",
                  filter: isActive ? "drop-shadow(0 0 12px rgba(255,255,255,0.1))" : "none",
                }}
              />

              {/* Logo image */}
              <image
                href={src.src}
                x={src.x + 10}
                y={src.y + 10}
                width={20}
                height={20}
                style={{
                  transition: "opacity 0.3s ease",
                  opacity: isActive ? 1 : 0.6,
                }}
              />

              {/* Label */}
              <text
                x={src.x + 20}
                y={src.y + 54}
                textAnchor="middle"
                fill={isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}
                fontSize="9"
                fontFamily="'Geist Mono', monospace"
                style={{ transition: "fill 0.3s ease" }}
              >
                {src.label}
              </text>
            </motion.g>
          );
        })}

        {/* Center Engram node */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          {/* Ambient glow */}
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={40}
            fill="url(#centerGlow)"
          />

          {/* Pulsing ring */}
          <motion.circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={22}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            animate={{
              r: [22, 28, 22],
              opacity: [0.3, 0.08, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner node */}
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={18}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />

          {/* Engram label */}
          <text
            x={CENTER_X}
            y={CENTER_Y + 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize="9"
            fontFamily="'Barlow Condensed', sans-serif"
            fontWeight="700"
            letterSpacing="0.1em"
          >
            ENGRAM
          </text>

          {/* Sub-label */}
          <text
            x={CENTER_X}
            y={CENTER_Y + 36}
            textAnchor="middle"
            fill="rgba(255,255,255,0.2)"
            fontSize="8"
            fontFamily="'Geist Mono', monospace"
          >
            your brain
          </text>
        </motion.g>
      </svg>
    </motion.div>
  );
}
