import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

export const SEGMENT_COUNT = 7;
export const CENTER_SEGMENT = 3;

function makeSegments(
  excited: readonly number[],
  sodiumOpen: readonly number[] = [],
  sodiumInflux: readonly number[] = [],
  currentTargets: readonly number[] = [],
) {
  return Array.from({ length: SEGMENT_COUNT }, (_, id) => ({
    id,
    polarity: excited.includes(id) ? ("excited" as const) : ("resting" as const),
    sodiumChannelOpen: sodiumOpen.includes(id),
    sodiumInflux: sodiumInflux.includes(id),
    currentTarget: currentTargets.includes(id),
  }));
}

const CONDUCTION_STAGES = [
  { until: 0.12, phase: "local-current", excited: [3], step: 1, targets: [2, 4], open: [], influx: [] },
  { until: 0.24, phase: "neighbor-sodium-in", excited: [3], step: 1, targets: [2, 4], open: [2, 4], influx: [2, 4] },
  { until: 0.36, phase: "local-current", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [], influx: [] },
  { until: 0.48, phase: "neighbor-sodium-in", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [1, 5], influx: [1, 5] },
  { until: 0.60, phase: "local-current", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [], influx: [] },
  { until: 0.72, phase: "neighbor-sodium-in", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [0, 6], influx: [0, 6] },
] as const;

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
      segments: makeSegments([]),
      potassiumChannelOpen: true,
      potassiumOutflow: true,
      stimulusVisible: false,
      localCurrentStep: null,
      instruction: "K⁺外流，膜两侧保持外正内负",
    };
  }

  if (mode === "conduction") {
    const stage = CONDUCTION_STAGES.find((item) => normalized < item.until);
    if (stage) {
      return {
        phase: stage.phase,
        segments: makeSegments(stage.excited, stage.open, stage.influx, stage.targets),
        potassiumChannelOpen: false,
        potassiumOutflow: false,
        stimulusVisible: true,
        localCurrentStep: stage.step,
        instruction: stage.phase === "local-current" ? "形成局部电流" : "相邻 Na⁺通道开放",
      };
    }

    return {
      phase: "conducted",
      segments: makeSegments([0, 1, 2, 3, 4, 5, 6]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "兴奋已由刺激点传到两侧",
    };
  }

  if (normalized < 0.16) {
    return {
      phase: "stimulus",
      segments: makeSegments([]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "刺激中央膜段",
    };
  }

  if (normalized < 0.36) {
    return {
      phase: "sodium-channel-opening",
      segments: makeSegments([], [CENTER_SEGMENT]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "中央 Na⁺通道开放",
    };
  }

  if (normalized < 0.72) {
    return {
      phase: "sodium-in",
      segments: makeSegments([], [CENTER_SEGMENT], [CENTER_SEGMENT]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "Na⁺从膜外进入中央膜段",
    };
  }

  return {
    phase: "excited",
    segments: makeSegments([CENTER_SEGMENT], [CENTER_SEGMENT]),
    potassiumChannelOpen: false,
    potassiumOutflow: false,
    stimulusVisible: true,
    localCurrentStep: null,
    instruction: "中央膜段兴奋，局部外负内正",
  };
}
