# Cook Together, Stay Together — Complete Project Summary

*Everything in one place. Last updated July 2026.*

---

## 1. Links & status

| What | Where |
|---|---|
| **Play it live** | https://shiblu-dotcom.github.io/cook-together/ (also reachable from the root: shiblu-dotcom.github.io redirects) |
| **Source code** | https://github.com/Shiblu-dotcom/cook-together (public) |
| **CI/CD** | GitHub Actions — every push to `main`: lint → 42 tests → build → deploy (~40s) |
| **Concept & market research** | [docs/CONCEPT.md](CONCEPT.md) |
| **Version** | 1.0.0 — full PRD implemented plus the Conductor architecture |
| **Install on phone** | Open the live link → browser menu → "Add to Home Screen" (PWA, works offline) |

**Live-site caveat:** GitHub Pages is static, so the AI runs canned fallback
responses there. The full AI experience (real judging, vision, judge memory)
activates when the repo is imported to Vercel with an `ANTHROPIC_API_KEY`
env var — the proxy code is already built and waiting.

## 2. What it is

A 15-minute cooking game that tricks couples into having a real
conversation. One phone, one kitchen. Each partner privately checks in
about their day, receives a secret ingredient, and cooks against — and
with — their partner while the game orchestrates questions, twists, one
cooperative moment, and an AI judge who knows how their day went. Every
night ends with one Word, saved forever to the couple's collection.

## 3. The Conductor (the core design)

The check-in produces a **signal**: each partner privately sets two
sliders — valence (rough → great day) and energy (empty → wired). The
combined couple-state conducts the entire night:

| Couple-state | When | The night becomes |
|---|---|---|
| Celebration | both up | Ambitious theme, spicy twists, playful roasting |
| Comfort | both down | Warm nostalgic theme, soft twist, gentle judge |
| Gentle | both wiped | Low-effort everything |
| **Divergent** | one up, one down | The delicate night — see below |
| Balanced | ordinary day | Plays it straight |

