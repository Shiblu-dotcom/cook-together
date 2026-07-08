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
      compatibilityHistory: [
        ...profile.compatibilityHistory,
        gameResult.compatibilityScore || 0,
      ],
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

    saveProfile(updated);
    return updated;
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return { getProfile, saveProfile, createProfile, updateProfileAfterGame, clearProfile };
};
