import Anthropic from "@anthropic-ai/sdk";
import { buildContextPrompt, buildJudgmentPrompt, buildWitnessPrompt, DIETARY_RULE } from "../utils/aiPrompts";
import { normalizeJudgmentForMode } from "../utils/mode";
import { getFallbackWord } from "../utils/wordGenerator";
import { getCalmWord, getCalmWitnessFallback } from "../data/calm";
import { THEMES } from "../data/themes";

const MODEL = "claude-opus-4-8";

// Two ways to reach Claude, tried in this order:
//   1. A client-side key (local dev convenience) — calls the API directly.
//   2. The /api/claude serverless proxy (production on Vercel) — the key
//      stays server-side and never ships in the bundle.
// If neither works (e.g. static GitHub Pages with no key), callers fall back
// to canned responses, so the game never breaks.
const CLIENT_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const HAS_CLIENT_KEY = !!CLIENT_KEY && CLIENT_KEY !== "your_anthropic_api_key_here";

const client = HAS_CLIENT_KEY
  ? new Anthropic({ apiKey: CLIENT_KEY, dangerouslyAllowBrowser: true })
  : null;

// Send one Messages request via whichever path is available. Returns the
// message object ({ content: [...] }) in the same shape either way.
const runMessage = async (body) => {
  if (client) {
    return client.messages.create({ model: MODEL, ...body });
  }
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Proxy error ${res.status}`);
  }
  return res.json();
};

const logApiError = (label, err) => {
  if (err instanceof Anthropic.AuthenticationError) {
    console.warn(`${label}: invalid or missing API key — check VITE_ANTHROPIC_API_KEY in .env`);
  } else if (err instanceof Anthropic.RateLimitError) {
    console.warn(`${label}: rate limited — falling back`);
  } else if (err instanceof Anthropic.APIError) {
    console.warn(`${label}: API error ${err.status} — falling back`, err.message);
  } else {
    console.warn(`${label}: failed — falling back`, err);
  }
};

// Extract and parse the JSON payload from a Messages response.
const parseJSONResponse = (response) => {
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
};

// One-shot JSON call. These prompts are unique per game night, so no cache
// breakpoints here — there is no reusable prefix to cache.
const callClaudeJSON = async (prompt) => {
  const response = await runMessage({
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return parseJSONResponse(response);
};

// Vision variant — image blocks first, then the text prompt, so the prompt's
// "photos attached above" phrasing matches what the model actually sees.
const callClaudeVisionJSON = async (prompt, imageBlocks) => {
  const response = await runMessage({
    max_tokens: 1024,
    messages: [
      { role: "user", content: [...imageBlocks, { type: "text", text: prompt }] },
    ],
  });
  return parseJSONResponse(response);
};

// Convert a canvas data URL (from the dish camera) into an Anthropic image
// content block. Returns null for anything that isn't a valid base64 data URL.
const dataUrlToImageBlock = (dataUrl) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
};

// Multi-turn chat for the cooking assistant. The system prompt and growing
// message history form a stable prefix, so top-level auto-caching gives cache
// reads on every follow-up turn once the conversation passes the model's
// minimum cacheable prefix.
const callClaudeChat = async (messages, systemPrompt) => {
  const response = await runMessage({
    max_tokens: 400,
    cache_control: { type: "ephemeral" },
    system: [{ type: "text", text: systemPrompt }],
    messages,
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
};

const getRandomTheme = () => {
  const t = THEMES[Math.floor(Math.random() * THEMES.length)];
  return t.name;
};

export const useAI = () => {
  const buildGameContext = async (gameState) => {
    try {
      const prompt = buildContextPrompt(gameState);
      const result = await callClaudeJSON(prompt);
      return {
        theme: result.theme || getRandomTheme(),
        judgePersonality: result.judgePersonality || "warm",
        judgeReason: result.judgeReason || "You seem like a lovely couple.",
        musicMood: result.musicMood || "chill",
        questionTone: result.questionTone || "mix",
        difficultyLevel: result.difficultyLevel || "medium",
        openingMessage: result.openingMessage || `Welcome, ${gameState.p1Name} & ${gameState.p2Name}! Tonight is going to be delicious.`,
        cookingTip: result.cookingTip || "Season as you go — taste early, taste often.",
      };
    } catch (err) {
      logApiError("AI context build", err);
      return {
        theme: getRandomTheme(),
        judgePersonality: "warm",
        judgeReason: "Tonight calls for warmth.",
        musicMood: gameState.checkIn.vibe === "Romantic 🕯️" ? "romantic" : "chill",
        questionTone: "mix",
        difficultyLevel: "medium",
        openingMessage: `Welcome, ${gameState.p1Name} & ${gameState.p2Name}! Let's make something unforgettable tonight.`,
        cookingTip: "Taste everything. Adjust as you go.",
      };
    }
  };

  const getJudgment = async (gameState) => {
    try {
      const prompt = buildJudgmentPrompt(gameState);
      // Attach the plate photo so the judge reacts to what it actually sees.
      const images = [gameState.platePhoto].map(dataUrlToImageBlock).filter(Boolean);
      const result = images.length
        ? await callClaudeVisionJSON(prompt, images)
        : await callClaudeJSON(prompt);

      // One plate, one score. The winner is whose fingerprint carried it —
      // the AI decides, but only real names (or "tie") are accepted.
      const plateScore = typeof result.plateScore === "number"
        ? Math.max(0, Math.min(100, Math.round(result.plateScore)))
        : 72;
      const winner = [gameState.p1Name, gameState.p2Name, "tie"].includes(result.winner)
        ? result.winner
        : "tie";

      return normalizeJudgmentForMode({
        p1Reaction: result.p1Reaction || `${gameState.p1Name}, your part held the plate together.`,
        p2Reaction: result.p2Reaction || `${gameState.p2Name}, your part gave it its voice.`,
        plateScore,
        winner,
        winnerReason: result.winnerReason ||
          (winner === "tie"
            ? "Neither part outshone the other — the plate carried itself."
            : "One fingerprint stood out tonight, just barely."),
        coupleTitle: result.coupleTitle || "The Adventurous Duo",
        // New pairs are never scored as a couple — no matter what the AI said.
        compatibilityScore: gameState.checkIn?.newPair
          ? 0
          : typeof result.compatibilityScore === "number" ? result.compatibilityScore : 85,
        compatibilityReason: gameState.checkIn?.newPair
          ? ""
          : result.compatibilityReason || "You work together like salt and pepper.",
        futurePrediction: result.futurePrediction || "You'll accidentally invent a new cuisine together.",
        secretIngredientComment: result.secretIngredientComment || "Bold choices were made in this kitchen.",
        theWord: result.theWord || getFallbackWord(),
      }, gameState.mode);
    } catch (err) {
      logApiError("AI judgment", err);
      // Score the plate honestly from what actually happened — secrets
      // worked in and memories taken — instead of hardcoded numbers.
      const base = 58;
      const plateScore = Math.min(100,
        base +
        (gameState.usedSecret1 ? 10 : 0) +
        (gameState.usedSecret2 ? 10 : 0) +
        Math.min(5, (gameState.memories || []).length) * 2
      );
      // Fingerprint fallback: if exactly one of them worked their secret in,
      // that part carried the plate. Otherwise, tie.
      const winner =
        gameState.usedSecret1 && !gameState.usedSecret2 ? gameState.p1Name
        : gameState.usedSecret2 && !gameState.usedSecret1 ? gameState.p2Name
        : "tie";

      return normalizeJudgmentForMode({
        p1Reaction: `${gameState.p1Name}, your part was made with real care. It showed on the plate.`,
        p2Reaction: `${gameState.p2Name}, your part brought the imagination tonight.`,
        plateScore,
        winner,
        winnerReason: winner === "tie"
          ? "Dead even — tonight, the plate wins."
          : "One secret ingredient made it home, and it made the difference.",
        coupleTitle: "The Beautifully Chaotic Duo",
        compatibilityScore: gameState.checkIn?.newPair ? 0 : 82,
        compatibilityReason: gameState.checkIn?.newPair ? "" : "You fill each other's gaps like the best ingredients do.",
        futurePrediction: "You'll open a pop-up restaurant by accident on a Tuesday.",
        secretIngredientComment: "The secret ingredients were handled with varying levels of confidence.",
        theWord: getFallbackWord(),
      }, gameState.mode);
    }
  };

  // ── Cooking-time chat assistant ──────────────────────────────────────────
  // Caller passes the running chat (array of { role: 'user'|'assistant',
  // content }) plus the live game context (theme, ingredients, names) so the
  // assistant can answer substitution and technique questions in context.
  const chatWithAssistant = async (messages, ctx = {}) => {
    const {
      p1Name = "Player 1",
      p2Name = "Player 2",
      theme = "any cuisine",
      secret1 = null,
      secret2 = null,
      minutesLeft = null,
      night = null,
    } = ctx;
    const coupleState = ctx.coupleState ?? night?.coupleState ?? null;

    // Chef's warmth follows the room — never explained, just felt.
    const toneLine =
      coupleState === "comfort" || coupleState === "divergent"
        ? "Tonight, be extra warm, patient, and proactive — offer help before they ask, keep the bar low, celebrate small wins. "
        : coupleState === "gentle"
        ? "Tonight, keep everything easy and low-effort — shortcuts are wisdom, not cheating. "
        : coupleState === "celebration"
        ? "Tonight they're riding high — bring banter, dares, and a little challenge. "
        : "";

    // The persona has a name (Chef) and a voice — warm, quick, never preachy.
    // We avoid emojis because the replies are also read aloud via TTS, where
    // emojis get read as their unicode names ("face with tears of joy") which
    // breaks the spell completely.
    const systemPrompt =
      `You are Chef — a warm, fast-talking cooking friend helping ` +
      `${p1Name} and ${p2Name} through a 15-minute couples cook-off. ` +
      `Tonight's theme: "${theme}". ` +
      (minutesLeft ? `About ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} left on the clock — factor that into your advice. ` : "") +
      toneLine +
      (secret1?.name ? `${p1Name}'s secret ingredient is ${secret1.name}. ` : "") +
      (secret2?.name ? `${p2Name}'s secret ingredient is ${secret2.name}. ` : "") +
      `\n\nStyle:\n` +
      `- Keep replies to 1-2 short sentences. Conversational, never a lecture.\n` +
      `- Use contractions. Sound like a friend in the kitchen, not a recipe book.\n` +
      `- Be practical: substitutions, timings, technique. Specific over generic.\n` +
      `- If they're stuck, suggest one concrete next move.\n` +
      `- No emojis, no markdown, no bullet lists — your replies are read aloud.\n` +
      `- CRITICAL: your replies are spoken out loud and BOTH partners hear them. ` +
      `NEVER say the name of either secret ingredient — always call it "your secret ingredient". ` +
      `If asked how to use it, give advice without naming it (e.g. "fold your secret in near the end").\n` +
      `- It's okay to be playful. The clock is ticking and they're having fun.\n` +
      `- ${DIETARY_RULE}`;

    try {
      const reply = await callClaudeChat(messages, systemPrompt);
      return reply;
    } catch (err) {
      logApiError("Chat assistant", err);
      // A friendly offline-style fallback so cooking doesn't stop.
      return (
        "Mic's working but I can't reach the kitchen brain right now. " +
        "Trust your gut — taste as you go, season in layers, and don't overcrowd the pan."
      );
    }
  };

  // The calm night's witness — notices, never judges. Falls back to warm
  // canned lines so a hard night is never left hanging on a failed request.
  const getWitness = async (gameState) => {
    try {
      const prompt = buildWitnessPrompt(gameState);
      const result = await callClaudeJSON(prompt);
      return {
        witness: result.witness || getCalmWitnessFallback(),
        theWord: result.theWord || getCalmWord(),
      };
    } catch (err) {
      logApiError("Calm witness", err);
      return { witness: getCalmWitnessFallback(), theWord: getCalmWord() };
    }
  };

  return { buildGameContext, getJudgment, chatWithAssistant, getWitness };
};
