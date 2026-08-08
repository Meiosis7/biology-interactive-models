import type {
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
  HumoralStopReason,
} from "./types";

export type {
  AntigenType,
  BCellSpecificity,
  HumoralCondition,
  HumoralSettings,
  HumoralSnapshot,
  HumoralStage,
  HumoralStopReason,
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
  memory: 15,
};

interface ResponseProfile {
  antibodyEnd: number;
  antigenClearance: number;
}

const PRIMARY_RESPONSE: ResponseProfile = {
  antibodyEnd: 16,
  antigenClearance: 16,
};

const MATCHED_SECONDARY_RESPONSE: ResponseProfile = {
  antibodyEnd: HUMORAL_DURATION,
  antigenClearance: 15,
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

function getAntibodyLevel(
  time: number,
  timeline: Timeline,
  memoryMatched: boolean,
  response: ResponseProfile,
): number {
  const releaseStart = timeline["antibody-binding"];
  const peakTime = memoryMatched ? 12 : 14;
  const peak = memoryMatched ? 180 : 100;

  if (time < releaseStart || time >= response.antibodyEnd) return 0;
  if (time <= peakTime) {
    return Math.round(
      peak * Math.min(1, (time - releaseStart + 1) / (peakTime - releaseStart + 1)),
    );
  }

  return Math.round(
    peak *
      Math.max(
        0,
        1 - (time - peakTime) / (response.antibodyEnd - peakTime),
      ),
  );
}

function getAntigenLevel(
  time: number,
  timeline: Timeline,
  clearanceTime: number,
): number {
  const releaseStart = timeline["antibody-binding"];

  if (time < releaseStart) return 100;
  if (time >= clearanceTime) return 0;
  return Math.round(
    100 - (100 * (time - releaseStart)) / (clearanceTime - releaseStart),
  );
}

function getStoppedSnapshot(
  time: number,
  timeline: Timeline,
  stopAt: HumoralStage,
  stopReason: HumoralStopReason,
  bCellMatched: boolean,
): HumoralSnapshot {
  const blockedStarted = time >= timeline[stopAt];
  const stage = blockedStarted ? stopAt : stageAt(time, timeline);
  const helperActive =
    time >= timeline["helper-activation"] &&
    stopAt !== "helper-activation" &&
    stopAt !== "presentation";

  return {
    stage,
    stopAt,
    blockedAt: blockedStarted ? stopAt : null,
    stopReason,
    stopReached: blockedStarted,
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
      timeline,
      "b-activation",
      "bcr-mismatch",
      false,
    );
  }

  if (settings.condition !== "normal") {
    return getStoppedSnapshot(
      currentTime,
      timeline,
      BLOCKED_STAGE[settings.condition],
      settings.condition,
      bCellMatched,
    );
  }

  const memoryMatched = isMemoryMatched(settings);
  const response = memoryMatched
    ? MATCHED_SECONDARY_RESPONSE
    : PRIMARY_RESPONSE;
  const stage = stageAt(currentTime, timeline);
  const antibodyLevel = getAntibodyLevel(
    currentTime,
    timeline,
    memoryMatched,
    response,
  );
  const hasDifferentiated = currentTime >= timeline.differentiation;
  const beforeMemoryStage = currentTime < timeline.memory;
  const plasmaPeak = memoryMatched ? 90 : 50;

  return {
    stage,
    stopAt: null,
    blockedAt: null,
    stopReason: null,
    stopReached: false,
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
    memoryCount: hasDifferentiated ? (memoryMatched ? 45 : 15) : 0,
    antibodyLevel,
    antigenLevel: getAntigenLevel(
      currentTime,
      timeline,
      response.antigenClearance,
    ),
    memoryMatched,
    antibodyTarget: antibodyLevel > 0 ? settings.antigen : null,
  };
}
