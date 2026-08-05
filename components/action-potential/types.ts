export type StimulusIntensity = "weak" | "threshold" | "strong";
export type ActionPotentialStage =
  | "resting"
  | "local"
  | "threshold"
  | "depolarization"
  | "peak"
  | "repolarization"
  | "recovery";
export type IonFlow = "none" | "sodium-in" | "potassium-out";

export interface ExperimentSettings {
  intensity: StimulusIntensity;
  stimulusPosition: number;
  electrodePosition: number;
}

export interface SimulationSnapshot {
  stage: ActionPotentialStage;
  ionFlow: IonFlow;
  membranePotential: number;
  propagating: boolean;
  wavefronts: number[];
  arrivalTime: number;
  localTime: number;
}
