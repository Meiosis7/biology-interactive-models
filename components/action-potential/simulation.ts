import type {
  ActionPotentialFrame,
  ActionPotentialMode,
  ConductionStep,
} from "./types";
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

export const CONDUCTION_LOCAL_CURRENT_MS = 700;
export const CONDUCTION_ACTION_POTENTIAL_MS = 1400;
const CHANNEL_OPEN_END_MS = 300;
const SODIUM_IN_END_MS = 1150;

const CONDUCTION_ROUNDS = [
  {
    actionStep: 2,
    currentStep: 1,
    before: [3],
    after: [2, 3, 4],
    targets: [2, 4],
  },
  {
    actionStep: 4,
    currentStep: 2,
    before: [2, 3, 4],
    after: [1, 2, 3, 4, 5],
    targets: [1, 5],
  },
  {
    actionStep: 6,
    currentStep: 3,
    before: [1, 2, 3, 4, 5],
    after: [0, 1, 2, 3, 4, 5, 6],
    targets: [0, 6],
  },
] as const;

const GENERATION_PHASE_ENDS_MS = {
  stimulus: 1000,
  sodiumChannelOpening: 2500,
  sodiumIn: 3550,
} as const;

export function normalizeProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

export function getConductionStepFrame(
  step: ConductionStep,
  progress: number,
): ActionPotentialFrame {
  if (step === 0) {
    return {
      phase: "excited",
      segments: makeSegments([CENTER_SEGMENT]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "中央膜段已经形成动作电位",
    };
  }

  if (step % 2 === 1) {
    const round = CONDUCTION_ROUNDS[(step - 1) / 2]!;
    return {
      phase: "local-current",
      segments: makeSegments(round.before, [], [], round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: round.currentStep,
      instruction: "形成局部电流",
    };
  }

  const round = CONDUCTION_ROUNDS[step / 2 - 1]!;
  const normalized = normalizeProgress(progress);
  const elapsed = normalized * CONDUCTION_ACTION_POTENTIAL_MS;
  const complete = normalized >= 1;
  const finalRound = step === 6;

  if (elapsed < CHANNEL_OPEN_END_MS) {
    return {
      phase: "sodium-channel-opening",
      segments: makeSegments(round.before, round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "局部电流使相邻膜段 Na⁺通道开放",
    };
  }

  if (elapsed < SODIUM_IN_END_MS) {
    return {
      phase: "neighbor-sodium-in",
      segments: makeSegments(round.before, round.targets, round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "Na⁺从上下通道进入相邻膜段",
    };
  }

  return {
    phase: finalRound && complete ? "conducted" : "neighbor-excited",
    segments: makeSegments(round.after, round.targets),
    potassiumChannelOpen: false,
    potassiumOutflow: false,
    stimulusVisible: true,
    localCurrentStep: null,
    instruction:
      finalRound && complete
        ? "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。"
        : "相邻膜段形成动作电位",
  };
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
    return getConductionStepFrame(0, 1);
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
