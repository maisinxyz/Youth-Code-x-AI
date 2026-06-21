# Engram — Design Brief
**Phase 3 Frontend Handoff Document**
**Date:** 2026-05-08
**Status:** Approved — Implementation Ready

---

## 1. Feature Summary

Engram is a dark, professional AI-powered company memory tool. It ingests data from organizational sources (Slack, Notion, Google Drive, Linear, GitHub, Confluence), builds a 3D semantic knowledge graph ("the Brain"), and lets technical users query that graph in natural language — voice or text — to surface answers with traceable source references.

Target users: engineers, PMs, founders at technical companies. The tool feels like infrastructure. It is Jarvis-like in intelligence, cinematic in presentation, and restrained in ornamentation. Every visual and motion choice serves function. Nothing decorates for its own sake.

The complete user journey: Landing → Auth → Connector Selection → Brain Ingestion Sequence → Brain (main app) → Query → Source Reference.

---

## 2. Primary User Action

**Ask the Brain a question. Get a grounded answer with a source you can trust.**

Every screen serves this loop. The landing page builds belief that the Brain is real. Auth gates access. Connector selection fills the Brain. The ingestion sequence makes the Brain feel alive before it's usable. The main Brain screen is the persistent workspace. The query bar is the primary interaction surface.

---

## 3. Design Direction

### Typography

**Display font: Barlow Condensed** (Google Fonts, weights 700 and 800)
- Used for headlines, hero text, section titles, the logo wordmark.
- Narrow and architectural at large scale — the letterforms feel like infrastructure signage and film title cards. Unmistakably purposeful. Nothing casual about it.
- Fallback stack: `"Barlow Condensed", "Arial Narrow", sans-serif`

**Body font: Geist Mono** (Vercel, weights 400 and 500)
- Used for all body copy, labels, UI text, query bar, response cards, source snippets.
- Monospaced enforces the tool-like, technical character. Engineers read mono instinctively. Geist Mono is clean without being generic — it carries the weight of a professional developer tool.
- Fallback stack: `"Geist Mono", "JetBrains Mono", "Cascadia Code", ui-monospace, monospace`

**Scale (4pt base, 1rem = 16px):**
| Token | px | rem | Usage |
|---|---|---|---|
| `text-xs` | 11px | 0.6875rem | Meta labels, timestamps, badge text |
| `text-sm` | 13px | 0.8125rem | Source snippets, secondary UI |
| `text-base` | 16px | 1rem | Body, query bar input, response cards |
| `text-md` | 20px | 1.25rem | Card headings, panel labels |
| `text-lg` | 24px | 1.5rem | Section subheadings |
| `text-xl` | 32px | 2rem | Screen headings |
| `text-2xl` | 48px | 3rem | Landing section titles |
| `text-3xl` | 64px | 4rem | Landing hero subtitle |
| `text-hero` | 96px | 6rem | Landing hero headline |

**Line heights:** `1.0` for display/hero, `1.4` for body, `1.6` for long-form prose.
**Letter spacing:** `-0.02em` for display sizes ≥ 32px. `0` for body.

---

### Color System (OKLCH)

All surfaces are near-black. The Brain renders in a true black void. Panels are semi-transparent dark surfaces layered over it. Forest green `#2d6a4f` → `oklch(42% 0.095 162)` is the only chromatic accent. Everything else is achromatic.

**Background layers (bottom to top):**
- `bg-void`: `oklch(0% 0 0)` — the 3D canvas, pure black
- `bg-base`: `oklch(8% 0 0)` — main app shell, landing page body
- `bg-surface`: `oklch(12% 0 0)` — panels, cards, connector cards
- `bg-elevated`: `oklch(16% 0 0)` — hover states, active card, drawer
- `bg-overlay`: `oklch(12% 0 0 / 85%)` — floating panels over the brain with backdrop blur

**Border:**
- `border-subtle`: `oklch(22% 0 0)` — default card and panel borders
- `border-default`: `oklch(30% 0 0)` — interactive element borders
- `border-accent`: `oklch(42% 0.095 162)` — active state, selected node

**Text:**
- `text-primary`: `oklch(96% 0 0)` — primary body text
- `text-secondary`: `oklch(70% 0 0)` — secondary labels, timestamps
- `text-muted`: `oklch(45% 0 0)` — placeholder text, disabled
- `text-inverse`: `oklch(8% 0 0)` — text on accent green backgrounds

