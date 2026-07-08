import html2canvas from "html2canvas";

export const captureCard = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return null;
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("Card capture failed:", err);
    return null;
  }
};

export const downloadCard = async (elementId, filename = "cook-together-card.png") => {
  const dataUrl = await captureCard(elementId);
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

export const shareCard = async (elementId, title = "Cook Together, Stay Together") => {
  const dataUrl = await captureCard(elementId);
  if (!dataUrl) return;

  if (navigator.share && navigator.canShare) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "cook-together-card.png", { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return;
    }
  }

  // Fallback: open in new tab
  const win = window.open();
  if (win) {
    win.document.write(`<img src="${dataUrl}" style="max-width:100%" />`);
  }
};
