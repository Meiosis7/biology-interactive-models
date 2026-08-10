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
      openChannel: "potassium",
      stimulusVisible: false,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  if (mode === "conduction") {
    const distance = normalized * 0.38;
    return {
      phase: "conducting",
      ionMotion: "none",
      polarity: "inside-positive",
      openChannel: "none",
      stimulusVisible: true,
      excitedCenters: [0.5 - distance, 0.5 + distance],
      localCurrentVisible: true,
    };
  }

  if (normalized < 0.14) {
    return {
      phase: "stimulus",
      ionMotion: "none",
      polarity: "outside-positive",
      openChannel: "none",
      stimulusVisible: true,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  if (normalized < 0.66) {
    return {
      phase: "sodium-in",
      ionMotion: "sodium-in",
      polarity: "outside-positive",
      openChannel: "sodium",
      stimulusVisible: true,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  return {
    phase: "excited",
    ionMotion: "none",
    polarity: "inside-positive",
    openChannel: "sodium",
    stimulusVisible: true,
    excitedCenters: [0.5],
    localCurrentVisible: false,
  };
}
