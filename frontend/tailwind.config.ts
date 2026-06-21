import type { Config } from "tailwindcss";
import tokens from "../design/tokens.json";

const colors = tokens.colors;
const typography = tokens.typography;
const animation = tokens.animation;

const flatColors = {
  "bg-void": colors.background.void.value,
  "bg-base": colors.background.base.value,
  "bg-surface": colors.background.surface.value,
  "bg-elevated": colors.background.elevated.value,
  "bg-overlay": colors.background.overlay.value,
  "bg-overlay-light": colors.background.overlayLight.value,

  "border-subtle": colors.border.subtle.value,
  "border-default": colors.border.default.value,
  "border-strong": colors.border.strong.value,
  "border-accent": colors.border.accent.value,

  "text-primary": colors.text.primary.value,
  "text-secondary": colors.text.secondary.value,
  "text-muted": colors.text.muted.value,
  "text-inverse": colors.text.inverse.value,

  "accent-muted": colors.accent.muted.value,
  "accent-default": colors.accent.default.value,
  "accent-bright": colors.accent.bright.value,
  "accent-vivid": colors.accent.vivid.value,
  "accent-ghost": colors.accent.ghost.value,
  "accent-glow": colors.accent.glow.value,
  "accent-edge": colors.accent.edge.value,

  "node-rest": colors.node.rest.value,
  "node-rest-edge": colors.node.restEdge.value,
  "node-hover": colors.node.hover.value,
  "node-active": colors.node.active.value,
  "node-active-edge": colors.node.activeEdge.value,
  "node-dimmed": colors.node.dimmed.value,

  "status-connected": colors.status.connected.value,
  "status-disconnected": colors.status.disconnected.value,
  "status-error": colors.status.error.value,
  "status-loading": colors.status.loading.value,
};

const fontSize = Object.fromEntries(
  Object.entries(typography.scale).map(([key, v]) => [key, v.rem]),
);

const spacing = Object.fromEntries(
  Object.entries(tokens.spacing)
    .filter(([k]) => k !== "_note")
    .map(([k, v]) => [k, (v as { rem: string }).rem]),
);

const transitionDuration = Object.fromEntries(
  Object.entries(animation.duration).map(([key, v]) => [key, `${v.ms}ms`]),
);

const transitionTimingFunction = Object.fromEntries(
  Object.entries(animation.easing).map(([key, v]) => [key, v.value]),
);

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: flatColors,
      fontFamily: {
        display: typography.families.display.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")),
        mono: typography.families.body.value.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")),
      },
      fontSize,
      spacing,
      borderRadius: {
        none: tokens.radius.none,
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        "2xl": tokens.radius["2xl"],
        pill: tokens.radius.pill,
      },
      boxShadow: {
        subtle: tokens.shadows.subtle.value,
        panel: tokens.shadows.panel.value,
        accentGlow: tokens.shadows.accentGlow.value,
        accentGlowStrong: tokens.shadows.accentGlowStrong.value,
        nodeGlowRest: tokens.shadows.nodeGlowRest.value,
      },
      backdropBlur: {
        panel: tokens.blur.panel,
        nav: tokens.blur.nav,
      },
      transitionDuration,
      transitionTimingFunction,
      letterSpacing: {
        display: typography.letterSpacing.display.value,
        normal: typography.letterSpacing.normal.value,
        wide: typography.letterSpacing.wide.value,
      },
      lineHeight: {
        tight: String(typography.lineHeight.tight.value),
        snug: String(typography.lineHeight.snug.value),
        normal: String(typography.lineHeight.normal.value),
        relaxed: String(typography.lineHeight.relaxed.value),
      },
    },
  },
  plugins: [],
} satisfies Config;
