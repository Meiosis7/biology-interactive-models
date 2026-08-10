import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

export function normalizeProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

export function getActionPotentialFrame(
  mode: ActionPotentialMode,
  progress: number,
): ActionPotentialFrame {
  const normalized = normalizeProgress(progress);

  if (mode === "resting") {
    return {
      phase: "resting",
      ionMotion: "potassium-out",
      polarity: "outside-positive",
      excitedCenters: [0.5, 0.5],
      localCurrentVisible: false,
    };
  }

  if (mode === "conduction") {
    const distance = normalized * 0.38;
    return {
      phase: "conducting",
      ionMotion: "sodium-in",
      polarity: "inside-positive",
      excitedCenters: [0.5 - distance, 0.5 + distance],
      localCurrentVisible: true,
    };
  }

  if (normalized < 0.28) {
    return {
      phase: "sodium-in",
      ionMotion: "sodium-in",
      polarity: "outside-positive",
      excitedCenters: [0.5, 0.5],
      localCurrentVisible: false,
    };
  }

  if (normalized < 0.5) {
    return {
      phase: "polarity-reversed",
      ionMotion: "none",
      polarity: "inside-positive",
      excitedCenters: [0.5, 0.5],
      localCurrentVisible: false,
    };
  }

  if (normalized < 0.78) {
    return {
      phase: "potassium-out",
      ionMotion: "potassium-out",
      polarity: "inside-positive",
      excitedCenters: [0.5, 0.5],
      localCurrentVisible: false,
    };
  }

  return {
    phase: "recovered",
    ionMotion: "none",
    polarity: "outside-positive",
    excitedCenters: [0.5, 0.5],
    localCurrentVisible: false,
  };
}
