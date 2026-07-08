// The Together Moment — one forced-cooperation beat mid-cook. The rest of
// the night is friendly competition; this is the beat that turns "me vs you"
// into "us". Fires once, around the 9-minute mark, before the twist.
export const COOP_MOMENTS = [
  { id: "swap_stations", text: "🤝 TOGETHER: Swap stations and finish each other's current step!" },
  { id: "taste_trade", text: "🤝 TOGETHER: Feed each other one taste of your dish — no words, just eye contact." },
  { id: "guided_hands", text: "🤝 TOGETHER: One of you closes your eyes for 30 seconds — the other guides your hands." },
  { id: "ingredient_gift", text: "🤝 TOGETHER: Each of you gives the other one ingredient from your station. Use the gift." },
  { id: "shared_bite", text: "🤝 TOGETHER: Plate one bite of your dish on your partner's plate. It counts as theirs now." },
  { id: "one_pan_minute", text: "🤝 TOGETHER: For the next minute, you both cook in ONE pan. Figure it out." },
  { id: "compliment_stir", text: "🤝 TOGETHER: Stir each other's dish while saying one thing you love about how they cook." },
  { id: "four_hands", text: "🤝 TOGETHER: Four hands, one task — pick the fiddliest job left and do it together." },
];

export const getRandomCoopMoment = () => {
  return COOP_MOMENTS[Math.floor(Math.random() * COOP_MOMENTS.length)];
};
