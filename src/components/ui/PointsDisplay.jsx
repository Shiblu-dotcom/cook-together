export default function PointsDisplay({ p1Name, p2Name, p1Points, p2Points }) {
  const total = p1Points + p2Points || 1;
  const p1Pct = Math.round((p1Points / total) * 100);
  const p2Pct = 100 - p1Pct;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>{p1Name}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-gold)", fontFamily: "'Playfair Display', serif" }}>
            {p1Points}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>{p2Name}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-orange)", fontFamily: "'Playfair Display', serif" }}>
            {p2Points}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
        <div
          style={{
            width: `${p1Pct}%`,
            background: "linear-gradient(90deg, var(--accent-gold), #ffb300)",
            borderRadius: "4px 0 0 4px",
            transition: "width 1s ease",
          }}
        />
        <div
          style={{
            width: `${p2Pct}%`,
            background: "linear-gradient(90deg, #ff7043, var(--accent-orange))",
            borderRadius: "0 4px 4px 0",
            transition: "width 1s ease",
          }}
        />
      </div>
    </div>
  );
}
