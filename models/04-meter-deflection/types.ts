/** Teaching-time span for one propagation demonstration. */
export const METER_DURATION = 10;

export type RecordingMode = "extracellular" | "transmembrane" | "equidistant";

export interface MeterSettings {
  mode: RecordingMode;
  stimulusPosition: number;
  electrodeA: number;
  electrodeB: number;
  leadsReversed: boolean;
}

export type MeterStage =
  | "resting"
  | "approaching-a"
  | "approaching-b"
  | "at-a"
  | "between"
  | "at-b"
  | "passed"
  | "simultaneous";

export interface MeterSnapshot {
  stage: MeterStage;
  voltageA: number;
  voltageB: number;
  differenceMv: number;
  pointerAngle: number;
  arrivalA: number;
  arrivalB: number;
  wavefronts: number[];
}
