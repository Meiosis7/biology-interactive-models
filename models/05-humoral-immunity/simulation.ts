import type {
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
} from "./types";

export type {
  AntigenType,
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
} from "./types";

export const HUMORAL_DURATION = 18;

type Timeline = Record<HumoralStage, number>;

const PRIMARY_TIMELINE: Timeline = {
  entry: 0,
  presentation: 1,
  "helper-activation": 3,
  "b-activation": 5,
  "clonal-expansion": 7,
  differentiation: 9,
  "antibody-release": 11,
  clearance: 14,
  memory: 16,
};

const MATCHED_SECONDARY_TIMELINE: Timeline = {
  entry: 0,
  presentation: 1,
  "helper-activation": 2,
  "b-activation": 3,
  "clonal-expansion": 4,
  differentiation: 5,
  "antibody-release": 6,
  clearance: 14,
  memory: 18,
};

const STAGES: HumoralStage[] = [
  "entry",
  "presentation",
  "helper-activation",
  "b-activation",
  "clonal-expansion",
  "differentiation",
  "antibody-release",
  "clearance",
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
  let current: HumoralStage = "entry";

  for (const stage of STAGES) {
    if (time >= timeline[stage]) current = stage;
  }

  return current;
}

function getTimeline(settings: HumoralSettings): Timeline {
  const memoryMatched =
    settings.exposure === "secondary" && settings.memoryAntigen === settings.antigen;

  return memoryMatched ? MATCHED_SECONDARY_TIMELINE : PRIMARY_TIMELINE;
}

function getAntibodyLevel(time: number, timeline: Timeline, memoryMatched: boolean): number {
  const releaseStart = timeline["antibody-release"];
  const clearanceStart = timeline.clearance;
  const memoryStart = timeline.memory;
  const peak = memoryMatched ? 180 : 100;

  if (time < releaseStart || time >= memoryStart) return 0;
  if (time < clearanceStart) {
    return Math.round(
      peak * Math.min(1, (time - releaseStart + 1) / (clearanceStart - releaseStart)),
    );
  }

  return Math.round(
    peak * Math.max(0, 1 - (time - clearanceStart) / (memoryStart - clearanceStart)),
  );
}

function getAntigenLevel(time: number, timeline: Timeline): number {
  const releaseStart = timeline["antibody-release"];
  const clearanceStart = timeline.clearance;
  const memoryStart = timeline.memory;

  if (time < releaseStart) return 100;
  if (time < clearanceStart) {
    return Math.round(100 - (60 * (time - releaseStart)) / (clearanceStart - releaseStart));
  }
  if (time < memoryStart) {
    return Math.round(40 - (40 * (time - clearanceStart)) / (memoryStart - clearanceStart));
  }

  return 0;
}

function getBlockedSnapshot(
  time: number,
  settings: HumoralSettings,
  timeline: Timeline,
  blockedAt: HumoralStage,
): HumoralSnapshot {
  const blockedStarted = time >= timeline[blockedAt];
  const stage = blockedStarted ? blockedAt : stageAt(time, timeline);
  const helperActive =
    time >= timeline["helper-activation"] && blockedAt !== "helper-activation" && blockedAt !== "presentation";

  return {
    stage,
    blockedAt,
    helperActive,
    bCellActive: false,
    plasmaCount: 0,
    memoryCount: 0,
    antibodyLevel: 0,
    antigenLevel: 100,
    memoryMatched:
      settings.exposure === "secondary" && settings.memoryAntigen === settings.antigen,
    antibodyTarget: null,
  };
}

export function getHumoralSnapshot(
  time: number,
  settings: HumoralSettings,
): HumoralSnapshot {
  const currentTime = clampTime(time);
  const timeline = getTimeline(settings);
  const memoryMatched =
    settings.exposure === "secondary" && settings.memoryAntigen === settings.antigen;

  if (settings.condition !== "normal") {
    return getBlockedSnapshot(
      currentTime,
      settings,
      timeline,
      BLOCKED_STAGE[settings.condition],
    );
  }

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
    plasmaCount:
      hasDifferentiated && beforeMemoryStage
        ? Math.round(
            plasmaPeak *
              Math.min(
                1,
                (currentTime - timeline.differentiation + 1) /
                  (timeline["antibody-release"] - timeline.differentiation),
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
