// The judge's real voice. Routes the emotional moments (verdict, the Word,
// Chef replies, the calm witness) through the /api/speak neural proxy; the
// browser TTS in useVoice stays as the fallback tier, so nights without a
// key still speak — consistent with the three-tier AI fallback.
// Session-level cache: identical text never costs a second API call.

const audioCache = new Map(); // `${voice}::${text}` → object URL

const speakUrl = () => {
  if (import.meta.env.VITE_SPEAK_URL) return import.meta.env.VITE_SPEAK_URL;
  const proxy = import.meta.env.VITE_PROXY_URL;
  if (proxy) return proxy.replace(/\/api\/claude\/?$/, "/api/speak");
  return "/api/speak";
};

let current = null;

export const stopNeural = () => {
  if (current) {
    current.pause();
    current = null;
  }
};

/**
 * Speak `text` in a character voice ("judge" | "witness"). Resolves true if
 * neural audio played, false if unavailable — callers fall back to browser
 * TTS on false. Never throws.
 */
export const speakNeural = async (text, voice = "judge") => {
  try {
    if (!text) return false;
    const key = `${voice}::${text}`;
    let src = audioCache.get(key);
    if (!src) {
      const res = await fetch(speakUrl(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 700), voice }),
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      if (!blob.type.includes("audio")) return false;
      src = URL.createObjectURL(blob);
      audioCache.set(key, src);
    }
    stopNeural();
    const a = new Audio(src);
    current = a;
    await a.play();
    return true;
  } catch {
    return false;
  }
};
