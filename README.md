# Cook Together

> A 15-minute cook-off for two. Secret ingredients, surprise questions, and an AI judge who knows you.

Cook Together is a couples cooking game that runs in the browser. Each round, the app:

- Checks in with both of you (mood, cravings, vibe)
- Picks a theme and assigns each player a secret ingredient
- Starts a 15-minute timer with surprise questions and "twists" mid-cook
- Lets you submit your dishes (name, description, optional photo)
- Asks an AI judge (Claude) to score the dishes, react to each plate, name your couple title, and pick a "word" for the night
- Saves your results — badges, compatibility scores, word collection — to your profile so it builds up over time

Nice touches worth knowing about:

- **Sound is fully synthesized** — countdown ticks, the time's-up gong, the twist whoosh, the winner fanfare, and a generative ambient pad that follows the music mood, all via the Web Audio API. No audio files. One speaker button mutes everything.
- **Interrupted nights resume** — game state persists to `localStorage`; if the tab closes mid-cook, the Welcome screen offers "Resume where you left off" and the timer picks up close to where it stopped.
- **Content is inclusive by default** — no pork or alcohol in ingredients, themes, or any AI output (see `DIETARY_RULE` in `src/utils/aiPrompts.js`).
- **Demo mode** — run `window.__COOK_FAST__ = true` in the browser console to make the 15-minute clock tick at 60× for testing.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Configure the AI judge (optional but recommended)

The game uses [Anthropic's Claude](https://console.anthropic.com/) for personalised judging, themes, and the in-game cooking assistant. Without an API key the game still works — it just falls back to canned responses.

1. Get a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Copy `.env.example` to `.env`
3. Replace the placeholder with your real key

```env
VITE_ANTHROPIC_API_KEY=sk-ant-…
```

> ⚠️ The key is bundled into the client-side JavaScript. That's fine for local play, but **don't deploy this build publicly with a real key** — anyone could extract it from the bundle. For a public deployment, proxy the Claude calls through a small backend.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on the project |

## Tech

- React 19 + Vite 8, screens code-split with `React.lazy`
- Tailwind CSS 4 (CSS variables + utility classes)
- Lucide icons, html2canvas for share cards
- Web Audio API for all sound — effects (`src/utils/sfx.js`) and generative ambient music (`src/utils/ambient.js`)
- Claude Opus 4.8 via `@anthropic-ai/sdk` for AI personalisation, judging, and the live "Chef" assistant (with prompt caching on the chat)
- All state and history stored in `localStorage` — no backend required

## Project layout

```
src/
├── App.jsx               # Phase machine — orchestrates screens
├── components/
│   ├── screens/          # One component per game phase
│   └── ui/               # Reusable widgets (timer, chips, mic, etc.)
├── hooks/                # useGame, useAI, useStorage, useVoice, useCamera…
├── data/                 # Ingredient pools, themes, badges, questions, twists
├── utils/                # AI prompts, scoring, share-card rendering
└── styles/animations.css # All keyframe animations
```
