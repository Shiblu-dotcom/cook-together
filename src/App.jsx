import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { sfxChime } from "./utils/sfx";
import { computeNightSignal, formatForNight } from "./utils/nightSignal";
import { getCalmTheme } from "./data/calm";
import { cookSecondsForDish } from "./data/dishes";
import { getQuestionsForTone } from "./data/questions";
import QuestionCard from "./components/ui/QuestionCard";
import { useGame, getSavedSession, clearSavedSession } from "./hooks/useGame";
import { useAI } from "./hooks/useAI";
import { useStorage } from "./hooks/useStorage";
import { getNewBadges } from "./data/badges";

// Welcome and CheckIn load eagerly — they're the first two screens every
// session. Everything downstream is code-split so the initial bundle stays
// small; each screen's chunk loads while the player is still on earlier ones.
import Welcome from "./components/screens/Welcome";
import CheckIn from "./components/screens/CheckIn";
import ExitButton from "./components/ui/ExitButton";
import ErrorBoundary from "./components/ui/ErrorBoundary";

const IngredientReveal = lazy(() => import("./components/screens/IngredientReveal"));
const Cooking = lazy(() => import("./components/screens/Cooking"));
const TimeUp = lazy(() => import("./components/screens/TimeUp"));
const Submit = lazy(() => import("./components/screens/Submit"));
const Judgment = lazy(() => import("./components/screens/Judgment"));
const QuestionReveal = lazy(() => import("./components/screens/QuestionReveal"));
const WinnerAnnouncement = lazy(() => import("./components/screens/WinnerAnnouncement"));
const TheWord = lazy(() => import("./components/screens/TheWord"));
const ResultCard = lazy(() => import("./components/screens/ResultCard"));
const Profile = lazy(() => import("./components/screens/Profile"));
const CalmIntro = lazy(() => import("./components/screens/CalmIntro"));
const CalmCook = lazy(() => import("./components/screens/CalmCook"));
const CalmClose = lazy(() => import("./components/screens/CalmClose"));