**Accent green variants (derived from `oklch(42% 0.095 162)`):**
- `accent-muted`: `oklch(28% 0.06 162)` — dark subtle tint
- `accent-default`: `oklch(42% 0.095 162)` — base (#2d6a4f)
- `accent-bright`: `oklch(56% 0.11 162)` — hover state, lit node
- `accent-vivid`: `oklch(68% 0.13 162)` — cascade peak moment, active glow
- `accent-ghost`: `oklch(42% 0.095 162 / 15%)` — subtle tinted surface
- `accent-glow`: `oklch(56% 0.11 162 / 40%)` — bloom spread in 3D
- `accent-edge`: `oklch(68% 0.13 162 / 70%)` — lit edge lines in graph

**Node colors (achromatic):**
- `node-rest`: `oklch(30% 0 0)` — resting node fill
- `node-rest-edge`: `oklch(40% 0 0 / 50%)` — resting edge line
- `node-hover`: `oklch(55% 0 0)` — hovered node
- `node-active`: `oklch(56% 0.11 162)` — query-activated node (accent)
- `node-active-edge`: `oklch(68% 0.13 162 / 70%)` — activated edge

---

### Tone

- **Restraint.** No animations that don't serve orientation or feedback.
- **Confidence.** Copy is declarative. No hedging. No "we think" or "maybe try."
- **Infrastructure feel.** More terminal than dashboard. More observatory than playground.
- **Darkness is the canvas.** Don't fight it with light UI chrome.

---

## 4. Screen-by-Screen Layout Strategy

### Screen 1 — Brain (Main App)

**Layout:** Full viewport. The Three.js scene occupies 100vw × 100vh. UI is composited on top in a separate layer with `pointer-events: none` on the canvas, `pointer-events: auto` only on interactive overlays.

**Spatial structure:**
- Top-left: Logo wordmark (Barlow Condensed, 16px, `text-secondary`) + connection status badge
- Top-right: User avatar / menu — minimal, 32px icon
- Bottom-center: QueryBar — floating pill, centered, 640px wide, 52px tall
- No sidebar. No persistent navigation rail. The Brain is the UI.

**Node layout:** Nodes are spatially partitioned by data source into loose 3D clusters. Each cluster occupies a distinct region of the scene volume — not rigidly gridded, but organically separated so users can visually navigate by source. Cluster labels are ghost text floating near the cluster centroid, only visible on hover or during ingestion.

**Camera:** Default view shows the full graph. Orbit controls always active. Camera rig has a slow procedural idle drift when no interaction is happening (amplitude: subtle, ~2–4° rotation over 10–15s cycles).

**Edges:** Three.js `Line2` or `TubeGeometry` for hair-thin luminous lines. `linewidth: 1`, opacity 0.3 at rest. Color: `node-rest-edge`. No labels on edges.

**Post-processing stack:** `@react-three/postprocessing`
- `UnrealBloom`: strength 0.4, radius 0.3, threshold 0.6 (tunable)
- `ChromaticAberration`: offset 0.0005 at rest, spikes to 0.002 on cascade start

---

### Screen 2 — Landing Page

**Layout:** Single-page scroll. Sections flow vertically. No sidebar.

**Section order:**
1. **Hero** — 100vh. Full-bleed Three.js brain rotating slowly center-screen. Barlow Condensed headline (96px, `text-primary`) — 2–3 words max. Mono subtitle (24px, `text-secondary`). Primary CTA "Get Started" (accent green bg) + secondary "Log In" (border only). Both in top-right nav AND repeated in hero center.
2. **How it works** — 3-panel horizontal explainer: Ingest → Build → Ask. Each panel has an icon (SVG, accent green line), heading (Barlow Condensed 32px), body (mono 16px).
3. **Demo section** — Animated walkthrough. Shows connector selection → brain populating → query response. Can be a scripted CSS/GSAP animation or a looping video segment.
4. **Social proof / logos** — Muted strip of company logos if applicable.
5. **Bottom CTA** — Full-width dark panel. Barlow Condensed 48px headline + "Get Started" button.

**Nav:** Fixed top, `bg-base / 80%` + `backdrop-filter: blur(12px)`. Logo left. "Log In" (ghost button) + "Get Started" (filled accent) right.

**Scroll behavior:** GSAP ScrollTrigger. Sections reveal with `opacity: 0 → 1` + `translateY(24px → 0)` over 500ms. Brain parallax: canvas scale and camera Z shift on scroll.

---

### Screen 3 — Connector Selection

**Layout:** Centered container, max-width 720px. Vertically centered in viewport.

**Header:** Barlow Condensed 32px — "Connect your sources." Mono 16px subtitle — "Select the tools your team already uses."

**Grid:** 2 columns × 3 rows of connector cards. Each card: 160px × 120px. `bg-surface` fill, `border-subtle` border, 8px radius. Contents: connector logo (SVG, 32px), connector name (mono 13px, `text-secondary`), status dot (grey = unconnected, green = connected).

**Inline expansion:** Click card → card expands in place to ~160px × 240px. Reveals: short description (mono 13px), OAuth field or instructions, "Authorize" button (accent border, accent text). Other cards dim slightly (`opacity: 0.5`).

**Demo mode:** All 6 cards arrive pre-selected (green status dots). CTA "Build My Brain" fixed at bottom-center. Fixture data from Meridian proxy feeds the ingestion.

---

### Screen 4 — Brain Loading / Ingestion Sequence

**Layout:** Full viewport black void. No UI chrome except a subtle progress indicator — a thin accent green line at the absolute bottom edge of the screen, filling left-to-right.

**Sequence:**
1. Void. 0.5s hold.
2. First node materializes from zero — diamond geometry fades in with scale `0 → 1` + UnrealBloom spike.
3. Additional nodes emerge in staggered waves, one cluster at a time. Each node's emergence is brief (200–300ms) but beautiful.
4. Edges thread between existing nodes as new nodes settle. Edge draw uses animated `dashOffset` or `TubeGeometry` grow.
5. After all nodes are placed, camera pulls back slowly to reveal the full graph.
6. Crossfade into the main Brain screen (same Three.js scene, UI chrome fades in).

**Minimum floor:** 3 seconds regardless of backend speed. If data arrives early, sequence plays in full before transitioning.

**No text overlays during emergence.** Only the progress line at the bottom edge.

---

### Screen 5 — Floating UI Panels (over Brain)

**QueryBar (default):**
- Position: `bottom: 32px`, horizontally centered
- Shape: pill, 640px × 52px, `bg-overlay` + `backdrop-filter: blur(20px)`, `border-subtle` border
- Left: microphone icon (SVG, 20px, `text-muted`)
- Center: mono text input placeholder — "Ask your brain anything..."
- Right: submit arrow icon
- Focused state: border changes to `border-accent`, glow shadow (accent-glow) appears beneath

**QueryBar (voice active):**
- Pill width stays same, inner content morphs: text input replaced by an animated audio waveform visualization (SVG bars or Web Audio API frequency bars in `accent-bright`)
- Waveform animates in real-time during recording and during voice playback

**Response Card:**
- Rises from QueryBar on query submit: `translateY(100%) → translateY(0)`, 300ms ease-out
- Position: sits directly above QueryBar, same 640px width
- Structure: `bg-overlay` + `backdrop-blur(20px)`, `border-subtle` border, 16px padding
- Top: Answer text in mono 16px `text-primary`, max 4 lines before truncation with expand toggle
- Divider: 1px `border-subtle`
- Bottom: Source chips — small pills with connector icon + truncated title. Click opens source reference view.
- Close: X icon top-right of card

---

### Screen 6 — Source Reference View

**Step 1 — Node excerpt popup (3D space):**
- When user clicks an activated node or a source chip, a small floating card materializes in 3D space near the node.
- Card: 240px wide, `bg-overlay` + `backdrop-blur`, `border-accent` border. Contains a 2–3 line excerpt with accent green highlight on matched text.
- Card appears with scale `0.8 → 1.0` + opacity `0 → 1`, 200ms.
- Node maintains its `node-active` glow state.

**Step 2 — Side Drawer:**
- 400ms after excerpt appears (or immediately on chip click without hovering node), right-side drawer slides in: `translateX(100%) → translateX(0)`, 350ms ease-out.
- Width: 400px. Full viewport height. `bg-elevated` background. `border-subtle` left border.
- Header: Connector icon + document/channel name (Barlow Condensed 16px). Close X top-right.
- Body: Full excerpt text in mono 14px. Matched passages highlighted with `accent-ghost` background + `accent-bright` left border.
- Footer: "Open original" link → external URL.
- Node stays highlighted and excerpt popup stays visible while drawer is open.
- Drawer close: slide right out, excerpt fades, node returns to `node-rest` after 800ms.

---

## 5. Key States

### Screen 1 — Brain

| State | Description |
|---|---|
| **Default** | Full graph visible, camera in idle drift, all nodes in `node-rest` |
| **Query submitted** | QueryBar shows spinner/typing indicator, camera begins drift toward target cluster |
| **Cascade active** | Seed nodes lit accent green, cascade spreading, ChromaticAberration spike |
| **Response shown** | Response card visible, source nodes highlighted, camera settled |
| **Node hover** | Hovered node shifts to `node-hover`, cursor pointer, tooltip with node title |
| **Source drawer open** | Drawer visible, originating node stays highlighted |
| **Empty graph** | No nodes — prompt user to add connectors (rare edge case) |
| **Error state** | Query failed — response card shows error message in mono, `text-secondary` |

### Screen 2 — Landing

| State | Description |
|---|---|
| **Default** | Hero visible, brain rotating, CTAs visible |
| **Scrolling** | Sections reveal sequentially, brain parallaxes |
| **Nav scrolled past hero** | Nav background becomes fully opaque |

### Screen 3 — Connector Selection

| State | Description |
|---|---|
| **Default (demo)** | All 6 cards pre-selected, CTA enabled |
| **Card expanded** | One card expanded, others dimmed |
| **Authorizing** | "Authorize" button shows spinner inside card |
| **Connected** | Card collapses, status dot turns accent green |
| **Error** | Auth failed — inline error text below card button |
| **0 selected** | CTA disabled / greyed |

### Screen 4 — Ingestion

| State | Description |
|---|---|
| **Loading** | Sequence animating, progress line filling |
| **Error** | Sequence stops, error message fades in center, retry button |
| **Complete** | Crossfade to Brain screen |

### Screen 5 — Query Panels

| State | Description |
|---|---|
| **QueryBar idle** | Placeholder text visible |
| **QueryBar focused** | Accent border, glow |
| **QueryBar voice** | Waveform animation |
| **Thinking** | Response card appears with loading indicator (mono ellipsis or skeleton lines) |
| **Response shown** | Full text + sources |
| **No sources** | Response card shows "No sources found" in `text-muted` |

### Screen 6 — Source Reference

| State | Description |
|---|---|
| **Excerpt popup only** | Popup visible, drawer not yet open |
| **Drawer open** | Both popup and drawer visible |
| **Loading drawer** | Drawer open with skeleton content |
| **External link** | "Open original" navigates to source URL |

---

## 6. Interaction Model

```
Landing Page
  └─> Hero CTA "Get Started" ──────────────┐
  └─> Nav "Log In" ─────────────────────────┤
                                            ▼
                                      Auth Screen
                                            │
                                            ▼
                               Connector Selection Screen
                                  (all 6 pre-selected)
                                            │
                                  "Build My Brain" CTA
                                            │
                                            ▼
                               Ingestion Sequence (min 3s)
                                            │
                                  Complete → crossfade
                                            │
                                            ▼
                            ┌──── Brain (Main App) ────┐
                            │                          │
                            │  Free orbit / zoom / pan │
                            │                          │
                            │  QueryBar (bottom)       │
                            │    ├─ Text input → submit│
                            │    └─ Voice → waveform   │
                            │                          │
                            │  Query submitted          │
                            │    ├─ Camera drifts       │
                            │    ├─ Cascade fires       │
                            │    └─ Response card rises │
                            │                          │
                            │  Source chip clicked     │
                            │    ├─ Excerpt popup (3D) │
                            │    └─ Drawer slides in   │
                            │         └─ "Open orig."  │
                            └──────────────────────────┘
```

**State persistence:** Brain state (graph data, camera position) persists for the session. Closing the response card returns to the idle brain state. Closing the drawer returns to response card visible.

**Back navigation:** No browser back expected in the main app. The landing page is the only non-app screen with normal browser history.

---

## 7. Content Requirements

### Landing Page Copy

**Hero headline:** "Your company's memory." (Barlow Condensed, 96px)
**Hero subtitle:** "Ask anything. Trace everything." (mono, 24px, `text-secondary`)
**Hero CTA:** "Get Started" / "Log In"

**How it works titles:**
1. "Connect your stack." — body: "Slack, Notion, Drive, Linear, GitHub, Confluence."
2. "Build the Brain." — body: "Every document, thread, and decision mapped semantically."
3. "Ask anything." — body: "Natural language queries with source-traced answers."

**Bottom CTA headline:** "Everything your team knows. One question away."
**Bottom CTA button:** "Start for free"

### App Microcopy

- QueryBar placeholder: `Ask your brain anything...`
- QueryBar voice tooltip: `Hold to speak`
- Response card header: none (no label — the answer IS the header)
- Source chip format: `[Icon] Channel / Document name`
- Source drawer "Open original" link: `↗ View in [Connector name]`
- Ingestion progress: no text — only the green line
- Empty brain state: "No sources connected. Add connectors to build your Brain." + button "Connect sources"
- Error state (query): "Something went wrong. Try again." + retry icon

### Connector Names + Labels (for cards)

| Connector | Display Name | Status Label |
|---|---|---|
| Slack | Slack | Connected / Connect |
| Notion | Notion | Connected / Connect |
| Google Drive | Drive | Connected / Connect |
| Linear | Linear | Connected / Connect |
| GitHub | GitHub | Connected / Connect |
| Confluence | Confluence | Connected / Connect |

---

## 8. Motion & Animation Principles

**Rule 0: Every motion has a reason.** No enter/exit animation unless it communicates something (state change, hierarchy, direction).

### Durations
- **Instant** (0–100ms): Focus rings, hover fill color changes
- **Snap** (150ms): Button state changes, status dot changes
- **Standard** (250–350ms): Panel appears/disappears, card expansion
- **Deliberate** (400–600ms): Drawer slide, response card rise
- **Cinematic** (800ms–2s): Camera drift, cascade spread, ingestion emergence

### Easing
- **`ease-out` (cubic-bezier 0.0, 0.0, 0.2, 1.0):** All enters — panels rising, cards appearing, nodes materializing
- **`ease-in` (cubic-bezier 0.4, 0.0, 1.0, 1.0):** All exits — panels dismissing, cards leaving
- **`ease-in-out` (cubic-bezier 0.4, 0.0, 0.2, 1.0):** Camera drift, idle motion, sustained animations
- **`spring` (react-spring config):** Node emergence — `mass: 1, tension: 280, friction: 60`

### Specific Animations

**Brain idle drift:**
- Camera yaw oscillates: amplitude ±3°, period 12s, sine wave
- Camera pitch oscillates: amplitude ±1.5°, period 18s, sine wave (phase-offset)
- Nodes have per-node idle bobbing: amplitude 0.02 units, period 3–7s (randomized per node)

**Cascade (query reaction):**
1. Query submitted → ChromaticAberration offset jumps to 0.002 over 80ms
2. Seed nodes (top-K relevant nodes) switch to `node-active` + UnrealBloom spike (200ms)
3. Each neighbor ring lights up with 60–120ms delay per hop (staggered)
4. Camera begins 800ms drift toward the centroid of activated nodes
5. ChromaticAberration eases back to 0.0005 over 600ms
6. Response card rises after cascade reaches ~70% coverage (async)

**Node emergence (ingestion):**
- Each node: scale `0 → 1.2 → 1.0` (overshoot), opacity `0 → 1`, duration 300ms
- UnrealBloom strength spikes briefly on each emergence
- Stagger: 50–150ms between nodes (randomized, cluster-by-cluster)
- Edges draw in after both endpoint nodes are settled: animated `dashOffset` over 200ms

**Response card rise:**
- `translateY(32px → 0)`, `opacity: 0 → 1`, 350ms ease-out
- Card exit: `translateY(0 → 16px)`, `opacity: 1 → 0`, 200ms ease-in

**Drawer slide:**
- Enter: `translateX(100% → 0)`, 400ms ease-out
- Exit: `translateX(0 → 100%)`, 300ms ease-in

**Voice waveform:**
- Bars animate height in real-time from Web Audio API `AnalyserNode` frequency data
- 32 bars, accent-bright color, smooth interpolation (lerp factor 0.3 per frame)
- During playback: waveform responds to TTS audio output stream

**Landing parallax:**
- GSAP ScrollTrigger on brain canvas: camera Z shifts from -5 to +2 as hero scrolls out
- Section reveals: `opacity 0 → 1`, `translateY 24px → 0`, scrub pinned to scroll position

---

## 9. Technology Recommendations

### Core 3D Stack
- **React Three Fiber (`@react-three/fiber`)** — React bindings for Three.js. The only sane way to manage Three.js in a React app with per-node state.
- **Drei (`@react-three/drei`)** — Camera controls (`OrbitControls`), `Line2`, `Text`, environment helpers.
- **`@react-three/postprocessing`** + **`postprocessing`** — UnrealBloom and ChromaticAberration effects. Managed as a declarative `<EffectComposer>`.
- **Three.js** — Underlying renderer. Use `r3f` patterns; do not mix imperative Three.js with declarative r3f.

### Animation
- **GSAP + ScrollTrigger** — Landing page scroll animations, section reveals, parallax. Do not use for in-app UI transitions.
- **Framer Motion** — All React component animations: panels, drawers, cards, QueryBar morphs. Handles `AnimatePresence` for mount/unmount.
- **React Spring** — Node emergence spring physics in the Three.js scene.

### Graph Layout
- **No automatic force layout.** Cluster positions are computed from fixture data (Meridian proxy assigns cluster centroids per source type). Within-cluster node positions use a simple sphere-packing algorithm seeded per source.
- For production: consider `d3-force-3d` for live layout after hackathon.

### UI Framework
- **React** with **TypeScript**.
- **Tailwind CSS v4** — utility classes for all HTML/CSS UI (panels, landing, connectors). Do NOT use Tailwind for Three.js scene styles.
- CSS custom properties for design tokens (exported from `design/tokens.json` at build time).

### Fonts
- Load via `@fontsource/syne` and `@fontsource/ibm-plex-mono` — no Google CDN in production. Self-hosted via npm packages.

### Voice
- **Web Speech API** (`SpeechRecognition`) for voice input — zero-dependency, sufficient for demo.
- **Web Audio API** (`AudioContext`, `AnalyserNode`) for waveform visualization.
- For TTS response playback: `ElevenLabs` API or browser `SpeechSynthesis` (lower quality, but zero config).

### Other
- **Vite** — Build tool for the frontend.
- **React Router v6** — Routing between landing, auth, connector, and app routes.
- **Zustand** — Global app state (graph data, active query, camera state, connector status).

---

## 10. Open Questions

1. **Voice response playback:** Is TTS output from ElevenLabs or just text? If ElevenLabs, API key handling must be confirmed before §14 implementation. Waveform behavior differs between input-only and full duplex.

2. **Graph data shape from backend:** What is the exact JSON schema for nodes and edges returned by the Backboard proxy? Implementer needs: `{id, source_type, title, position_hint?, connections: [id]}` minimum. Confirm with backend team before `§9` (graph renderer).

3. **Cluster centroid assignment:** Who owns the 3D position? Backend assigns source-type clusters, frontend distributes within-cluster randomly. Need to confirm the `position_hint` or `cluster_id` field is present in node payload.

4. **Auth provider:** PRD references auth but does not specify provider. Supabase Auth assumed (consistent with `SUPABASE_PLACEHOLDER` markers in backend). Confirm redirect URIs and session token format before implementing auth screen.

5. **Connector auth flow (demo vs. real):** For demo, all 6 connectors are pre-selected and no real OAuth happens. For hackathon day, does any real OAuth need to work, or is everything Meridian-proxied? This affects whether connector cards need real OAuth redirect handling.

6. **Landing page brain:** Does the landing page Three.js scene share the same scene graph as the app brain, or is it a lightweight placeholder (lower poly count, fewer nodes)? Recommend a separate lightweight scene for landing to avoid loading the full graph before auth.

7. **Mobile / tablet:** The PRD targets desktop. Confirm whether any mobile breakpoint work is required for launch. The Brain is likely not functional on mobile without significant redesign.

8. **Source drawer max height:** On short viewports, the drawer may overflow. Define scroll behavior: inner content scrolls, header/footer fixed.

9. **Cascade falloff:** How many hops does the cascade travel before stopping? Recommend: seed + 2 hops max. Beyond that, dimming all non-activated nodes to 20% opacity for contrast.

10. **Error boundary for Three.js:** If WebGL is unavailable or GPU budget exceeded, what is the fallback? Recommend: static screenshot of the brain with a "WebGL not supported" banner rather than a blank screen.
