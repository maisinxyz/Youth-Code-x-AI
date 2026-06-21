# CLAUDE.md — Engram Working Instructions

This file governs how Claude Code works on the Engram project across every session. Read this file at the start of every conversation. The user's global `~/.claude/CLAUDE.md` still applies; this file adds Engram-specific rules on top.

---

## Universal Rules (Every Session, Every Task)

1. **Always read `ENGRAM.md` and `PRD.md` at the start of every task.** No exceptions. Past conversation memory is not a substitute for re-reading.
2. **Never assume context from a previous session.** State is in the files. If it's not in `ENGRAM.md`, it doesn't exist.
3. **One PRD section per prompt.** Never combine tasks. If the user asks for "§3 and §4," ask which one to do first.
4. **After every task, update `ENGRAM.md`** if anything material changed: file structure, schemas, contracts, env vars, placeholder locations, or build status.
5. **Never advance to the next PRD section until the current one passes its acceptance criteria.** Acceptance criteria are written into the PRD for each section — they are the gate.
6. **Superpowers skills auto-trigger** — `systematic-debugging`, `verification-before-completion`, `test-driven-development`. Do not invoke them manually; let the harness route them.
7. **No wasted tokens on pleasantries** and yap in your chat outputs. be straight to the point and give me the answer to my query or response or output

---

## Phase-Specific Rules

### Phase 1 — Backend (PRD §1–§7)

- **No design skills** during this phase. Backend only.
- **Superpowers skills active:** `test-driven-development` for every endpoint and service; `verification-before-completion` before marking any section done.
- Focus: **correctness, typed responses, clean separation of concerns.** Pydantic v2 models everywhere.
- **Async from day one.** Every Backboard-bound function is `async def` even when stubbed. No sync→async conversions later.
- **Placeholder discipline:** every function or block that will be swapped on hackathon day MUST be marked with one of:
  - `# BACKBOARD_PLACEHOLDER` — anywhere a real Backboard API call will go.
  - `# SUPABASE_PLACEHOLDER` — anywhere a real Supabase query, auth check, or table read/write will go.
  - These markers are how hackathon-day swaps stay fast. Every marker also gets logged in `ENGRAM.md`'s **Placeholder Registry**.
- Verification gate: each PRD section finishes with `pytest` green + `VERIFICATION.md` checked off.

### Phase 2 — Shape Interview (PRD §8)

- Run `/shape` once as a **global design brief covering all frontend screens at once.**
- Ask questions **one screen at a time.** Do not flood the user with simultaneous decisions.
- **Do not write any frontend code** until the brief is complete and approved by the user.
- Output the brief as `DESIGN_BRIEF.md` at project root (also export tokens to `design/tokens.json`).
- Brief must explicitly resolve every "🚩 unresolved decision" flagged in `PRD.md` §0, §6, §13, §14.

### Phase 3 — Frontend (PRD §9–§17)

Skill discipline (use these, not raw component generation):

- `/impeccable teach` — **run ONCE** before any component is written. Loads global design context.
- `/impeccable craft` — invoke for **every new component**.
- `/animate` — **all Three.js and motion work.**
- `/overdrive` — specifically for the **query reaction animation (§14)** and **brain loading sequence (§12).**
- `/emil-design-eng` — active for **all motion and interaction decisions.**
- `/polish` — final pass before demo video (§20).
- `/critique` — UX review of the complete flow (§20).

### Phase 4 — Wire + Demo Data (PRD §18–§20)

- No new skill activations beyond Phase 3. Wire-up and dataset authoring.
- `/polish` and `/critique` run in §20.

### Phase 5 — Hackathon Integrations (PRD §21–§22)

- `/owasp-security` **active for all auth and API key handling.**
- Every placeholder swap is verified in pairs: stub still works → real call works → stub remains as fallback.

---

## Design Context (Read Before Any Frontend Work)

Engram is a **dark, professional tool for technical users** — engineers, PMs, founders.

- **Palette:** black / grey / white. Forest green `#2d6a4f` is the **only** accent color. full of animations
- **Voice:** feels like infrastructure, not a toy. Jarvis-like intelligence. Cinematic, not playful.
- **Tone:** restraint. Confidence. Nothing decorative. Every motion has intent.
- **Anti-patterns:** rainbows, gradients-for-the-sake-of-gradients, emoji-driven UI, friendly chatbot personas, marketing fluff copy.

---

## Working-Style Defaults

- Plan mode for any non-trivial task (3+ steps or architectural decisions).
- Verification before completion: never mark a PRD section done without running its acceptance tests and showing the output.
- After any user correction: update `ENGRAM.md` (technical fact) or `tasks/lessons.md` (process lesson). Don't repeat mistakes.
- Don't invent scope. PRD is the contract.
