import { useEffect, useMemo, useRef, useState } from "react";
import { ChefHat, Mic, MicOff, Send, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { useSpeechInput } from "../../hooks/useSpeechInput";
import { useVoice } from "../../hooks/useVoice";
import { speakNeural } from "../../utils/neuralVoice";
import { useAI } from "../../hooks/useAI";

/**
 * Floating "Ask Chef" assistant for the cooking screen.
 * Provides both text input and voice input; AI replies are read out via TTS
 * unless the user mutes them.
 *
 * Props:
 *   - ctx: { p1Name, p2Name, theme, secret1, secret2 } passed into Claude as system context
 */
export default function CookingAssistant({ ctx = {} }) {
  const [open, setOpen] = useState(false);
  const [userDraft, setUserDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey — I'm Chef, here if you need a quick tip or a substitution. " +
        "Ask me anything (tap the mic or type).",
    },
  ]);
  const listRef = useRef(null);

  const stt = useSpeechInput();
  const voice = useVoice();
  const { chatWithAssistant } = useAI();

  // Visible input value is derived rather than mirrored — keeps the render pure.
  // userDraft is what was committed (typed or previously dictated); the live
  // transcript shows on top until the user types or sends, at which point it's
  // folded back into userDraft.
  const draft = useMemo(() => {
    if (!stt.transcript) return userDraft;
    return userDraft
      ? `${userDraft} ${stt.transcript}`.trim()
      : stt.transcript;
  }, [stt.transcript, userDraft]);

  // Auto-scroll to newest message.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, busy]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Stop any speech when the assistant closes.
  useEffect(() => {
    if (!open) voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || busy) return;
    if (stt.listening) stt.stop();

    const userMsg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setUserDraft("");
    stt.reset();
    setBusy(true);

    try {
      const reply = await chatWithAssistant(
        nextMessages.map(({ role, content }) => ({ role, content })),
        ctx
      );
      const replyMsg = { role: "assistant", content: reply };
      setMessages((m) => [...m, replyMsg]);
      if (voice.supported && !voice.muted) {
        // Chef speaks in the judge's voice — one character all night.
        speakNeural(reply, "judge").then((ok) => { if (!ok) voice.speak(reply); });
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Lost my signal — try again in a sec." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(draft);
  };

  // When the user types manually, fold the transcript into userDraft so they
  // can edit the merged text instead of fighting the dictation overlay.
  const onInputChange = (e) => {
    if (stt.listening) stt.stop();
    setUserDraft(e.target.value);
    if (stt.transcript) stt.reset();
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Chef assistant" : "Ask Chef — your cooking assistant"}
        title="Ask Chef"
        style={{
          position: "fixed",
          // Sits ABOVE the voice-memo FAB (88–136px) with a 16px gap — these
          // three buttons stack in one corner and must never overlap, or
          // taps meant for one land on another.
          bottom: "max(152px, env(safe-area-inset-bottom, 0px) + 144px)",
          right: "max(20px, env(safe-area-inset-right, 0px) + 12px)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: open ? "var(--bg-card)" : "#E8703A",
          border: open ? "1px solid var(--border-subtle)" : "none",
          color: open ? "var(--accent-gold)" : "#0d0d0d",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: open ? "none" : "0 4px 20px rgba(245,207,93,0.3)",
          zIndex: 40,
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <ChefHat size={22} aria-hidden="true" />
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chef cooking assistant"
          style={{
            animation: "slideUp 0.45s var(--ease-out) backwards",
            position: "fixed",
            bottom: "max(216px, env(safe-area-inset-bottom, 0px) + 208px)",
            right: "max(20px, env(safe-area-inset-right, 0px) + 12px)",
            left: "max(20px, env(safe-area-inset-left, 0px) + 12px)",
            maxWidth: 400,
            marginLeft: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14,
            zIndex: 41,
            display: "flex",
            flexDirection: "column",
            maxHeight: "60vh",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <ChefHat size={18} color="var(--accent-gold)" aria-hidden="true" />
            <span className="label" style={{ flex: 1, color: "var(--accent-gold)" }}>
              Ask Chef
            </span>
            {voice.supported && (
              <button
                type="button"
                onClick={() => voice.setMuted(!voice.muted)}
                aria-label={voice.muted ? "Unmute voice replies" : "Mute voice replies"}
                title={voice.muted ? "Voice off" : "Voice on"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: voice.muted ? "var(--text-secondary)" : "var(--accent-gold)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {voice.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background:
                    m.role === "user"
                      ? "rgba(232,112,58,0.12)"
                      : "var(--bg-card-strong)",
                  border:
                    m.role === "user"
                      ? "1px solid rgba(232,112,58,0.35)"
                      : "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  padding: "8px 12px",
                  borderRadius: 10,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--text-secondary)",
                }}
                aria-live="polite"
              >
                <Loader2 size={14} className="spin" aria-hidden="true" />
                Chef is thinking…
              </div>
            )}
          </div>

          {/* Quick prompts — one tap beats typing with messy hands. Shown
              until the conversation actually starts. */}
          {messages.length <= 1 && !busy && (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "0 12px 10px",
                flexWrap: "wrap",
              }}
            >
              {[
                "What can I substitute?",
                "Quick plating idea?",
                "Help — it's going wrong",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="chip"
                  onClick={() => send(q)}
                  style={{ fontSize: 12, padding: "8px 14px" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {stt.supported && (
              <button
                type="button"
                onClick={stt.listening ? stt.stop : stt.start}
                aria-label={stt.listening ? "Stop dictation" : "Dictate"}
                title={stt.listening ? "Stop" : "Speak"}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: stt.listening ? "#e05c5c" : "var(--bg-card-strong)",
                  border: "1px solid var(--border-subtle)",
                  color: stt.listening ? "#0d0d0d" : "var(--accent-gold)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  animation: stt.listening ? "pulseRing 1.3s ease infinite" : "none",
                }}
              >
                {stt.listening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
              </button>
            )}
            <input
              className="input-field"
              placeholder={stt.listening ? "Listening…" : "Ask anything…"}
              value={draft}
              onChange={onInputChange}
              style={{ flex: 1, padding: "8px 12px", fontSize: 14 }}
              aria-label="Message to Chef"
              disabled={busy}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim() || busy}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: !draft.trim() || busy ? "rgba(255,255,255,0.05)" : "#E8703A",
                border: "none",
                color: !draft.trim() || busy ? "var(--text-secondary)" : "#0d0d0d",
                cursor: !draft.trim() || busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
