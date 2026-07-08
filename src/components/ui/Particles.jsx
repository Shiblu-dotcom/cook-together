import { useMemo } from "react";

const FOOD_EMOJIS = ["🍳", "🌶️", "🧄", "🍋", "🥑", "🍫", "🌿", "🍯", "🧀", "🥜"];

// Deterministic pseudo-random so we don't call Math.random() in render
// (React 19 hooks/purity lint flags impure calls during the render phase).
const rand = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const buildParticles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
    left: `${rand(i + 1) * 90 + 5}%`,
    top: `${rand(i + 2) * 80 + 5}%`,
    size: `${rand(i + 3) * 16 + 20}px`,
    duration: `${rand(i + 4) * 4 + 4}s`,
    delay: `${rand(i + 5) * 3}s`,
    opacity: rand(i + 6) * 0.25 + 0.08,
  }));

export default function Particles({ count = 12 }) {
  const particles = useMemo(() => buildParticles(count), [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            fontSize: p.size,
            opacity: p.opacity,
            animation: `floatSlow ${p.duration} ease-in-out ${p.delay} infinite`,
            userSelect: "none",
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
