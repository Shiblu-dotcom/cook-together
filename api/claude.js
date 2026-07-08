// Vercel serverless function — proxies Claude API calls so the key lives in
// a server-side environment variable (ANTHROPIC_API_KEY on Vercel), never in
// the browser bundle. The client calls POST /api/claude with the same body
// shape it would send the Messages API; we pin the model and cap sizes so a
// public endpoint can't be abused to run arbitrary expensive requests.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8"; // pinned server-side — clients cannot override
const MAX_TOKENS_CAP = 1024;
const MAX_BODY_CHARS = 60_000; // generous for game prompts, hostile to abuse

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }

  const { messages, system, max_tokens, cache_control } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array required" });
    return;
  }
  if (JSON.stringify(req.body).length > MAX_BODY_CHARS) {
    res.status(413).json({ error: "request too large" });
    return;
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CAP),
      ...(system ? { system } : {}),
      ...(cache_control ? { cache_control } : {}),
      messages,
    });
    res.status(200).json(message);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "rate limited" });
    } else if (err instanceof Anthropic.APIError) {
      res.status(err.status || 502).json({ error: err.message });
    } else {
      res.status(500).json({ error: "proxy failure" });
    }
  }
}
