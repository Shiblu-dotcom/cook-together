export const BADGES = [
  {
    id: "first_flame",
    emoji: "🍳",
    name: "First Flame",
    description: "Completed your first challenge together",
    gamesRequired: 1,
  },
  {
    id: "hat_trick",
    emoji: "🔥",
    name: "Hat Trick",
    description: "3 challenges down. You're a real team.",
    gamesRequired: 3,
  },
  {
    id: "lucky_seven",
    emoji: "⭐",
    name: "Lucky Seven",
    description: "7 nights of beautiful chaos.",
    gamesRequired: 7,
  },
  {
    id: "kitchen_royalty",
    emoji: "👑",
    name: "Kitchen Royalty",
    description: "15 challenges. This kitchen is yours.",
    gamesRequired: 15,
  },
];

export const getNewBadges = (gamesPlayed, existingBadgeIds) => {
  return BADGES.filter(
    (b) => b.gamesRequired <= gamesPlayed && !existingBadgeIds.includes(b.id)
  );
};
