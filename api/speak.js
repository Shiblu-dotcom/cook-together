// Vercel serverless function — neural TTS via ElevenLabs, so the judge has a
// real voice instead of browser speech synthesis. The key lives server-side
// (ELEVENLABS_API_KEY); the client only ever sends short text. Two characters:
//   "judge"   — the show judge (also voices Chef): warm, theatrical, sure
//   "witness" — the calm night's witness: gentler, slower, softer
// Voice IDs are overridable via env; defaults are ElevenLabs premade voices.
const ALLOWED_ORIGINS = new Set([
  "https://shiblu-dotcom.github.io",
  "http://localhost:5173",
  "http://localhost:5174",
]);

const VOICES = {
  judge: process.env.JUDGE_VOICE_ID || "onwK4e9ZLuTAKqWW03F9",   // "Daniel" — warm, deliberate
  witness: process.env.WITNESS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", // "Sarah" — soft, gentle
};

const MAX_TEXT = 700;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
  }
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(503).json({ error: "ELEVENLABS_API_KEY is not configured" });
    return;
  }

  const { text, voice } = req.body || {};
  if (!text || typeof text !== "string") { res.status(400).json({ error: "text required" }); return; }
  const voiceId = VOICES[voice] || VOICES.judge;

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, MAX_TEXT),
        model_id: "eleven_turbo_v2_5",
        voice_settings:
          voice === "witness"
            ? { stability: 0.7, similarity_boost: 0.8, style: 0.15 } // gentle, even
            : { stability: 0.45, similarity_boost: 0.8, style: 0.45 }, // character, life
      }),
    });
    if (!r.ok) { res.status(502).json({ error: `tts upstream ${r.status}` }); return; }
    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("content-type", "audio/mpeg");
    // Same text always yields the same clip — let browsers/CDN cache it.
    res.setHeader("cache-control", "public, max-age=86400");
    res.status(200).send(audio);
  } catch {
    res.status(500).json({ error: "tts failure" });
  }
}