// Minimal themed fallback shown for the split-second a screen chunk loads.
function ScreenLoader() {
  return (
    <div className="screen-center bg-deep" role="status" aria-busy="true">
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(245,207,93,0.2)",
          borderTop: "3px solid var(--accent-gold)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}

const PHASES = {
  WELCOME: "welcome",
  CHECKIN: "checkin",
  LOADING_AI: "loading_ai",
  INGREDIENTS: "ingredients",
  COOKING: "cooking",
  TIMEUP: "timeup",
  SUBMIT: "submit",
  ASK: "ask",
  JUDGING: "judging",
  QUESTION_REVEAL: "question_reveal",
  WINNER: "winner",
  THE_WORD: "the_word",
  RESULT_CARD: "result_card",
  PROFILE: "profile",
  // The calm night — cooperative, no scores, private by default.
  CALM_INTRO: "calm_intro",
  CALM_COOK: "calm_cook",
  CALM_CLOSE: "calm_close",
};

// Phases where a "quit to home" affordance is friendly to offer. Every calm
// phase is here — a mode built around fragile moments must never trap
// anyone inside it.
const EXIT_PHASES = new Set([
  PHASES.CHECKIN,
  PHASES.LOADING_AI,
  PHASES.INGREDIENTS,
  PHASES.COOKING,
  PHASES.TIMEUP,
  PHASES.SUBMIT,
  PHASES.JUDGING,
  PHASES.CALM_INTRO,
  PHASES.CALM_COOK,
  PHASES.CALM_CLOSE,
]);

const LOADING_MESSAGES = [
  "Setting up your perfect night...",
  "Picking a theme that fits your mood...",
  "Choosing secret ingredients...",
  "Tuning the playlist...",
  "Calling in the AI judge...",
];

const PHASE_KEY = "cook_together_phase";

// Phases that can't be resumed into directly get mapped to the nearest safe
// spot: LOADING_AI has no request in flight after a reload, JUDGING likewise.
const safePhaseForResume = (p) => {
  if (p === PHASES.LOADING_AI) return PHASES.CHECKIN;
  if (p === PHASES.JUDGING || p === PHASES.ASK) return PHASES.SUBMIT;
  // An interrupted calm night stays over — never re-open it uninvited.
  if (p === PHASES.CALM_INTRO || p === PHASES.CALM_CLOSE) return PHASES.WELCOME;
  return p;
};

const clearResumeSlot = () => {
  clearSavedSession();
  try {
    localStorage.removeItem(PHASE_KEY);
  } catch {
    /* ignore */
  }
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.WELCOME);
  const [aiError, setAiError] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Recoverable session detected at startup — offered on the Welcome screen.
  const readResumeSlot = () => {
    try {
      const saved = getSavedSession();
      const savedPhase = localStorage.getItem(PHASE_KEY);
      if (saved && saved.p1Name && savedPhase && savedPhase !== PHASES.WELCOME) {
        return { state: saved, phase: safePhaseForResume(savedPhase) };
      }
    } catch {
      /* ignore */
    }
    return null;
  };
  const [resumeSlot, setResumeSlot] = useState(readResumeSlot);

  // Cycle the loading message every ~2.2s while waiting for the AI context,
  // so a slow API call still feels alive. We don't reset to 0 on each entry —
  // that would be a synchronous setState in an effect, which React 19 flags.
  // Continuing from wherever the previous round left off is fine.
  useEffect(() => {
    if (phase !== PHASES.LOADING_AI) return;
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [phase]);

  // A soft chime marks each scene change — skipped on first mount so the app
  // doesn't ding the moment it loads, and skipped for TheWord, which opens in
  // deliberate silence before its own chord swell.
  const firstPhase = useRef(true);
  useEffect(() => {
    if (firstPhase.current) {
      firstPhase.current = false;
      return;
    }
    if (phase !== PHASES.THE_WORD) sfxChime();
  }, [phase]);

  // Snapshot the current phase so a reload can resume the night.
  useEffect(() => {
    if (phase === PHASES.WELCOME || phase === PHASES.PROFILE) return;
    try {
      localStorage.setItem(PHASE_KEY, safePhaseForResume(phase));
    } catch {
      /* ignore */
    }
  }, [phase]);

  // Guard against accidental tab close / reload once real progress is at
  // stake — game state is in-memory only, so closing mid-game loses the night.
  useEffect(() => {
    const GUARDED = new Set([
      PHASES.COOKING,
      PHASES.TIMEUP,
      PHASES.SUBMIT,
      PHASES.JUDGING,
      PHASES.QUESTION_REVEAL,
      PHASES.WINNER,
    ]);
    if (!GUARDED.has(phase)) return;
    const guard = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [phase]);

  const {
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
  } = useGame();
  const { buildGameContext, getJudgment, getWitness } = useAI();
  const { getProfile, updateProfileAfterGame } = useStorage();

  // The calm night's witness + word, held only for the close screen.
  const [calmResult, setCalmResult] = useState(null);

  // ─── Welcome ───────────────────────────────────────────────────────────────
  const handleWelcomeStart = useCallback(
    ({ p1Name, p2Name, isReturning, gamesPlayed }) => {
      // Starting fresh abandons any recoverable session.
      clearResumeSlot();
      setResumeSlot(null);
      updateGame({ p1Name, p2Name, isReturning, gamesPlayed });
      setPhase(PHASES.CHECKIN);
    },
    [updateGame]
  );

  // ─── The calm night ─────────────────────────────────────────────────────────
  // Entered only by a deliberate, private tap — never suggested by the app.
  const handleCalmEntry = useCallback(
    ({ p1Name, p2Name, isReturning, gamesPlayed }) => {
      clearResumeSlot();
      setResumeSlot(null);
      updateGame({ p1Name, p2Name, isReturning, gamesPlayed });
      setPhase(PHASES.CALM_INTRO);
    },
    [updateGame]
  );

  const handleCalmBegin = useCallback(
    ({ calmMood }) => {
      const calmTheme = getCalmTheme().name;
      updateGame({ calm: true, calmMood: calmMood || null, calmTheme });
      setPhase(PHASES.CALM_COOK);
    },
    [updateGame]
  );

  const handleCalmDone = useCallback(
    async ({ dishName }) => {
      const profile = getProfile();
      const history = profile
        ? {
            gamesPlayed: profile.gamesPlayed,
            pastWords: (profile.wordCollection || []).map((w) => w.word),
          }
        : null;
      const result = await getWitness({ ...gameState, dish1Name: dishName, history });
      setCalmResult(result);
      setPhase(PHASES.CALM_CLOSE);
    },
    [gameState, getWitness, getProfile]
  );

  const handleCalmGoodnight = useCallback(() => {
    // The word saves like any night; nothing else is recorded — no points,
    // no compatibility number, no diagnosis. Just the record of showing up.
    updateProfileAfterGame({
      theWord: calmResult?.theWord,
      theme: gameState.calmTheme,
      calm: true,
      memories: gameState.memories,
      questionAnswers: [],
    });
    // The morning-after note: one quiet acknowledgment on the next visit,
    // then it disappears. Never a push, never a streak.
    try {
      localStorage.setItem("cook_together_calm_note", new Date().toISOString());
    } catch {
      /* ignore */
    }
    clearResumeSlot();
    setResumeSlot(null);
    setCalmResult(null);
    resetGame();
    setPhase(PHASES.WELCOME);
  }, [calmResult, gameState, updateProfileAfterGame, resetGame]);

  // ─── Resume a saved night ───────────────────────────────────────────────────
  const handleResume = useCallback(() => {
    if (!resumeSlot) return;
    // Photos are trimmed from the save to keep localStorage small — drop the
    // placeholder markers so nothing tries to render "[trimmed]" as an image.
    const restored = {
      ...resumeSlot.state,
      memories: (resumeSlot.state.memories || []).map((m) => ({
        ...m,
        photo: m.photo === "[trimmed]" ? null : m.photo,
        audio: m.audio === "[trimmed]" ? null : m.audio,
      })),
    };
    setGameState(restored);
    setPhase(resumeSlot.phase);
  }, [resumeSlot, setGameState]);

  // ─── Check-in ──────────────────────────────────────────────────────────────
  const handleCheckInComplete = useCallback(
    async (checkInData) => {
      // The conductor: derive the night signal from the day check-in. It
      // steers every stage locally (ingredients, twist, questions, Chef) and
      // is described to the AI for theme + judge tone. Works with or
      // without the AI — the steering is deterministic.
      const night = computeNightSignal(checkInData);
      // One plate, always — the couple state picks how it's split:
      // two owned components on ambitious nights, prep/heat roles on easy ones.
      const shape = formatForNight(night, checkInData, {
        newPair: !!checkInData.newPair,
        gamesPlayed: gameState.gamesPlayed || 0,
      });
      updateCheckIn(checkInData);
      updateGame({ night, format: shape.format, roles: shape.roles });
      setPhase(PHASES.LOADING_AI);

      const stateForAI = {
        ...gameState,
        night,
        checkIn: { ...gameState.checkIn, ...checkInData },
      };

      try {
        const context = await buildGameContext(stateForAI);
        updateAIContext(context);
      } catch {
        // fallback already handled inside useAI
      }
      setPhase(PHASES.INGREDIENTS);
    },
    [gameState, updateCheckIn, updateGame, updateAIContext, buildGameContext]
  );

  // ─── Ingredients ───────────────────────────────────────────────────────────
  const handleIngredientsReady = useCallback(
    ({ secret1, secret2, swapped1, swapped2, stakes, mode, dish }) => {
      updateGame({
        secret1, secret2, swapped1, swapped2,
        mode: mode || "fun",
        stakes: stakes || "",
        suggestedDish: dish || null,
        // The clock matches the dish and is fixed once the night starts.
        cookSeconds: cookSecondsForDish(dish),
      });
      setPhase(PHASES.COOKING);
    },
    [updateGame]
  );

  // Early finish: a couple that plates at minute 8 goes straight to
  // submission — no "STOP" theatre for a stop they chose themselves.
  const handleFinishEarly = useCallback(
    (twist, coopMoment) => {
      updateGame({ twist, coopMoment, secondsLeft: null });
      setPhase(PHASES.SUBMIT);
    },
    [updateGame]
  );

  // The role split is a suggestion, not an order — one tap trades places.
  const handleSwapRoles = useCallback(() => {
    updateGame({ roles: { p1: gameState.roles?.p2, p2: gameState.roles?.p1 } });
  }, [updateGame, gameState.roles]);

  // ─── Cooking ───────────────────────────────────────────────────────────────
  const handleTimeUp = useCallback(
    (twist, coopMoment) => {
      updateGame({ twist, coopMoment, secondsLeft: null });
      setPhase(PHASES.TIMEUP);
    },
    [updateGame]
  );

  // Persisted every few seconds so a reload resumes the clock, not restarts it.
  const handleCookTick = useCallback(
    (secondsLeft) => {
      updateGame({ secondsLeft });
    },
    [updateGame]
  );

  // ─── Submit → ask → judgment ───────────────────────────────────────────────
  // The questions moved here from mid-cook: plates are down, hands are free,
  // the food is still hot — and the judge is deliberating anyway. The wait
  // becomes the warmest beat instead of the emptiest one.
  const judgingRef = useRef(null);
  const [askQuestions, setAskQuestions] = useState([]);
  const [askIdx, setAskIdx] = useState(0);

  const handleSubmit = useCallback(
    async (dishData) => {
      updateGame(dishData);
      setAiError(null);

      // The judge's memory: everything this couple has accumulated. Night 10's
      // judge remembers night 3's ridiculous dish name. New pairs get a judge
      // who meets them completely fresh — no history, ever.
      const profileForMemory = gameState.checkIn?.newPair ? null : getProfile();
      const fullState = {
        ...gameState,
        ...dishData,
        history: profileForMemory
          ? {
              gamesPlayed: profileForMemory.gamesPlayed || 0,
              pastWords: (profileForMemory.wordCollection || []).map((w) => w.word),
              lastTitle: profileForMemory.coupleTitle || "",
              dishHistory: (profileForMemory.dishHistory || []).slice(-5),
            }
          : null,
      };
      // Judge in the background while the couple answers the questions.
      judgingRef.current = (async () => {
        const judgment = await getJudgment(fullState);
        updateJudgment(judgment);
        const newGamesCount = (gameState.gamesPlayed || 0) + 1;
        const profile = getProfile();
        const newBadgeObjects = getNewBadges(newGamesCount, profile?.badges || []);
        updateGame({ newBadges: newBadgeObjects.map((b) => b.id) });
      })();
      judgingRef.current.catch((err) => {
        console.error(err);
        setAiError(err.message);
      });

      // Plates down, hands free — now the questions.
      setAskQuestions(
        getQuestionsForTone(
          gameState.aiContext.questionTone || "mix",
          2,
          gameState.gamesPlayed || 0,
          gameState.checkIn?.newPair ? "playful" : gameState.night?.questionToneOverride || null
        )
      );
      setAskIdx(0);
      setPhase(PHASES.ASK);
    },
    [gameState, getJudgment, updateGame, updateJudgment, getProfile]
  );

  // Both questions done (answered or skipped) → catch up with the judge.
  const finishAsk = useCallback(async () => {
    setPhase(PHASES.JUDGING);
    try {
      await judgingRef.current;
      setPhase(PHASES.QUESTION_REVEAL);
    } catch {
      /* aiError already set — the Judgment screen offers retry */
    }
  }, []);

  const handleAskNext = useCallback(() => {
    if (askIdx + 1 < askQuestions.length) setAskIdx((i) => i + 1);
    else finishAsk();
  }, [askIdx, askQuestions.length, finishAsk]);

  const handleRetryJudgment = useCallback(() => {
    handleSubmit({
      plateName: gameState.plateName,
      platePhoto: gameState.platePhoto,
      p1Part: gameState.p1Part,
      p2Part: gameState.p2Part,
      usedSecret1: gameState.usedSecret1,
      usedSecret2: gameState.usedSecret2,
    });
  }, [handleSubmit, gameState]);

  // ─── Question reveal → winner ──────────────────────────────────────────────
  const handleQuestionsComplete = useCallback(() => {
    setPhase(PHASES.WINNER);
  }, []);

  // ─── Winner → The Word ─────────────────────────────────────────────────────
  const handleWinnerContinue = useCallback(() => {
    // New-pair nights leave no trace on the couple's profile — no words, no
    // dishes, no counts. A light night stays light.
    if (gameState.checkIn?.newPair) {
      setPhase(PHASES.THE_WORD);
      return;
    }
    // Persist to profile
    // One plate: both partners bank the same plate score — they rose together.
    updateProfileAfterGame({
      p1Points: gameState.judgment.plateScore,
      p2Points: gameState.judgment.plateScore,
      coupleTitle: gameState.judgment.coupleTitle,
      compatibilityScore: gameState.judgment.compatibilityScore,
      theme: gameState.aiContext.theme,
      theWord: gameState.judgment.theWord,
      newBadges: gameState.newBadges || [],
      memories: gameState.memories,
      questionAnswers: gameState.questionsAnswered,
      dish1Name: gameState.plateName,
      winner: gameState.judgment.winner,
    });
    setPhase(PHASES.THE_WORD);
  }, [gameState, updateProfileAfterGame]);

  // ─── The Word → Result Card ────────────────────────────────────────────────
  const handleWordContinue = useCallback(() => {
    setPhase(PHASES.RESULT_CARD);
  }, []);

  // ─── Result Card → play again ──────────────────────────────────────────────
  // Round 2 skips the Welcome screen — names are known, so go straight to
  // check-in. gamesPlayed is refreshed from the just-updated profile so badge
  // milestones count correctly across same-session rounds.
  const handlePlayAgain = useCallback(() => {
    clearResumeSlot();
    setResumeSlot(null);
    resetGame();
    const p = getProfile();
    if (p) updateGame({ gamesPlayed: p.gamesPlayed, isReturning: true });
    setPhase(PHASES.CHECKIN);
  }, [resetGame, getProfile, updateGame]);

  // ─── Exit to home from anywhere mid-flow ───────────────────────────────────
  const handleExitToHome = useCallback(() => {
    clearResumeSlot();
    setResumeSlot(null);
    resetGame();
    setAiError(null);
    setPhase(PHASES.WELCOME);
  }, [resetGame]);

  // ─── Profile ───────────────────────────────────────────────────────────────
  const handleViewProfile = useCallback(() => setPhase(PHASES.PROFILE), []);
  const handleProfileBack = useCallback(() => setPhase(PHASES.WELCOME), []);

  const profile = getProfile();

  return (
    <div className="app-shell">
      {EXIT_PHASES.has(phase) && <ExitButton onExit={handleExitToHome} />}

      <ErrorBoundary
        onReset={() => {
          // Land on Welcome and re-read the resume slot — the saved session
          // survives the crash, so the player can pick the night back up.
          setResumeSlot(readResumeSlot());
          setPhase(PHASES.WELCOME);
        }}
      >
      <Suspense fallback={<ScreenLoader />}>
      <div key={phase} className="phase-transition">
      {phase === PHASES.WELCOME && (
        <Welcome
          onStart={handleWelcomeStart}
          onViewProfile={handleViewProfile}
          onCalmNight={handleCalmEntry}
          resumeSlot={resumeSlot}
          onResume={handleResume}
        />
      )}

      {phase === PHASES.CALM_INTRO && (
        <CalmIntro onStart={handleCalmBegin} onBack={() => setPhase(PHASES.WELCOME)} />
      )}

      {phase === PHASES.CALM_COOK && (
        <CalmCook
          theme={gameState.calmTheme}
          memories={gameState.memories}
          onAddMemory={addMemory}
          onDone={handleCalmDone}
        />
      )}

      {phase === PHASES.CALM_CLOSE && (
        <CalmClose
          witness={calmResult?.witness}
          word={calmResult?.theWord}
          onGoodnight={handleCalmGoodnight}
        />
      )}

      {phase === PHASES.CHECKIN && (
        <CheckIn
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          isReturning={gameState.isReturning}
          onComplete={handleCheckInComplete}
        />
      )}

      {phase === PHASES.LOADING_AI && (
        <div
          className="screen-center bg-deep"
          style={{ textAlign: "center" }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            aria-hidden="true"
            style={{ fontSize: 64, marginBottom: 24, animation: "pulse 1.5s ease infinite", display: "inline-block" }}
          >
            🍳
          </div>
          <h2
            key={loadingMsgIdx}
            className="font-display animate-fade-in"
            style={{ fontSize: 24, marginBottom: 12, minHeight: 32 }}
          >
            {LOADING_MESSAGES[loadingMsgIdx]}
          </h2>
          <div
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              border: "3px solid rgba(245,207,93,0.2)",
              borderTop: "3px solid var(--accent-gold)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
        </div>
      )}

      {phase === PHASES.INGREDIENTS && (
        <IngredientReveal
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          theme={gameState.aiContext.theme}
          cookingTip={gameState.aiContext.cookingTip}
          openingMessage={gameState.aiContext.openingMessage}
          easyFor={gameState.night?.easyFor}
          coupleState={gameState.night?.coupleState}
          newPair={!!gameState.checkIn?.newPair}
          skill={Math.round(((Number(gameState.checkIn?.p1Skill) || 3) + (Number(gameState.checkIn?.p2Skill) || 3)) / 2)}
          format={gameState.format}
          roles={gameState.roles}
          onSwapRoles={handleSwapRoles}
          onReady={handleIngredientsReady}
        />
      )}

      {phase === PHASES.COOKING && (
        <Cooking
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          theme={gameState.aiContext.theme}
          musicMood={gameState.aiContext.musicMood}
          twistStyle={gameState.night?.twistStyle}
          night={gameState.night}
          gamesPlayed={gameState.gamesPlayed}
          secret1={gameState.secret1}
          secret2={gameState.secret2}
          roles={gameState.roles}
          suggestedDish={gameState.suggestedDish}
          cookSeconds={gameState.cookSeconds}
          memories={gameState.memories}
          onAddMemory={addMemory}
          onTimeUp={handleTimeUp}
          onFinishEarly={handleFinishEarly}
          initialSeconds={gameState.secondsLeft}
          onTick={handleCookTick}
        />
      )}

      {phase === PHASES.TIMEUP && (
        <TimeUp onContinue={() => setPhase(PHASES.SUBMIT)} />
      )}

      {phase === PHASES.SUBMIT && (
        <Submit
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          roles={gameState.roles}
          onSubmit={handleSubmit}
        />
      )}

      {phase === PHASES.ASK && (
        <div className="screen-center bg-deep" style={{ textAlign: "center" }}>
          <div style={{ maxWidth: 380, padding: "0 20px" }}>
            <div className="label" style={{ marginBottom: 8 }}>While the judge tastes</div>
            <h2 className="font-display" style={{ fontSize: 26, marginBottom: 10 }}>
              Two questions, while it's hot
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Plates are down, hands are free. Answer or skip — the reveal
              only shows what you both put in.
            </p>
          </div>
          {askQuestions[askIdx] && (
            <QuestionCard
              key={askIdx}
              question={askQuestions[askIdx]}
              p1Name={gameState.p1Name}
              p2Name={gameState.p2Name}
              onSubmit={(q, a1, a2) => {
                addQuestionAnswer(q, a1, a2);
                handleAskNext();
              }}
              onDismiss={handleAskNext}
            />
          )}
        </div>
      )}

      {phase === PHASES.JUDGING && (
        <Judgment
          isLoading={!aiError}
          error={aiError}
          onRetry={handleRetryJudgment}
        />
      )}

      {phase === PHASES.QUESTION_REVEAL && (
        <QuestionReveal
          questionsAnswered={gameState.questionsAnswered}
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          onComplete={handleQuestionsComplete}
          onReaction={addReaction}
        />
      )}

      {phase === PHASES.WINNER && (
        <WinnerAnnouncement
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          newPair={!!gameState.checkIn?.newPair}
          mode={gameState.mode}
          judgment={gameState.judgment}
          stakes={gameState.stakes}
          onContinue={handleWinnerContinue}
        />
      )}

      {phase === PHASES.THE_WORD && (
        <TheWord word={gameState.judgment.theWord} onContinue={handleWordContinue} />
      )}

      {phase === PHASES.RESULT_CARD && (
        <ResultCard
          p1Name={gameState.p1Name}
          p2Name={gameState.p2Name}
          judgment={gameState.judgment}
          mode={gameState.mode}
          plateName={gameState.plateName}
          theme={gameState.aiContext.theme}
          memories={gameState.memories}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {phase === PHASES.PROFILE && (
        <Profile profile={profile} onBack={handleProfileBack} />
      )}
      </div>
      </Suspense>
      </ErrorBoundary>
    </div>
  );
}
