// Tactile punctuation on devices that support it (Android Chrome; iOS Safari
// silently ignores navigator.vibrate). Patterns are short and quiet on
// purpose — a tap on the wrist, never an alarm.
const buzz = (pattern) => {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
};

export const hapticTap = () => buzz(12);
export const hapticSuccess = () => buzz([15, 70, 30]);
export const hapticTimeUp = () => buzz([45, 90, 45, 90, 90]);
