// The handmade mark. Two hand-drawn strokeforms — a steaming plate and a
// small flame — drawn as slightly imperfect paths on purpose: the wobble is
// the signature. This is the one element in the app no generator would make
// the same way twice. Use it sparingly: welcome, the calm door, the keepsake.
export default function Mark({ variant = "plate", size = 48, color = "currentColor", style, className }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: color,
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style,
    className,
  };

  if (variant === "flame") {
    return (
      <svg {...common}>
        {/* A candle flame, one continuous slightly-lopsided stroke */}
        <path d="M24.6 9.8c3.4 5.3 6.8 8.7 6.5 13.6-.3 4.5-3.2 7.4-7 7.5-3.9.1-6.9-2.7-7.2-7-.3-4.8 3.9-8.4 7.7-14.1z" />
        {/* Inner lick of the flame, off-center */}
        <path d="M24.2 24.9c-1.4-1.6-1.5-3.4-.2-5.3" />
        {/* The candle body, hand-ruled so the sides aren't quite parallel */}
        <path d="M19.9 34.2l.5 6.1c2.4.5 4.8.5 7.2-.1l.4-6" />
      </svg>
    );
  }

  // Default: the plate — a shallow bowl with two curls of steam.
  return (
    <svg {...common}>
      {/* Rim line, drawn a hair off-level */}
      <path d="M6.1 27.9c12.5-1.4 25.4-1.3 35.8-.2" />
      {/* Bowl below the rim, asymmetric curve */}
      <path d="M9.4 28.1c.6 7.2 6.7 11.6 14.4 11.5 7.9-.1 14.2-4.6 14.6-11.6" />
      {/* Steam curl, left — leans a little */}
      <path d="M19.6 21.3c-.4-2.9 2.2-3.3 2-5.8-.2-1.9-1.7-2.4-1.5-4.5" />
      {/* Steam curl, right — shorter, different rhythm */}
      <path d="M28.4 21.1c-.2-2.5 1.9-3 1.8-5.2-.1-1.7-1.3-2.2-1.1-4" />
    </svg>
  );
}
