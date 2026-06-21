export type NavAction =
  | { type: "scroll"; target: string }
  | { type: "navigate"; to: string }
  | { type: "modal"; name: string };

export type KeyDef = {
  label: string;
  width: number;       // in keyboard units (1u = standard alpha key)
  isNav?: boolean;
  logo?: string;       // lucide icon name, or "engram"
  action?: NavAction;
  isSpacer?: boolean;  // invisible gap between key groups
};

// ─── Full TKL ANSI Layout ────────────────────────────────────────────────────
// Unit size in 3D: 1u = 0.95 world units. Gap between keys = 0.07u.

export const TKL_ROWS: KeyDef[][] = [
  // Row 0 — Function row (Esc, F1-F12, nav cluster)
  [
    { label: "Esc",    width: 1,    isNav: true, logo: "engram",    action: { type: "scroll", target: "#section-hero" } },
    { label: "",       width: 0.5,  isSpacer: true },
    { label: "F1",     width: 1,    isNav: true, logo: "Home",      action: { type: "scroll", target: "#section-hero" } },
    { label: "F2",     width: 1,    isNav: true, logo: "Layers",    action: { type: "scroll", target: "#section-how" } },
    { label: "F3",     width: 1,    isNav: true, logo: "Brain",     action: { type: "scroll", target: "#section-brain" } },
    { label: "F4",     width: 1,    isNav: true, logo: "Plug",      action: { type: "scroll", target: "#section-connect" } },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "F5",     width: 1,    isNav: true, logo: "Play",      action: { type: "navigate", to: "/connect" } },
    { label: "F6",     width: 1,    isNav: true, logo: "Mail",      action: { type: "modal", name: "waitlist" } },
    { label: "F7",     width: 1,    isNav: true, logo: "LogIn",     action: { type: "navigate", to: "/connect" } },
    { label: "F8",     width: 1 },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "F9",     width: 1 },
    { label: "F10",    width: 1 },
    { label: "F11",    width: 1 },
    { label: "F12",    width: 1 },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "PrtSc",  width: 1 },
    { label: "ScrLk",  width: 1 },
    { label: "Pause",  width: 1 },
  ],

  // Row 1 — Number row
  [
    { label: "`",      width: 1 },
    { label: "1",      width: 1 },
    { label: "2",      width: 1 },
    { label: "3",      width: 1 },
    { label: "4",      width: 1 },
    { label: "5",      width: 1 },
    { label: "6",      width: 1 },
    { label: "7",      width: 1 },
    { label: "8",      width: 1 },
    { label: "9",      width: 1 },
    { label: "0",      width: 1 },
    { label: "-",      width: 1 },
    { label: "=",      width: 1 },
    { label: "⌫",      width: 2 },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "Ins",    width: 1 },
    { label: "Home",   width: 1 },
    { label: "PgUp",   width: 1 },
  ],

  // Row 2 — QWERTY
  [
    { label: "Tab",    width: 1.5 },
    { label: "Q",      width: 1 },
    { label: "W",      width: 1 },
    { label: "E",      width: 1 },
    { label: "R",      width: 1 },
    { label: "T",      width: 1 },
    { label: "Y",      width: 1 },
    { label: "U",      width: 1 },
    { label: "I",      width: 1 },
    { label: "O",      width: 1 },
    { label: "P",      width: 1 },
    { label: "[",      width: 1 },
    { label: "]",      width: 1 },
    { label: "\\",     width: 1.5 },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "Del",    width: 1 },
    { label: "End",    width: 1 },
    { label: "PgDn",   width: 1 },
  ],

  // Row 3 — Home row
  [
    { label: "Caps",   width: 1.75 },
    { label: "A",      width: 1 },
    { label: "S",      width: 1 },
    { label: "D",      width: 1 },
    { label: "F",      width: 1 },
    { label: "G",      width: 1 },
    { label: "H",      width: 1 },
    { label: "J",      width: 1 },
    { label: "K",      width: 1 },
    { label: "L",      width: 1 },
    { label: ";",      width: 1 },
    { label: "'",      width: 1 },
    { label: "Enter",  width: 2.25, isNav: true, logo: "ArrowRight", action: { type: "navigate", to: "/connect" } },
  ],

  // Row 4 — Shift row
  [
    { label: "Shift",  width: 2.25 },
    { label: "Z",      width: 1 },
    { label: "X",      width: 1 },
    { label: "C",      width: 1 },
    { label: "V",      width: 1 },
    { label: "B",      width: 1 },
    { label: "N",      width: 1 },
    { label: "M",      width: 1 },
    { label: ",",      width: 1 },
    { label: ".",      width: 1 },
    { label: "/",      width: 1 },
    { label: "Shift",  width: 2.75 },
    { label: "",       width: 1.25, isSpacer: true },
    { label: "↑",      width: 1 },
  ],

  // Row 5 — Bottom row
  [
    { label: "Ctrl",   width: 1.25 },
    { label: "⊞",      width: 1.25 },
    { label: "Alt",    width: 1.25 },
    { label: " ",      width: 6.25 },
    { label: "Alt",    width: 1.25 },
    { label: "Fn",     width: 1.25 },
    { label: "Ctrl",   width: 1.25 },
    { label: "",       width: 0.25, isSpacer: true },
    { label: "←",      width: 1 },
    { label: "↓",      width: 1 },
    { label: "→",      width: 1 },
  ],
];

// Keyboard geometry constants
export const KEY_UNIT = 0.95;    // world units per 1u key
export const KEY_GAP  = 0.07;    // gap between keys in world units
export const KEY_H    = 0.30;    // keycap height
export const HOUSING_H = 0.18;   // switch housing height
export const PLATE_H   = 0.20;   // keyboard plate height
export const ROW_SPACING = 1.02; // vertical spacing between rows (world units)

// Total keyboard width (sum of all keys in widest row + spacers)
// Row 0 is widest: Esc(1) + 0.5sp + F1-F4(4) + 0.25sp + F5-F8(4) + 0.25sp + F9-F12(4) + 0.25sp + PrtSc/ScrLk/Pause(3)
// = 1 + 0.5 + 4 + 0.25 + 4 + 0.25 + 4 + 0.25 + 3 = 21.25u → × KEY_UNIT ≈ 20.2wu
export const KEYBOARD_WIDTH = 21.25 * KEY_UNIT;
export const KEYBOARD_DEPTH = 7.5  * KEY_UNIT; // 6 rows + margins
