import type {
  ActionPotentialStage,
  ExperimentSettings,
  IonFlow,
  SimulationSnapshot,
  StimulusIntensity,
} from "./types";

export const DURATION = 10;
const PROPAGATION_SPEED = 0.16;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getArrivalTime(
  stimulusPosition: number,
  electrodePosition: number,
) {
  return 1 + Math.abs(electrodePosition - stimulusPosition) / PROPAGATION_SPEED;
}

export function getMembranePotential(
  localTime: number,
  intensity: StimulusIntensity,
) {
  if (localTime < 0) return -70;
  if (intensity === "weak") {
    if (localTime <= 1) return -70 + 12 * Math.sin(Math.PI * localTime);
    return -70;
  }
  if (localTime < 1) return -70;
  if (localTime < 2) return -70 + 15 * (localTime - 1);
  if (localTime < 3) return -55 + 85 * (localTime - 2);
  if (localTime < 3.5) return 30;
  if (localTime < 5) return 30 - (100 / 1.5) * (localTime - 3.5);
  if (localTime < 6) return -70 - 8 * Math.sin(Math.PI * (localTime - 5));
  return -70;
}

function getStage(
  localTime: number,
  intensity: StimulusIntensity,
): ActionPotentialStage {
  if (localTime < 0) return "resting";
  if (intensity === "weak") return localTime <= 1 ? "local" : "resting";
  if (localTime < 1) return "threshold";
  if (localTime < 3) return "depolarization";
  if (localTime < 3.5) return "peak";
  if (localTime < 5) return "repolarization";
  if (localTime < 6) return "recovery";
  return "resting";
}

function getIonFlow(stage: ActionPotentialStage): IonFlow {
  if (stage === "depolarization") return "sodium-in";
  if (stage === "repolarization" || stage === "recovery") {
    return "potassium-out";
  }
  return "none";
}

function getWavefronts(time: number, stimulusPosition: number) {
  if (time < 1) return [];
  const distance = (time - 1) * PROPAGATION_SPEED;
  const left = clamp(stimulusPosition - distance, 0, 1);
  const right = clamp(stimulusPosition + distance, 0, 1);
  if (stimulusPosition <= 0.15) return [right];
  if (stimulusPosition >= 0.85) return [left];
  return [left, right];
}

export function getSimulationSnapshot(
  time: number,
  settings: ExperimentSettings,
): SimulationSnapshot {
  const propagating = settings.intensity !== "weak" && time >= 1;
  const arrivalTime =
    settings.intensity === "weak"
      ? 0
      : getArrivalTime(settings.stimulusPosition, settings.electrodePosition);
  const recordsLocalPotential =
    Math.abs(settings.electrodePosition - settings.stimulusPosition) <= 0.08;
  const localTime =
    settings.intensity === "weak"
      ? recordsLocalPotential
        ? time
        : -1
      : time - arrivalTime + 1;
  const stage = getStage(localTime, settings.intensity);

  return {
    stage,
    ionFlow: getIonFlow(stage),
    membranePotential: getMembranePotential(localTime, settings.intensity),
    propagating,
    wavefronts: propagating ? getWavefronts(time, settings.stimulusPosition) : [],
    arrivalTime,
    localTime,
  };
}
