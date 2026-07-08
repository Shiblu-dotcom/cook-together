import { useRef, useState, useCallback, useEffect } from "react";

export const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);
    // Stop any pre-existing stream before opening a new one.
    stopStream();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera not supported on this device or browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch (err) {
      const name = err && err.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Camera permission denied. Allow it in your browser settings and try again.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Couldn't open the camera. Try again or skip the photo.");
      }
      console.warn("Camera error:", err);
    }
  }, [stopStream]);

  const closeCamera = useCallback(() => {
    stopStream();
    setIsOpen(false);
  }, [stopStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    try {
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return null;
    }
  }, []);

  // Defensive cleanup: if the host component unmounts mid-stream, kill the
  // media tracks so the device light doesn't stay on.
  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return { videoRef, isOpen, error, openCamera, closeCamera, capturePhoto };
};
