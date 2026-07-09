import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import VoiceInput from "../ui/VoiceInput";

const CRAVINGS = [
  { label: "Spicy", emoji: "🌶️" },
  { label: "Comfort", emoji: "🍲" },
  { label: "Fresh", emoji: "🥗" },
  { label: "Sweet", emoji: "🍫" },
  { label: "Savory", emoji: "🧀" },
  { label: "Adventurous", emoji: "🌍" },
];

const VIBES = [
  { label: "Romantic", emoji: "🕯️" },
  { label: "Playful", emoji: "🎉" },
  { label: "Competitive", emoji: "⚔️" },
  { label: "Chill", emoji: "😌" },
  { label: "Chaotic", emoji: "🌪️" },
];

const RELATIONSHIP_LENGTHS = [
  { label: "New", emoji: "✨" },
  { label: "A few months", emoji: "🌱" },
  { label: "1+ year", emoji: "🌳" },
  { label: "Forever", emoji: "👴👵" },
];

const SKILL_LABELS = [
  "1 — What's a stove?",
  "2 — Getting there",
  "3 — I manage",
  "4 — Pretty solid",
  "5 — Gordon who?",
];

const VALENCE_LABELS = ["Rough 😮‍💨", "Meh", "Okay", "Good", "Great 😄"];
const ENERGY_LABELS = ["Running on empty 🪫", "Low", "Okay", "Charged", "Fully wired 🔋"];

