import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Records short audio clips with MediaRecorder, returning a base64 data URL
 * caller-side so the clip is easy to store alongside photos in localStorage.
 *
 * Usage:
 *   const { supported, recording, durationMs, error, start, stop } = useVoiceRecorder();
 *   await start();
 *   const result = await stop(); // { dataUrl, durationMs }
 */
export const useVoiceRecorder = ({ maxDurationMs = 30000 } = {}) => {
  const supported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const [recording, setRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const startTsRef = useRef(0);
  const tickRef = useRef(null);
  const maxTimerRef = useRef(null);
  const stopResolveRef = useRef(null);

  const cleanup = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!supported) {
      setError("Voice recording isn't supported on this browser.");
      return false;
    }
    setError(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const elapsed = Date.now() - startTsRef.current;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          cleanup();
          setRecording(false);
          setDurationMs(0);
          if (stopResolveRef.current) {
            stopResolveRef.current({ dataUrl, durationMs: elapsed });
            stopResolveRef.current = null;
          }
        };
        reader.onerror = () => {
          cleanup();
          setRecording(false);
          setDurationMs(0);
          if (stopResolveRef.current) {
            stopResolveRef.current(null);
            stopResolveRef.current = null;
          }
        };
        reader.readAsDataURL(blob);
      };

      startTsRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setDurationMs(0);

      // Live duration tick
      tickRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTsRef.current);
      }, 100);

      // Hard cap at maxDurationMs.
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, maxDurationMs);

      return true;
    } catch (err) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Microphone permission was blocked. Allow mic access and try again."
          : "Couldn't start the recorder. Make sure no other app is using the mic.";
      setError(msg);
      setRecording(false);
      cleanup();
      return false;
    }
  }, [supported, maxDurationMs, cleanup]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") {
        cleanup();
        setRecording(false);
        resolve(null);
        return;
      }
      stopResolveRef.current = resolve;
      try {
        recorder.stop();
      } catch {
        cleanup();
        setRecording(false);
        resolve(null);
      }
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    stopResolveRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    cleanup();
    setRecording(false);
    setDurationMs(0);
  }, [cleanup]);

  return { supported, recording, durationMs, error, start, stop, cancel };
};
