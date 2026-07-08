import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's SpeechRecognition API for dictation into text fields.
 * Falls back gracefully (supported=false) on browsers that don't have it
 * (Firefox, older Safari).
 *
 * Usage:
 *   const { supported, listening, transcript, start, stop, reset } = useSpeechInput();
 *
 * The hook does not autocommit transcript to anywhere — callers decide what
 * to do with it (typically append to an existing input value).
 */
export const useSpeechInput = ({ lang = "en-US", continuous = false } = {}) => {
  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SpeechRecognition;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef("");

  // Tear down recognition cleanly on unmount.
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.onend = null;
          rec.onerror = null;
          rec.onresult = null;
          rec.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("Voice input isn't supported on this browser.");
      return;
    }
    setError(null);
    finalRef.current = "";
    setTranscript("");

    try {
      const rec = new SpeechRecognition();
      rec.lang = lang;
      rec.continuous = continuous;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalRef.current += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        setTranscript((finalRef.current + interim).trim());
      };

      rec.onerror = (e) => {
        const msg =
          e?.error === "not-allowed"
            ? "Microphone permission was blocked. Allow mic access and try again."
            : e?.error === "no-speech"
            ? "Didn't catch that — try again."
            : "Voice input ran into an error. Try again.";
        setError(msg);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err) {
      setError("Couldn't start voice input.");
      setListening(false);
      console.warn("speech input failed:", err);
    }
  }, [SpeechRecognition, supported, lang, continuous]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
};
