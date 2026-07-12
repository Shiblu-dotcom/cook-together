// Zero-infrastructure error visibility. There is no backend, so the next
// best thing: every uncaught error and rejected promise lands in a small
// localStorage ring buffer, and the Profile screen offers a one-tap
// "report a problem" that mails the log. The chef button was silently
// broken on phones for days — never again without a trace.
const KEY = "cook_together_errors";

const push = (entry) => {
  try {
    const log = JSON.parse(localStorage.getItem(KEY) || "[]");
    log.push({ ...entry, at: new Date().toISOString(), ua: navigator.userAgent.slice(0, 90) });
    localStorage.setItem(KEY, JSON.stringify(log.slice(-20)));
  } catch {
    /* the crash log must never itself crash anything */
  }
};

export const initCrashLog = () => {
  window.addEventListener("error", (e) =>
    push({ msg: String(e.message).slice(0, 300), src: `${e.filename || "?"}:${e.lineno || "?"}` })
  );
  window.addEventListener("unhandledrejection", (e) =>
    push({ msg: "unhandled: " + String(e.reason?.message || e.reason).slice(0, 300) })
  );
};

export const getCrashLog = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};
