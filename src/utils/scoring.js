export const calculateScore = (playerData) => {
  if (!playerData.usedSecretIngredient) return 0;

  let score = 0;
  score += playerData.aiCreativityScore || 0;
  score += 20; // used secret ingredient
  score += Math.min((playerData.memoriesTaken || 0) * 10, 50);
  if (playerData.swappedIngredient) score -= 10;
  score += playerData.aiEffortScore || 0;

  return Math.min(Math.max(score, 0), 100);
};

export const resolveWinner = (p1Score, p2Score, p1Name, p2Name) => {
  if (Math.abs(p1Score - p2Score) <= 5) {
    return {
      winner: "tie",
      p1Points: Math.round(p1Score / 2),
      p2Points: Math.round(p2Score / 2),
    };
  }
  if (p1Score > p2Score) {
    return { winner: p1Name, p1Points: p1Score, p2Points: p2Score };
  }
  return { winner: p2Name, p1Points: p1Score, p2Points: p2Score };
};
