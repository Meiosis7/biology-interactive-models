import type { ActionPotentialFrame, ActionPotentialMode } from "./types";
import { MODE_DURATION_MS } from "./modeData";

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
  { durationMs: 580, phase: "local-current", excited: [3], step: 1, targets: [2, 4], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [3], step: 1, targets: [2, 4], open: [2, 4], influx: [2, 4] },
  { durationMs: 580, phase: "local-current", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [1, 5], influx: [1, 5] },
  { durationMs: 580, phase: "local-current", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [0, 6], influx: [0, 6] },
] as const;

const CONDUCTION_STAGE_ENDS_MS = CONDUCTION_STAGES.map(
  (_, index) =>
    CONDUCTION_STAGES.slice(0, index + 1).reduce(
      (total, stage) => total + stage.durationMs,
      0,
    ),
);

const GENERATION_PHASE_ENDS_MS = {
  stimulus: 1000,
  sodiumChannelOpening: 2500,
  sodiumIn: 3550,
} as const;

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
    const elapsedMs = normalized * MODE_DURATION_MS;
    const stageIndex = CONDUCTION_STAGE_ENDS_MS.findIndex(
      (stageEndMs) => elapsedMs < stageEndMs,
    );
    const stage = CONDUCTION_STAGES[stageIndex];
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

  const generationElapsedMs = normalized * MODE_DURATION_MS;

  if (generationElapsedMs < GENERATION_PHASE_ENDS_MS.stimulus) {
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

  if (
    generationElapsedMs < GENERATION_PHASE_ENDS_MS.sodiumChannelOpening
  ) {
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

  if (generationElapsedMs < GENERATION_PHASE_ENDS_MS.sodiumIn) {
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
