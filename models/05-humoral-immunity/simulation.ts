import type {
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
} from "./types";

export type {
  AntigenType,
  BCellSpecificity,
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
} from "./types";

export const HUMORAL_DURATION = 18;

type Timeline = Record<HumoralStage, number>;

const PRIMARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 3,
  "b-activation": 5,
  "clonal-expansion": 7,
  differentiation: 9,
  "antibody-binding": 11,
  memory: 16,
};

const MATCHED_SECONDARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 2,
  "b-activation": 3,
  "clonal-expansion": 4,
  differentiation: 5,
  "antibody-binding": 6,
  memory: 18,
};

const STAGES: HumoralStage[] = [
  "presentation",
  "helper-activation",
  "b-activation",
  "clonal-expansion",
  "differentiation",
  "antibody-binding",
  "memory",
];

const BLOCKED_STAGE: Record<Exclude<HumoralCondition, "normal">, HumoralStage> = {
  "presentation-blocked": "presentation",
  "helper-t-blocked": "helper-activation",
  "b-cell-missing": "b-activation",
};

function clampTime(time: number): number {
  return Math.min(HUMORAL_DURATION, Math.max(0, time));
}

function stageAt(time: number, timeline: Timeline): HumoralStage {
  let current: HumoralStage = "presentation";

  for (const stage of STAGES) {
    if (time >= timeline[stage]) current = stage;
  }

  return current;
}

function isMemoryMatched(settings: HumoralSettings): boolean {
  return (
    settings.condition === "normal" &&
    settings.bCellSpecificity === settings.antigen &&
    settings.exposure === "secondary" &&
    settings.memorySpecificity === settings.antigen
  );
}

function getTimeline(settings: HumoralSettings): Timeline {
  return isMemoryMatched(settings) ? MATCHED_SECONDARY_TIMELINE : PRIMARY_TIMELINE;
}

function getAntibodyLevel(time: number, timeline: Timeline, memoryMatched: boolean): number {
  const releaseStart = timeline["antibody-binding"];
  const peakTime = memoryMatched ? 12 : 14;
  const responseEnd = timeline.memory;
  const peak = memoryMatched ? 180 : 100;

  if (time < releaseStart || time >= responseEnd) return 0;
  if (time <= peakTime) {
    return Math.round(
      peak * Math.min(1, (time - releaseStart + 1) / (peakTime - releaseStart + 1)),
    );
  }

  return Math.round(
    peak * Math.max(0, 1 - (time - peakTime) / (responseEnd - peakTime)),
  );
}

function getAntigenLevel(time: number, timeline: Timeline): number {
  const releaseStart = timeline["antibody-binding"];
  const responseEnd = timeline.memory;

  if (time < releaseStart) return 100;
  if (time >= responseEnd) return 0;
  return Math.round(
    100 - (100 * (time - releaseStart)) / (responseEnd - releaseStart),
  );
}

function getStoppedSnapshot(
  time: number,
  settings: HumoralSettings,
  timeline: Timeline,
  blockedAt: HumoralStage,
  bCellMatched: boolean,
): HumoralSnapshot {
  const blockedStarted = time >= timeline[blockedAt];
  const stage = blockedStarted ? blockedAt : stageAt(time, timeline);
  const helperActive =
    time >= timeline["helper-activation"] &&
    blockedAt !== "helper-activation" &&
    blockedAt !== "presentation";

  return {
    stage,
    blockedAt,
    helperActive,
    bCellActive: false,
    bCellMatched,
    plasmaCount: 0,
    memoryCount: 0,
    antibodyLevel: 0,
    antigenLevel: 100,
    memoryMatched: false,
    antibodyTarget: null,
  };
}

export function getHumoralSnapshot(
  time: number,
  settings: HumoralSettings,
): HumoralSnapshot {
  const currentTime = clampTime(time);
  const timeline = getTimeline(settings);
  const bCellMatched = settings.bCellSpecificity === settings.antigen;

  if (settings.condition === "normal" && !bCellMatched) {
    return getStoppedSnapshot(
      currentTime,
      settings,
      timeline,
      "b-activation",
      false,
    );
  }

  if (settings.condition !== "normal") {
    return getStoppedSnapshot(
      currentTime,
      settings,
      timeline,
      BLOCKED_STAGE[settings.condition],
      bCellMatched,
    );
  }

  const memoryMatched = isMemoryMatched(settings);
  const stage = stageAt(currentTime, timeline);
  const antibodyLevel = getAntibodyLevel(currentTime, timeline, memoryMatched);
  const hasDifferentiated = currentTime >= timeline.differentiation;
  const beforeMemoryStage = currentTime < timeline.memory;
  const plasmaPeak = memoryMatched ? 90 : 50;

  return {
    stage,
    blockedAt: null,
    helperActive: currentTime >= timeline["helper-activation"],
    bCellActive: currentTime >= timeline["b-activation"],
    bCellMatched: true,
    plasmaCount:
      hasDifferentiated && beforeMemoryStage
        ? Math.round(
            plasmaPeak *
              Math.min(
                1,
                (currentTime - timeline.differentiation + 1) /
                  (timeline["antibody-binding"] - timeline.differentiation),
              ),
          )
        : 0,
    memoryCount: hasDifferentiated ? (memoryMatched ? 45 : 25) : 0,
    antibodyLevel,
    antigenLevel: getAntigenLevel(currentTime, timeline),
    memoryMatched,
    antibodyTarget: antibodyLevel > 0 ? settings.antigen : null,
  };
}
