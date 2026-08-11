export type AntigenType = "A" | "B";
export type BCellSpecificity = AntigenType;

export type HumoralCondition =
  | "normal"
  | "presentation-blocked"
  | "helper-t-blocked"
  | "b-cell-missing";

export type HumoralStage =
  | "presentation"
  | "helper-activation"
  | "b-activation"
  | "clonal-expansion"
  | "differentiation"
  | "antibody-binding"
  | "memory";

export type HumoralStopReason =
  | Exclude<HumoralCondition, "normal">
  | "bcr-mismatch";

export interface HumoralSettings {
  antigen: AntigenType;
  bCellSpecificity: BCellSpecificity;
  exposure: "primary" | "secondary";
  memorySpecificity: AntigenType;
  condition: HumoralCondition;
}

export interface HumoralSnapshot {
  stage: HumoralStage;
  stopAt: HumoralStage | null;
  blockedAt: HumoralStage | null;
  stopReason: HumoralStopReason | null;
  stopReached: boolean;
  helperActive: boolean;
  bCellActive: boolean;
  bCellMatched: boolean;
  plasmaCount: number;
  memoryCount: number;
  antibodyLevel: number;
  antigenLevel: number;
  memoryMatched: boolean;
  antibodyTarget: AntigenType | null;
}
