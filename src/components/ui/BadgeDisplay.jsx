export default function BadgeDisplay({ badges, newBadges = [], size = "md" }) {
  const sizes = { sm: { emoji: 20, pad: "8px 14px" }, md: { emoji: 28, pad: "12px 20px" } };
  const s = sizes[size] || sizes.md;

  return (
    <ul
      role="list"
      aria-label="Earned badges"
      style={{ display: "flex", flexWrap: "wrap", gap: 10, listStyle: "none", padding: 0, margin: 0 }}
    >
      {badges.map((badge) => {
        const isNew = newBadges.some((b) => b.id === badge.id);
        return (
          <li
            key={badge.id}
            className={isNew ? "animate-badge-reveal" : ""}
            title={badge.description}
            aria-label={`${badge.name}${isNew ? " (new)" : ""}: ${badge.description}`}
            style={{
              background: isNew ? "rgba(245,207,93,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isNew ? "var(--accent-gold)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 100,
              padding: s.pad,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "default",
            }}
          >
            <span style={{ fontSize: s.emoji }} aria-hidden="true">{badge.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isNew ? "var(--accent-gold)" : "var(--text-primary)" }}>
                {badge.name}
                {isNew && (
                  <span style={{ marginLeft: 6, fontSize: 10, color: "var(--accent-gold)", fontWeight: 700 }}>
                    NEW
                  </span>
                )}
              </div>
              {size === "md" && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{badge.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
