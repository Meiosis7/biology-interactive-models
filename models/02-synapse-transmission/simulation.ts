import type {
  SynapseSettings,
  SynapseSnapshot,
  SynapseStage,
} from "./types";

export const SYNAPSE_DURATION = 9;

function getStage(time: number, settings: SynapseSettings): SynapseStage {
  if (time < 1) return "resting";
  if (time < 2) return "arrival";
  if (settings.condition === "calcium-blocked") return "calcium-entry";
  if (time < 3) return "calcium-entry";
  if (time < 4) return "vesicle-fusion";
  if (time < 5) return "transmitter-release";
  if (settings.condition === "receptor-blocked") return "receptor-binding";
  if (time < 6) return "receptor-binding";
  if (time < 7) return "postsynaptic-response";
  if (time < (settings.condition === "clearance-inhibited" ? 9 : 8)) {
    return "clearance";
  }
  return "resting";
}

export function getSynapseSnapshot(
  time: number,
  settings: SynapseSettings,
): SynapseSnapshot {
  if (settings.stimulation === "postsynaptic-reverse") {
    const stimulationActive = time >= 1 && time < 3;

    return {
      stage: time < 1 ? "resting" : "reverse-stimulation",
      calciumEntering: false,
      vesiclesFusing: false,
      transmitterReleased: false,
      receptorsActive: false,
      postsynapticMv: stimulationActive ? -60 : -70,
      transmitterLevel: 0,
      presynapticActivated: false,
      postsynapticStimulated: stimulationActive,
      reverseSignalBlocked: time >= 1,
    };
  }

  const stage = getStage(time, settings);
  const calciumEntering =
    stage === "calcium-entry" && settings.condition !== "calcium-blocked";
  const vesiclesFusing =
    stage === "vesicle-fusion" && settings.condition !== "calcium-blocked";
  const transmissionEndsAt =
    settings.condition === "clearance-inhibited" ? 9 : 8;
  const transmitterReleased =
    time >= 4 && time < transmissionEndsAt && settings.condition !== "calcium-blocked";
  const receptorsActive =
    time >= 5 &&
    transmitterReleased &&
    settings.condition !== "receptor-blocked";
  const postsynapticResponding = time >= 6 && receptorsActive;

  return {
    stage,
    calciumEntering,
    vesiclesFusing,
    transmitterReleased,
    receptorsActive,
    postsynapticMv: postsynapticResponding
      ? settings.kind === "excitatory"
        ? -60
        : -80
      : -70,
    transmitterLevel: transmitterReleased ? 1 : 0,
    presynapticActivated: stage !== "resting",
    postsynapticStimulated: false,
    reverseSignalBlocked: false,
  };
}
