import type { MeterSettings, MeterSnapshot, MeterStage } from "./types";

export { METER_DURATION } from "./types";
export type { MeterSettings, MeterSnapshot, MeterStage, RecordingMode } from "./types";

const PROPAGATION_SPEED = 10;
const EXCITATION_DURATION = 2;
const EXTRACELLULAR_EXCITED_MV = -20;
const TRANSMEMBRANE_RESTING_MV = -70;
const TRANSMEMBRANE_EXCITED_MV = 30;
const POINTER_LIMIT_DEGREES = 42;
const POINTER_DEGREES_PER_MV = POINTER_LIMIT_DEGREES / Math.abs(EXTRACELLULAR_EXCITED_MV);

function getArrivalTime(stimulusPosition: number, electrodePosition: number): number {
  return Math.abs(electrodePosition - stimulusPosition) / PROPAGATION_SPEED;
}

function isExcited(time: number, arrival: number): boolean {
  return time >= arrival && time < arrival + EXCITATION_DURATION;
}

function getStage(time: number, arrivalA: number, arrivalB: number): MeterStage {
  const excitedAtA = isExcited(time, arrivalA);
  const excitedAtB = isExcited(time, arrivalB);
  if (arrivalA === arrivalB && excitedAtA && excitedAtB) return "simultaneous";
  if (excitedAtA && !excitedAtB) return "at-a";
  if (excitedAtB && !excitedAtA) return "at-b";
  if (time <= 0) return "resting";

  const firstArrival = Math.min(arrivalA, arrivalB);
  const lastArrival = Math.max(arrivalA, arrivalB);
  if (time < firstArrival) {
    return arrivalA < arrivalB ? "approaching-a" : "approaching-b";
  }
  if (time >= lastArrival + EXCITATION_DURATION) return "passed";

  if (arrivalA < arrivalB) {
    if (excitedAtA) return "at-a";
    if (excitedAtB) return "at-b";
  } else {
    if (excitedAtB) return "at-b";
    if (excitedAtA) return "at-a";
  }

  return "between";
}

function getExtracellularVoltage(time: number, arrival: number): number {
  return isExcited(time, arrival) ? EXTRACELLULAR_EXCITED_MV : 0;
}

function getPointerAngle(differenceMv: number): number {
  return Math.max(
    -POINTER_LIMIT_DEGREES,
    Math.min(POINTER_LIMIT_DEGREES, differenceMv * POINTER_DEGREES_PER_MV),
  );
}

/**
 * Returns a deterministic teaching schematic, not a biophysical measurement.
 * Extracellular excitation is a two-time-unit negative local pulse. In
 * transmembrane mode A is intracellular and B is the extracellular reference.
 */
export function getMeterSnapshot(
  time: number,
  settings: MeterSettings,
): MeterSnapshot {
  const arrivalA = getArrivalTime(settings.stimulusPosition, settings.electrodeA);
  const arrivalB = getArrivalTime(settings.stimulusPosition, settings.electrodeB);
  const voltageA =
    settings.mode === "transmembrane"
      ? isExcited(time, arrivalA)
        ? TRANSMEMBRANE_EXCITED_MV
        : TRANSMEMBRANE_RESTING_MV
      : getExtracellularVoltage(time, arrivalA);
  const voltageB =
    settings.mode === "transmembrane"
      ? 0
      : getExtracellularVoltage(time, arrivalB);
  const unreversedDifference = voltageA - voltageB;
  const differenceMv = settings.leadsReversed
    ? -unreversedDifference
    : unreversedDifference;

  return {
    stage: getStage(time, arrivalA, arrivalB),
    voltageA,
    voltageB,
    differenceMv,
    pointerAngle: getPointerAngle(differenceMv),
    arrivalA,
    arrivalB,
    wavefronts: [
      settings.stimulusPosition - PROPAGATION_SPEED * Math.max(0, time),
      settings.stimulusPosition + PROPAGATION_SPEED * Math.max(0, time),
    ],
  };
}