On a **divergent** night: the down partner silently draws the forgiving
ingredient (effort follows energy), questions switch to a supportive
bridge-building pool ("what's one thing your partner could take off your
plate this week?"), the twist stays light, Chef turns patient and
proactive, the judge is protective and may let them edge a believable
win, and The Word reaches for repair words — *steadied, held, mended*.

**Prime directive: subtlety.** Encoded in every AI prompt: never mention
the moods, never reveal the night adapted. The struggling partner just
experiences a night that happened to be kind. Signals are self-reported,
so they nudge — never force.

All steering is **deterministic** (`src/utils/nightSignal.js`) — it works
even without the AI.

## 4. The full night, stage by stage

1. **Welcome** — names once, then remembered. How-it-works strip for
   first-timers. Interrupted nights offer "Resume where you left off."
2. **Check-in** — vibe + craving chips, then the private mood sliders
   (+ optional text, voice-dictation supported). Skippable.
3. **Theme + secrets** — AI picks a theme fitting the couple-state;
   ingredients are theme-matched (dessert nights never deal blue cheese)
   and effort-balanced. Swap option stays in-theme. Optional **stakes**
   agreed up front (loser does dishes / winner picks the movie / loser
   writes a note).
4. **The cook** — 15 minutes. Tap the timer to pause. Ambient generative
   music in five genuinely distinct moods. Question cards (rotated,
   never repeated until pool exhaustion; deep questions gated until
   earned — night 2+, one joining lighter nights from night 7).
   **Together Moment** at the 9-minute mark: one forced-cooperation beat
   (swap stations, feed each other a taste, one pan). Twist at 4 minutes,
   difficulty steered by the night. Voice-based Chef assistant who knows
   the theme, the clock, the secrets (never says them aloud), and the
   night's mood. Photo + voice memory capture (+10 points each).
5. **Submit** — dramatic dish names, descriptions, photos.
6. **Judgment** — the AI judge *sees* the dish photos, knows the day,
   the theme, the twist, the coop moment, the stakes, and **remembers the
   couple** (past Words, couple title, last 5 dish matchups → one natural
   callback per night, never repeating a past Word). Tie rule enforced
   deterministically: scores within 5 = nobody loses.
7. **The reveal** — the private question answers shown to each other for
   the first time, with emoji reactions (persisted to history). Soft
   romantic pads underneath.
8. **Winner** — verdict cards per dish, compatibility meter, couple
   title, future prediction, stakes honored (ties split them together),
   badges (1/3/7/15 nights).
9. **The Word** — cinematic solo reveal (tap to skip), spoken aloud,
   saved to the collection with date and theme.
10. **Result card** — 4 designed templates, downloadable/shareable.
    Profile grows: word collection, score history, memory wall,
    compatibility trend, "Your Story" keepsake card, start-fresh option.

## 5. Sound & voice

- **All audio is synthesized** — zero audio files. Effects (ticks, gong,
  twist whoosh, fanfare, Word chord swell) in `src/utils/sfx.js`;
  generative ambient music engine in `src/utils/ambient.js` with three
  layers per mood (pad / pulse / arpeggio), master compressor, echo send.
- **Voice**: browser TTS with smart voice selection (neural/enhanced
  tiers first), a user-facing **voice picker** with live preview,
  sentence-level prosody variation, and workarounds for two Chrome
  speech bugs (cancel-swallow, 15s stall). Privacy: secrets are never
  spoken aloud — by the reveal screen or by Chef.
- One mute button silences everything (voice + sfx + music), persisted.

## 6. Engineering

- **Stack**: React 19 + Vite 8, Tailwind 4, code-split screens
  (`React.lazy`), main bundle ~117KB gz.
- **AI**: Claude Opus 4.8 via official SDK; prompt caching on the chat
  assistant; vision judging via image blocks; three-tier reach (local
  key → `/api/claude` Vercel proxy → canned fallbacks). Proxy pins the
  model and caps sizes.
- **Persistence**: all localStorage — couple profile, session resume
  (phase + timer seconds), question rotation, dish history, voice/mute
  preferences. Photos compressed to ~80KB. No backend, no accounts.
- **Resilience**: error boundary with resume-aware recovery, tab-close
  guard, AI fallbacks at every call, PWA offline shell.
- **Quality**: 42 Vitest tests gating CI — scoring rules, badge
  milestones, ingredient theme/effort matching, question
  rotation/gating/bias, night-signal classification, and a **content
  guard** that fails the build if pork/alcohol ever appears in data or
  prompts (hard rule: globally inclusive content).
- **Hidden demo mode**: `window.__COOK_FAST__ = true` in the console
  runs the clock at 60×.

## 7. The build history (one session-family, ~30 commits)

PRD scaffold → premium candlelit redesign → code splitting → judge
verdict surfacing → session resume → generative music v1→v3 → error
boundary/PWA/meta → tests + CI gating → photo compression → Vercel
proxy + vision judging → question rotation → theme-matched ingredients →
GitHub publish + Pages deploy + root redirect → mobile fixes (secret
privacy leak, voice quality, end-of-game speech glitch) → voice picker →
play-again flow, time-aware Chef, stakes, judge memory → **the
Conductor**.

## 8. What remains (and who holds the key)

| Item | Blocker |
|---|---|
| Real AI on the live site (incl. vision + judge memory + night-tone judging) | **You**: import repo at vercel.com/new, add `ANTHROPIC_API_KEY` env var (~3 min) |
| Real-couple playtest | **You**: two humans, one kitchen — validates pacing, pass-the-phone, the Together Moment, subtlety |
| Phone regression pass | **You**: play a full round on your phone, report anything off |
| Living collection (past Words resurfacing between nights) | Design pass — needs a "return visit" surface; deliberately deferred |
| Two-device realtime mode | Supabase backend — only after real-couple evidence |
| Neural TTS (ElevenLabs-grade voice) | Needs a paid TTS account; wires through the existing proxy pattern |
| i18n | Full string refactor — own project |

## 9. Honest assessment

**8.5/10 as a product-in-waiting.** The concept is original, the
craft ceiling is high, the conductor architecture is something no quiz
app or party game has, and every machine-testable path is tested. The
remaining distance to 10 is not code: it's one Vercel login, one real
couple, and the iteration their feedback forces. The weakest parts are
exactly the parts that require time and users — which is where every
real product is at week one.
