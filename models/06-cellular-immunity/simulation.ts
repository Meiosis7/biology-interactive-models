import type {
  AntigenSpecificity,
  CellularCondition,
  CellularSettings,
  CellularSnapshot,
  CellularStage,
  TargetType,
} from "./types";

export type {
  AntigenSpecificity,
  CellularCondition,
  CellularSettings,
  CellularSnapshot,
  CellularStage,
  TargetType,
} from "./types";

export const CELLULAR_DURATION = 16;

type Timeline = Record<CellularStage, number>;

const PRIMARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 3,
  "cytotoxic-activation": 5,
  "clonal-expansion": 8,
  "target-recognition": 11,
  "target-lysis": 13,
  memory: 16,
};

const MATCHED_SECONDARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 2,
  "cytotoxic-activation": 3,
  "clonal-expansion": 4,
  "target-recognition": 6,
  "target-lysis": 8,
  memory: 16,
};

const STAGES: CellularStage[] = [
  "presentation",
  "helper-activation",
  "cytotoxic-activation",
  "clonal-expansion",
  "target-recognition",
  "target-lysis",
  "memory",
];

const UPSTREAM_BLOCKED_STAGE: Record<
  Exclude<CellularCondition, "normal" | "marker-mismatch">,
  CellularStage
> = {
  "presentation-blocked": "presentation",
  "helper-t-blocked": "helper-activation",
  "cytotoxic-t-missing": "cytotoxic-activation",
};

function clampTime(time: number): number {
  return Math.min(CELLULAR_DURATION, Math.max(0, time));
}

function stageAt(time: number, timeline: Timeline): CellularStage {
  let current: CellularStage = "presentation";

  for (const stage of STAGES) {
    if (time >= timeline[stage]) current = stage;
  }

  return current;
}

function getTimeline(memoryMatched: boolean): Timeline {
  return memoryMatched ? MATCHED_SECONDARY_TIMELINE : PRIMARY_TIMELINE;
}

function getTargetMarker(target: TargetType): AntigenSpecificity | null {
  if (target === "infected-a") return "A";
  if (target === "infected-b") return "B";
  return null;
}

function isMemoryMatched(settings: CellularSettings): boolean {
  return (
    settings.exposure === "secondary" &&
    settings.memorySpecificity === settings.tCellSpecificity &&
    getTargetMarker(settings.target) === settings.tCellSpecificity
  );
}

function hasMatchingTarget(settings: CellularSettings): boolean {
  return (
    settings.condition !== "marker-mismatch" &&
    getTargetMarker(settings.target) === settings.tCellSpecificity
  );
}

function getEffectorCount(time: number, timeline: Timeline, memoryMatched: boolean): number {
  const expansionStart = timeline["clonal-expansion"];
  const recognitionStart = timeline["target-recognition"];
  const peak = memoryMatched ? 100 : 60;

  if (time < expansionStart) return 0;

  return Math.round(
    peak * Math.min(1, (time - expansionStart + 1) / (recognitionStart - expansionStart)),
  );
}

function getBlockedSnapshot(
  time: number,
  memoryMatched: boolean,
  timeline: Timeline,
  blockedAt: CellularStage,
): CellularSnapshot {
  const blockedStarted = time >= timeline[blockedAt];
  const stage = blockedStarted ? blockedAt : stageAt(time, timeline);
  const helperActive =
    time >= timeline["helper-activation"] &&
    blockedAt !== "presentation" &&
    blockedAt !== "helper-activation";

  return {
    stage,
    blockedAt,
    helperActive,
    cytotoxicActive: false,
    effectorCount: 0,
    targetCount: 1,
    targetRecognized: false,
    targetLysed: false,
    memoryCount: 0,
    memoryMatched,
  };
}

export function getCellularSnapshot(
  time: number,
  settings: CellularSettings,
): CellularSnapshot {
  const currentTime = clampTime(time);
  const memoryMatched = isMemoryMatched(settings);
  const timeline = getTimeline(memoryMatched);

  if (
    settings.condition === "presentation-blocked" ||
    settings.condition === "helper-t-blocked" ||
    settings.condition === "cytotoxic-t-missing"
  ) {
    return getBlockedSnapshot(
      currentTime,
      memoryMatched,
      timeline,
      UPSTREAM_BLOCKED_STAGE[settings.condition],
    );
  }

  const targetRecognized =
    currentTime >= timeline["target-recognition"] && hasMatchingTarget(settings);
  const targetLysed = currentTime >= timeline["target-lysis"] && targetRecognized;

  return {
    stage: stageAt(currentTime, timeline),
    blockedAt: settings.condition === "marker-mismatch" ? "target-recognition" : null,
    helperActive: currentTime >= timeline["helper-activation"],
    cytotoxicActive: currentTime >= timeline["cytotoxic-activation"],
    effectorCount: getEffectorCount(currentTime, timeline, memoryMatched),
    targetCount: targetLysed ? 0 : 1,
    targetRecognized,
    targetLysed,
    memoryCount: currentTime >= timeline.memory ? (memoryMatched ? 60 : 30) : 0,
    memoryMatched,
  };
}
