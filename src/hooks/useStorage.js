const STORAGE_KEY = "cook_together_profile";

export const useStorage = () => {
  const getProfile = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const saveProfile = (profile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Storage failed:", e);
    }
  };

  const createProfile = (p1Name, p2Name) => {
    const profile = {
      coupleId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      p1Name,
      p2Name,
      createdAt: new Date().toISOString().split("T")[0],
      gamesPlayed: 0,
      totalP1Points: 0,
      totalP2Points: 0,
      badges: [],
      wordCollection: [],
      memories: [],
      questionAnswers: [],
      coupleTitle: "",
      compatibilityHistory: [],
      themes: [],
      displayMode: "words",
    };
    saveProfile(profile);
    return profile;
  };

  const updateProfileAfterGame = (gameResult) => {
    const profile = getProfile();
    if (!profile) return;

    const updated = {
      ...profile,
      gamesPlayed: profile.gamesPlayed + 1,
      totalP1Points: profile.totalP1Points + (gameResult.p1Points || 0),
      totalP2Points: profile.totalP2Points + (gameResult.p2Points || 0),
      coupleTitle: gameResult.coupleTitle || profile.coupleTitle,
      // Calm nights record no compatibility number — the app never turns a
      // hard night into data about the relationship.
      compatibilityHistory:
        typeof gameResult.compatibilityScore === "number" && gameResult.compatibilityScore > 0
          ? [...profile.compatibilityHistory, gameResult.compatibilityScore]
          : profile.compatibilityHistory,
      themes: [...profile.themes, gameResult.theme || ""].filter(Boolean),
      badges: [
        ...new Set([...profile.badges, ...(gameResult.newBadges || [])]),
      ],
    };

    if (gameResult.theWord) {
      updated.wordCollection = [
        ...profile.wordCollection,
        {
          word: gameResult.theWord,
          date: new Date().toISOString().split("T")[0],
          theme: gameResult.theme || "",
          ...(gameResult.calm ? { calm: true } : {}),
        },
      ];
    }

    if (gameResult.memories && gameResult.memories.length > 0) {
      updated.memories = [
        ...profile.memories,
        ...gameResult.memories.map((m) => ({
          ...m,
          date: new Date().toISOString().split("T")[0],
          theme: gameResult.theme || "",
        })),
      ].slice(-50); // keep last 50 photos
    }

    if (gameResult.questionAnswers) {
      updated.questionAnswers = [
        ...profile.questionAnswers,
        ...gameResult.questionAnswers,
      ].slice(-100);
    }

    // The first dish is remembered forever — dishHistory keeps only the last
    // twenty nights, but the margin note on the winner screen needs night one
    // no matter how long the couple keeps cooking.
    if (!profile.firstDish && (gameResult.dish1Name || gameResult.dish2Name)) {
      updated.firstDish = {
        name: gameResult.dish1Name || gameResult.dish2Name,
        date: new Date().toISOString().split("T")[0],
      };
    }

    // Dish history feeds the judge's memory — it lets night 10's judge say
    // "still chasing the high of The Golden Hour, I see."
    if (gameResult.dish1Name || gameResult.dish2Name) {
      updated.dishHistory = [
        ...(profile.dishHistory || []),
        {
          dish1: gameResult.dish1Name || "",
          dish2: gameResult.dish2Name || "",
          winner: gameResult.winner || "",
          theme: gameResult.theme || "",
          date: new Date().toISOString().split("T")[0],
        },
      ].slice(-20);
    }

    saveProfile(updated);
    return updated;
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { getProfile, saveProfile, createProfile, updateProfileAfterGame, clearProfile };
};
