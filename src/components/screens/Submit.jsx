import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { useCamera } from "../../hooks/useCamera";
import VoiceInput from "../ui/VoiceInput";

export default function Submit({ p1Name, p2Name, onSubmit }) {
  const [playerStep, setPlayerStep] = useState(1); // 1 or 2
  const [p1Data, setP1Data] = useState({ name: "", description: "", usedSecret: true, photo: null });
  const [p2Data, setP2Data] = useState({ name: "", description: "", usedSecret: true, photo: null });

  const [showCamera, setShowCamera] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(null);
  const [captureError, setCaptureError] = useState(null);
  const { videoRef, error, openCamera, closeCamera, capturePhoto } = useCamera();

  const currentData = playerStep === 1 ? p1Data : p2Data;
  const setCurrentData = playerStep === 1 ? setP1Data : setP2Data;
  const currentName = playerStep === 1 ? p1Name : p2Name;
  const otherName = playerStep === 1 ? p2Name : p1Name;

  const canProceed = currentData.name.trim() && currentData.description.trim();

  const handleOpenCamera = async () => {
    setShowCamera(true);
    setCameraPreview(null);
    setCaptureError(null);
    await openCamera();
  };

  const handleCloseCamera = () => {
    closeCamera();
    setShowCamera(false);
    setCameraPreview(null);
    setCaptureError(null);
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      setCameraPreview(photo);
      setCaptureError(null);
      closeCamera();
    } else {
      setCaptureError("Couldn't capture that frame. Try again.");
    }
  };

  const handleUsePhoto = () => {
    setCurrentData((d) => ({ ...d, photo: cameraPreview }));
    setShowCamera(false);
    setCameraPreview(null);
    setCaptureError(null);
  };

  // Allow Escape to close the camera modal.
  useEffect(() => {
    if (!showCamera) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleCloseCamera();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]);

  // Fresh player, fresh top of form — matters on small screens.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [playerStep]);

  const handleNext = () => {
    if (playerStep === 1) {
      setPlayerStep(2);
    } else {
      onSubmit({
        dish1Name: p1Data.name,
        dish1Description: p1Data.description,
        usedSecret1: p1Data.usedSecret,
        dish1Photo: p1Data.photo,
        dish2Name: p2Data.name,
        dish2Description: p2Data.description,
        usedSecret2: p2Data.usedSecret,
        dish2Photo: p2Data.photo,
      });
    }
  };

  return (
    <div className="screen bg-mesh" style={{ paddingTop: 24 }}>
      <div style={{ width: "100%", maxWidth: 440, padding: "0 4px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div className="label" style={{ color: "var(--accent-gold)", marginBottom: 8 }}>
            {playerStep === 1 ? "First up" : "And now"}
          </div>
          <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>
            {currentName}'s Dish
          </h2>
          {playerStep === 2 && (
            <>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
                {p1Name}, look away 🤫
              </p>
              <button
                className="btn-ghost"
                onClick={() => setPlayerStep(1)}
                style={{ marginTop: 4, fontSize: 13 }}
              >
                ← Fix {p1Name}'s entry
              </button>
            </>
          )}
        </div>

        {/* Photo capture */}
        <div style={{ marginBottom: 24 }}>
          <label className="label" style={{ display: "block", marginBottom: 10 }}>
            Final dish photo — optional, but the judge loves evidence
          </label>
          {currentData.photo ? (
            <div style={{ position: "relative" }}>
              <img
                src={currentData.photo}
                alt={`${currentName}'s final dish`}
                style={{ width: "100%", borderRadius: 16, maxHeight: 220, objectFit: "cover" }}
              />
              <button
                onClick={handleOpenCamera}
                aria-label="Retake dish photo"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.7)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  color: "white",
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Retake
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenCamera}
              aria-label="Take a photo of your dish"
              style={{
                width: "100%",
                height: 140,
                background: "rgba(255,255,255,0.03)",
                border: "2px dashed rgba(245,207,93,0.2)",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                color: "var(--text-secondary)",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,207,93,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(245,207,93,0.2)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              <Camera size={28} aria-hidden="true" />
              <span style={{ fontSize: 14 }}>Take a photo of your dish</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>(optional)</span>
            </button>
          )}
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
            <label className="label" style={{ flex: 1 }}>
              Give your dish a dramatic name
            </label>
            <VoiceInput
              value={currentData.name}
              onChange={(v) => setCurrentData((d) => ({ ...d, name: v }))}
              compact
            />
          </div>
          <input
            className="input-field"
            placeholder="e.g. The Midnight Revelation"
            value={currentData.name}
            onChange={(e) => setCurrentData((d) => ({ ...d, name: e.target.value }))}
            maxLength={60}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
            <label className="label" style={{ flex: 1 }}>
              Tell the judge what it is
            </label>
            <VoiceInput
              value={currentData.description}
              onChange={(v) => setCurrentData((d) => ({ ...d, description: v }))}
              compact
            />
          </div>
          <textarea
            className="input-field"
            rows={2}
            placeholder="What is it and what makes it special?"
            value={currentData.description}
            onChange={(e) => setCurrentData((d) => ({ ...d, description: e.target.value }))}
            maxLength={200}
            style={{ resize: "none" }}
          />
        </div>

        {/* Used secret ingredient */}
        <div style={{ marginBottom: 32 }} role="radiogroup" aria-label="Did you use your secret ingredient?">
          <label className="label" style={{ display: "block", marginBottom: 10 }}>
            Did you use your secret ingredient?
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            {[true, false].map((val) => {
              const isSel = currentData.usedSecret === val;
              return (
                <button
                  key={String(val)}
                  className={`chip ${isSel ? "selected" : ""}`}
                  role="radio"
                  aria-checked={isSel}
                  onClick={() => setCurrentData((d) => ({ ...d, usedSecret: val }))}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {val ? "Yes, I used it ✓" : "No, I skipped it"}
                </button>
              );
            })}
          </div>
          {!currentData.usedSecret && (
            <p style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 8 }} role="alert">
              Heads up — skipping means 0 points for {currentName} this round.
            </p>
          )}
        </div>

        <button
          className="btn-primary"
          onClick={handleNext}
          disabled={!canProceed}
          aria-disabled={!canProceed}
        >
          {playerStep === 1 ? `Done → ${otherName}'s turn` : "To the judge →"}
        </button>
      </div>

      {/* Camera modal */}
      {showCamera && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Take a dish photo"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          {error && <p style={{ color: "var(--accent-red)", marginBottom: 16, textAlign: "center", maxWidth: 360 }}>{error}</p>}
          {captureError && <p style={{ color: "var(--accent-red)", marginBottom: 16, textAlign: "center", maxWidth: 360 }}>{captureError}</p>}

          {cameraPreview ? (
            <>
              <img src={cameraPreview} alt="Photo preview" style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 24 }} />
              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
                <button className="btn-secondary" onClick={() => { setCameraPreview(null); openCamera(); }}>
                  Retake
                </button>
                <button className="btn-primary" onClick={handleUsePhoto}>
                  Use this photo ✓
                </button>
              </div>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Camera preview"
                style={{ width: "100%", maxWidth: 360, borderRadius: 16, marginBottom: 24, background: "#000" }}
              />
              <button
                onClick={handleCapture}
                aria-label="Capture photo"
                disabled={!!error}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "white",
                  border: "4px solid rgba(255,255,255,0.3)",
                  cursor: error ? "not-allowed" : "pointer",
                  opacity: error ? 0.4 : 1,
                  boxShadow: "0 0 0 6px rgba(255,255,255,0.1)",
                }}
              />
            </>
          )}

          <button className="btn-ghost" onClick={handleCloseCamera} style={{ marginTop: 20 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
