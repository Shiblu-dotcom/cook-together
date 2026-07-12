import { useState } from "react";
import { Download, Share2, Edit2, Check } from "lucide-react";
import { downloadCard, shareCard } from "../../utils/shareCard";
import Mark from "../ui/Mark";

const TEMPLATES = [
  {
    id: "dark_moody",
    label: "Dark & Moody",
    bg: "#141019",
    textColor: "#ffe066",
    accentColor: "#ff9800",
    border: "1px solid rgba(245,207,93,0.2)",
  },
  {
    id: "warm_soft",
    label: "Warm & Soft",
    bg: "#20140B",
    textColor: "#f5c97a",
    accentColor: "#e8855a",
    border: "1px solid rgba(245,201,122,0.3)",
  },
  {
    id: "bold_loud",
    label: "Bold & Loud",
    bg: "#12122A",
    textColor: "#ffffff",
    accentColor: "#ffe066",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    bg: "#120A18",
    textColor: "#e8d5b7",
    accentColor: "#c8a96e",
    border: "1px solid rgba(200,169,110,0.2)",
  },
];

export default function ResultCard({ p1Name, p2Name, judgment, theme, plateName, mode = "win", memories, onPlayAgain }) {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [caption, setCaption] = useState("");
  const [editingCaption, setEditingCaption] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const tpl = TEMPLATES[templateIdx];
  const safeJudgment = judgment || {};
  const {
    theWord = "TONIGHT",
    coupleTitle = "Worth Watching",
    plateScore = 0,
    winner = "tie",
  } = safeJudgment;
  const heroMemory = memories && memories.length > 0 ? memories[0].photo : null;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setActionError(null);
    try {
      await downloadCard("result-card", `cook-together-${(theWord || "card").toLowerCase()}.png`);
    } catch (err) {
      console.error(err);
      setActionError("Couldn't download the card. Try again?");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setActionError(null);
    try {
      await shareCard("result-card", `Cook Together — ${theWord}`);
    } catch (err) {
      console.error(err);
      setActionError("Couldn't share. Try downloading instead?");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="screen bg-deep" style={{ paddingTop: 32, paddingBottom: 40, alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 20px" }}>
        <h2 className="font-display" style={{ fontSize: 24, textAlign: "center", marginBottom: 8 }}>
          Tonight, on one card
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          Download it, share it, treasure it.
        </p>

        {/* The card */}
        <div
          id="result-card"
          style={{
            background: tpl.bg,
            border: tpl.border,
            borderRadius: 24,
            padding: "32px 28px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Texture overlay for cinematic */}
          {tpl.id === "cinematic" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
                opacity: 0.3,
                pointerEvents: "none",
              }}
            />
          )}

          {/* The mark + date — small, like a maker's stamp */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, position: "relative" }}>
            <Mark variant="plate" size={30} color={tpl.accentColor} />
            <span style={{ fontSize: 11, color: tpl.textColor, opacity: 0.55 }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Names — small caps over the hero */}
          <p style={{ fontSize: 12, color: tpl.textColor, opacity: 0.7, marginBottom: 10, letterSpacing: "0.14em", textTransform: "uppercase", position: "relative" }}>
            {p1Name} &amp; {p2Name}
          </p>

          {/* The Word IS the poster */}
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(56px, 19vw, 76px)",
              fontWeight: 600,
              color: tpl.accentColor,
              letterSpacing: "-0.02em",
              marginBottom: 14,
              lineHeight: 0.98,
              position: "relative",
              overflowWrap: "anywhere",
            }}
          >
            {theWord}
          </h1>

          {/* Couple title */}
          <p className="font-display" style={{ fontSize: 15, color: tpl.textColor, opacity: 0.85, marginBottom: 24, fontStyle: "italic", position: "relative" }}>
            {coupleTitle}
          </p>

          {/* One hand-ruled line, then one quiet line of facts — no boxes */}
          <div style={{ width: 44, height: 3, background: tpl.accentColor, borderRadius: 2, marginBottom: 14, position: "relative" }} />
          <p style={{ fontSize: 12.5, color: tpl.textColor, opacity: 0.7, marginBottom: 4, position: "relative" }}>
            {plateName ? `"${plateName}"` : ""}
          </p>

          {/* Memory photo */}
          {heroMemory && (
            <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", position: "relative" }}>
              <img
                src={heroMemory}
                alt={`A memory from ${p1Name} and ${p2Name}'s night`}
                style={{ width: "100%", height: 160, objectFit: "cover" }}
              />
            </div>
          )}

          {/* One quiet line of facts — a poster credit, not a receipt.
              Fun nights carry no score and no winner, just the night. */}
          <p style={{ fontSize: 12.5, color: tpl.textColor, opacity: 0.6, marginBottom: caption ? 14 : 0, position: "relative" }}>
            {mode === "win"
              ? `${plateScore}/100 · ${winner === "tie" ? "a tie" : `${winner}'s night`} · ${theme}`
              : `made together · ${theme}`}
          </p>

          {/* Caption */}
          {caption && (
            <p style={{ fontSize: 13, color: tpl.textColor, opacity: 0.65, fontStyle: "italic", position: "relative" }}>
              "{caption}"
            </p>
          )}

          <p style={{ fontSize: 11, color: tpl.textColor, opacity: 0.4, marginTop: 20, fontFamily: "'Fraunces', serif", fontStyle: "italic", position: "relative" }}>
            Cook Together, Stay Together
          </p>
        </div>

        {/* Template picker */}
        <div
          role="radiogroup"
          aria-label="Card style"
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
        >
          {TEMPLATES.map((t, i) => {
            const isSel = templateIdx === i;
            return (
              <button
                key={t.id}
                onClick={() => setTemplateIdx(i)}
                role="radio"
                aria-checked={isSel}
                style={{
                  whiteSpace: "nowrap",
                  background: t.bg,
                  border: `2px solid ${isSel ? "var(--accent-gold)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12,
                  color: isSel ? "var(--accent-gold)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "border-color 0.15s ease, color 0.15s ease",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Caption editor */}
        <div style={{ marginBottom: 20 }}>
          {editingCaption ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input-field"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={100}
              />
              <button
                onClick={() => setEditingCaption(false)}
                style={{
                  background: "rgba(245,207,93,0.1)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "0 14px",
                  cursor: "pointer",
                  color: "var(--accent-gold)",
                }}
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => setEditingCaption(true)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Edit2 size={14} /> {caption ? "Edit caption" : "Add caption"}
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button
            className="btn-secondary"
            onClick={handleDownload}
            disabled={downloading}
            aria-busy={downloading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Download size={16} aria-hidden="true" /> <span style={{ whiteSpace: "nowrap" }}>{downloading ? "Saving…" : "Save it"}</span>
          </button>
          <button
            className="btn-primary"
            onClick={handleShare}
            disabled={sharing}
            aria-busy={sharing}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Share2 size={16} aria-hidden="true" /> <span style={{ whiteSpace: "nowrap" }}>{sharing ? "Sharing…" : "Share →"}</span>
          </button>
        </div>

        {actionError && (
          <p
            role="alert"
            style={{ fontSize: 13, color: "var(--accent-red)", marginBottom: 16, textAlign: "center" }}
          >
            {actionError}
          </p>
        )}

        <button className="btn-ghost" onClick={onPlayAgain} style={{ width: "100%", marginTop: 8 }}>
          Another night ↩
        </button>
      </div>
    </div>
  );
}
