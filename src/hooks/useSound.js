import { useRef, useCallback } from "react";

export const useSound = () => {
  const audioRef = useRef(null);
  const isMuted = useRef(false);

  const play = useCallback((filename, { loop = false, volume = 0.6 } = {}) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(`/sounds/${filename}`);
      audio.loop = loop;
      audio.volume = isMuted.current ? 0 : volume;
      audio.play().catch(() => {});
      audioRef.current = audio;
      return audio;
    } catch {
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const fadeOut = useCallback((duration = 1500) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const startVolume = audio.volume;
    const step = startVolume / (duration / 50);
    const interval = setInterval(() => {
      if (audio.volume > step) {
        audio.volume = Math.max(0, audio.volume - step);
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(interval);
      }
    }, 50);
  }, []);

  const setMuted = useCallback((muted) => {
    isMuted.current = muted;
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : 0.6;
    }
  }, []);

  const playSfx = useCallback((filename) => {
    try {
      const sfx = new Audio(`/sounds/${filename}`);
      sfx.volume = isMuted.current ? 0 : 0.8;
      sfx.play().catch(() => {
        /* autoplay can be blocked; silently ignore */
      });
    } catch {
      /* Audio() can throw on some browsers; ignore */
    }
  }, []);

  return { play, stop, fadeOut, setMuted, playSfx };
};
