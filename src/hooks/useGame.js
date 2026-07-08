import { useState, useCallback, useEffect, useRef } from "react";

const SAVE_KEY = "cook_together_session";

const initialGameState = {
  p1Name: "",
  p2Name: "",
  isReturning: false,
  gamesPlayed: 0,

  checkIn: {
    p1Day: "",
    p1Excited: "",
    p2Day: "",
    p2Excited: "",
    craving: [],
    vibe: "",
    p1Skill: 3,
    p2Skill: 3,
    relationshipLength: "",
    celebration: "",
    combinedDay: "",
  },

  aiContext: {
    theme: "",
    judgePersonality: "",
    judgeReason: "",
    musicMood: "chill",
    questionTone: "mix",
    difficultyLevel: "medium",
    openingMessage: "",
    cookingTip: "",
  },

  secret1: null,
  secret2: null,
  swapped1: false,
  swapped2: false,

  twist: null,
  questionsAnswered: [],
  memories: [],

  dish1Name: "",
  dish1Description: "",
  dish1Photo: null,
  usedSecret1: true,
  dish2Name: "",
  dish2Description: "",
  dish2Photo: null,
  usedSecret2: true,

  judgment: {
    p1Reaction: "",
    p2Reaction: "",
    p1Score: 0,
    p2Score: 0,
    winner: "",
    winnerReason: "",
    coupleTitle: "",
    compatibilityScore: 0,
    compatibilityReason: "",
    futurePrediction: "",
    secretIngredientComment: "",
    theWord: "",
  },

  p1TotalPoints: 0,
  p2TotalPoints: 0,
  newBadges: [],
};

// Trim photo/audio data URLs out of the saved session — they balloon
// localStorage and aren't critical to resume. Names, scores, and answered
// questions are what users care about getting back.
const sanitizeForSave = (state) => ({
  ...state,
  dish1Photo: null,
  dish2Photo: null,
  memories: (state.memories || []).map((m) => ({
    ...m,
    photo: m.photo ? "[trimmed]" : m.photo,
    audio: m.audio ? "[trimmed]" : m.audio,
  })),
});

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const useGame = () => {
  const [gameState, setGameState] = useState(initialGameState);
  // Skip persisting the very first frame to avoid wiping a stale resume slot
  // until the user has actually engaged.
  const hasInteractedRef = useRef(false);

  const updateGame = useCallback((updates) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateCheckIn = useCallback((updates) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({
      ...prev,
      checkIn: { ...prev.checkIn, ...updates },
    }));
  }, []);

  const updateAIContext = useCallback((context) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({ ...prev, aiContext: { ...prev.aiContext, ...context } }));
  }, []);

  const updateJudgment = useCallback((judgment) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({ ...prev, judgment: { ...prev.judgment, ...judgment } }));
  }, []);

  // Accepts either a photo (data URL string from the camera) or a richer
  // object (e.g. { audio, durationMs } from the voice recorder).
  const addMemory = useCallback((capture) => {
    hasInteractedRef.current = true;
    setGameState((prev) => {
      const base = { timestamp: Date.now(), points: 10 };
      const memory =
        typeof capture === "string"
          ? { ...base, photo: capture }
          : { ...base, ...capture };
      return { ...prev, memories: [...prev.memories, memory] };
    });
  }, []);

  const addQuestionAnswer = useCallback((question, p1Answer, p2Answer) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({
      ...prev,
      questionsAnswered: [
        ...prev.questionsAnswered,
        { question, p1Answer, p2Answer, date: new Date().toISOString() },
      ],
    }));
  }, []);

  // Record an emoji reaction given during the reveal, so it persists to the
  // profile with the answers instead of vanishing when the screen unmounts.
  // `who` is "p1" or "p2" — whose answer was reacted to.
  const addReaction = useCallback((questionIdx, who, emoji) => {
    hasInteractedRef.current = true;
    setGameState((prev) => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered.map((entry, i) =>
        i === questionIdx
          ? { ...entry, reactions: { ...entry.reactions, [who]: emoji } }
          : entry
      ),
    }));
  }, []);

  const resetGame = useCallback(() => {
    hasInteractedRef.current = false;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    setGameState((prev) => ({
      ...initialGameState,
      p1Name: prev.p1Name,
      p2Name: prev.p2Name,
      isReturning: true,
      gamesPlayed: prev.gamesPlayed,
    }));
  }, []);

  // Persist to localStorage so a refresh can resume mid-session.
  useEffect(() => {
    if (!hasInteractedRef.current) return;
    try {
      const trimmed = sanitizeForSave(gameState);
      localStorage.setItem(SAVE_KEY, JSON.stringify(trimmed));
    } catch {
      /* localStorage might be full — non-fatal */
    }
  }, [gameState]);

  return {
    gameState,
    updateGame,
    updateCheckIn,
    updateAIContext,
    updateJudgment,
    addMemory,
    addQuestionAnswer,
    addReaction,
    resetGame,
    setGameState,
  };
};

// Exposed for App to check if there's a recoverable session at startup.
export const getSavedSession = () => loadSaved();
export const clearSavedSession = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
};