export default function CheckIn({ p1Name, p2Name, isReturning, onComplete }) {
  // New users now go through 2 screens:
  //   0 = the essentials (vibe, cravings, relationship length, skill sliders)
  //   1 = optional personal share for AI personalization
  // Returning users still get 2 light screens.
  const [screen, setScreen] = useState(0);
  const [data, setData] = useState({
    p1Day: "",
    p1Excited: "",
    p2Day: "",
    p2Excited: "",
    craving: [],
    vibe: "",
    p1Skill: 3,
    p2Skill: 3,
    relationshipLength: "",
    // First/second date, a new person, friends — deep features off, warmth up.
    newPair: false,
    celebration: "",
    combinedDay: "",
    // The night signal — valence (how the day went) and energy (what's left
    // in the tank), per person. These quietly conduct the whole night.
    p1Valence: 3,
    p1Energy: 3,
    p2Valence: 3,
    p2Energy: 3,
  });

  const set = (key, val) => setData((d) => ({ ...d, [key]: val }));
  const toggleCraving = (c) => {
    setData((d) => ({
      ...d,
      craving: d.craving.includes(c) ? d.craving.filter((x) => x !== c) : [...d.craving, c],
    }));
  };

  const totalScreens = 2;

  const canProceed = () => {
    if (screen === 0) {
      if (isReturning || data.newPair) return data.craving.length > 0 && data.vibe;
      return data.craving.length > 0 && data.vibe && data.relationshipLength;
    }
    return true;
  };

  const submit = () => onComplete(data);

  const handleNext = () => {
    if (screen < totalScreens - 1) setScreen((s) => s + 1);
    else submit();
  };

  const progressPct = ((screen + 1) / totalScreens) * 100;

  const renderEssentials = () => (
    <>
      <h2 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>
        {isReturning ? "Welcome back" : "Set the scene"}
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 28, lineHeight: 1.5 }}>
        {isReturning
          ? "Quick taste check before we get cooking."
          : "Pick a vibe and a craving — this shapes everything tonight."}
      </p>

      <Section label="What are you both craving?">
        <ChipGroup items={CRAVINGS} selected={data.craving} onToggle={toggleCraving} multi />
      </Section>

      <Section label="Tonight's vibe?">
        <ChipGroup items={VIBES} selected={[data.vibe]} onToggle={(v) => set("vibe", v)} />
      </Section>

      {/* Tonight's company — available every night (a returning profile can
          still host a friend-night). "Still new" quietly turns the deep
          features off and the warmth up. No relationship framing after this. */}
      <Section label="Tonight we're…">
        <ChipGroup
          items={[
            { label: "Us, as usual", emoji: "🍳" },
            { label: "Still new to each other", emoji: "🌱" },
          ]}
          selected={[data.newPair ? "Still new to each other 🌱" : "Us, as usual 🍳"]}
          onToggle={(v) => set("newPair", v.startsWith("Still new"))}
        />
      </Section>

      {!isReturning && (
        <>
          {!data.newPair && (
            <Section label="How long have you been together?">
              <ChipGroup
                items={RELATIONSHIP_LENGTHS}
                selected={[data.relationshipLength]}
                onToggle={(v) => set("relationshipLength", v)}
              />
            </Section>
          )}

          <Section label={`${p1Name}'s cooking skill`}>
            <SliderInput
              value={data.p1Skill}
              onChange={(v) => set("p1Skill", v)}
              labels={SKILL_LABELS}
            />
          </Section>

          <Section label={`${p2Name}'s cooking skill`}>
            <SliderInput
              value={data.p2Skill}
              onChange={(v) => set("p2Skill", v)}
              labels={SKILL_LABELS}
            />
          </Section>
        </>
      )}

      {isReturning && (
        <Section
          label="Anything worth celebrating since last time? (optional)"
          mic={<VoiceInput value={data.celebration} onChange={(v) => set("celebration", v)} compact />}
        >
          <input
            className="input-field"
            placeholder="A win, a milestone, anything..."
            value={data.celebration}
            onChange={(e) => set("celebration", e.target.value)}
          />
        </Section>
      )}
    </>
  );

  const renderPersonal = () => {
    if (isReturning) {
      return (
        <>
          <h2 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>
            How was today? (optional)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Twenty seconds — it quietly shapes the whole night.
          </p>

          <MoodSliders
            name={p1Name}
            valence={data.p1Valence}
            energy={data.p1Energy}
            onValence={(v) => set("p1Valence", v)}
            onEnergy={(v) => set("p1Energy", v)}
          />
          <MoodSliders
            name={p2Name}
            valence={data.p2Valence}
            energy={data.p2Energy}
            onValence={(v) => set("p2Valence", v)}
            onEnergy={(v) => set("p2Energy", v)}
          />

          <Section
            label="Anything to add? (optional)"
            mic={<VoiceInput value={data.combinedDay} onChange={(v) => set("combinedDay", v)} compact />}
          >
            <textarea
              className="input-field"
              rows={2}
              placeholder="The highlights, the rough patches, anything..."
              value={data.combinedDay}
              onChange={(e) => set("combinedDay", e.target.value)}
              style={{ resize: "none" }}
            />
          </Section>
        </>
      );
    }

    return (
      <>
        <h2 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>
          Share a little? (optional)
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          The more you share, the more personalized the night gets. Or skip — we'll improvise.
        </p>

        <div
          style={{
            background: "rgba(245,207,93,0.06)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: "10px 16px",
            marginBottom: 20,
            fontSize: 12,
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          🤫 Take turns — each person types privately while the other looks away.
        </div>

        <MoodSliders
          name={p1Name}
          valence={data.p1Valence}
          energy={data.p1Energy}
          onValence={(v) => set("p1Valence", v)}
          onEnergy={(v) => set("p1Energy", v)}
        />

        <Section
          label={`${p1Name} — how was your day?`}
          mic={<VoiceInput value={data.p1Day} onChange={(v) => set("p1Day", v)} compact />}
        >
          <textarea
            className="input-field"
            rows={2}
            placeholder="Highlights, lowlights, anything..."
            value={data.p1Day}
            onChange={(e) => set("p1Day", e.target.value)}
            style={{ resize: "none" }}
          />
        </Section>

        <Section
          label={`${p1Name} — one thing you're excited about?`}
          mic={<VoiceInput value={data.p1Excited} onChange={(v) => set("p1Excited", v)} compact />}
        >
          <input
            className="input-field"
            placeholder="Big or small, anything counts"
            value={data.p1Excited}
            onChange={(e) => set("p1Excited", e.target.value)}
          />
        </Section>

        <div
          style={{
            height: 1,
            background: "var(--border-subtle)",
            margin: "20px 0 24px",
          }}
        />

        <MoodSliders
          name={p2Name}
          valence={data.p2Valence}
          energy={data.p2Energy}
          onValence={(v) => set("p2Valence", v)}
          onEnergy={(v) => set("p2Energy", v)}
        />

        <Section
          label={`${p2Name} — how was your day?`}
          mic={<VoiceInput value={data.p2Day} onChange={(v) => set("p2Day", v)} compact />}
        >
          <textarea
            className="input-field"
            rows={2}
            placeholder="Be honest — this stays private to you for now"
            value={data.p2Day}
            onChange={(e) => set("p2Day", e.target.value)}
            style={{ resize: "none" }}
          />
        </Section>

        <Section
          label={`${p2Name} — one thing you're excited about?`}
          mic={<VoiceInput value={data.p2Excited} onChange={(v) => set("p2Excited", v)} compact />}
        >
          <input
            className="input-field"
            placeholder="What's got you going lately?"
            value={data.p2Excited}
            onChange={(e) => set("p2Excited", e.target.value)}
          />
        </Section>
      </>
    );
  };

  return (
    <div className="screen bg-mesh" style={{ paddingTop: 56 }}>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          zIndex: 20,
          background: "rgba(13,13,13,0.9)",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          {screen > 0 && (
            <button
              onClick={() => setScreen((s) => s - 1)}
              aria-label="Previous step"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          )}
          <span className="label" style={{ flex: 1 }}>
            Before the cooking — {screen + 1} of {totalScreens}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 440, padding: "0 4px" }} className="animate-fade-in-up">
        <div key={screen} className="animate-step-in">
          {screen === 0 ? renderEssentials() : renderPersonal()}
        </div>

        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!canProceed()}
          aria-disabled={!canProceed()}
          style={{ marginTop: 12 }}
        >
          {screen < totalScreens - 1 ? "Keep going →" : "Start the night"}
        </button>

        {screen === totalScreens - 1 && (
          <button
            className="btn-ghost"
            onClick={submit}
            style={{ marginTop: 12, width: "100%" }}
          >
            Skip — just cook
          </button>
        )}
      </div>
    </div>
  );
}

