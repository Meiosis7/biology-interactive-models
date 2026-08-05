export type SynapseKind = "excitatory" | "inhibitory";

export type SynapseStimulation = "presynaptic" | "postsynaptic-reverse";

export type SynapseCondition =
  | "normal"
  | "calcium-blocked"
  | "receptor-blocked"
  | "clearance-inhibited";

export type SynapseStage =
  | "resting"
  | "arrival"
  | "calcium-entry"
  | "vesicle-fusion"
  | "transmitter-release"
  | "receptor-binding"
  | "postsynaptic-response"
  | "clearance"
  | "reverse-stimulation";

export interface SynapseSettings {
  kind: SynapseKind;
  condition: SynapseCondition;
  stimulation?: SynapseStimulation;
}

export interface SynapseSnapshot {
  stage: SynapseStage;
  calciumEntering: boolean;
  vesiclesFusing: boolean;
  transmitterReleased: boolean;
  receptorsActive: boolean;
  postsynapticMv: number;
  transmitterLevel: number;
  presynapticActivated: boolean;
  postsynapticStimulated: boolean;
  reverseSignalBlocked: boolean;
}
