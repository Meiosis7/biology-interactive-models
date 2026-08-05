export type AntigenType = "A" | "B";

export type HumoralCondition =
  | "normal"
  | "presentation-blocked"
  | "helper-t-blocked"
  | "b-cell-missing";

export type HumoralStage =
  | "entry"
  | "presentation"
  | "helper-activation"
  | "b-activation"
  | "clonal-expansion"
  | "differentiation"
  | "antibody-release"
  | "clearance"
  | "memory";

export interface HumoralSettings {
  antigen: AntigenType;
  exposure: "primary" | "secondary";
  memoryAntigen?: AntigenType;
  condition: HumoralCondition;
}

export interface HumoralSnapshot {
  stage: HumoralStage;
  blockedAt: HumoralStage | null;
  helperActive: boolean;
  bCellActive: boolean;
  plasmaCount: number;
  memoryCount: number;
  antibodyLevel: number;
  antigenLevel: number;
  memoryMatched: boolean;
  antibodyTarget: AntigenType | null;
}