// The two-slider mood capture — the birth of the night signal. Compact on
// purpose: two drags, done.
function MoodSliders({ name, valence, energy, onValence, onEnergy }) {
  return (
    <div className="card-sm" style={{ marginBottom: 20, padding: "16px 18px" }}>
      <div className="label" style={{ marginBottom: 12, color: "var(--accent-gold)" }}>
        {name} — quick pulse
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
          How was the day?
        </div>
        <SliderInput value={valence} onChange={onValence} labels={VALENCE_LABELS} />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
          Energy left?
        </div>
        <SliderInput value={energy} onChange={onEnergy} labels={ENERGY_LABELS} />
      </div>
    </div>
  );
}

function Section({ label, mic, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <label className="label" style={{ fontSize: 12, flex: 1 }}>
          {label}
        </label>
        {mic}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ items, selected, onToggle, multi = false }) {
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      role={multi ? "group" : "radiogroup"}
    >
      {items.map((item) => {
        const val = `${item.label} ${item.emoji}`;
        const isSelected = selected.includes(val);
        return (
          <button
            key={item.label}
            className={`chip ${isSelected ? "selected" : ""}`}
            onClick={() => onToggle(val)}
            role={multi ? "checkbox" : "radio"}
            aria-checked={isSelected}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({ value, onChange, labels }) {
  return (
    <div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={labels[value - 1]}
        style={{ width: "100%", accentColor: "var(--accent-gold)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>1</span>
        <span
          style={{
            fontSize: 13,
            color: "var(--accent-gold)",
            fontWeight: 600,
            textAlign: "center",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          {labels[value - 1]}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>5</span>
      </div>
    </div>
  );
}
