export type TargetType = "infected-a" | "infected-b" | "normal";

export type AntigenSpecificity = "A" | "B";

export type CellularCondition =
  | "normal"
  | "presentation-blocked"
  | "helper-t-blocked"
  | "cytotoxic-t-missing"
  | "marker-mismatch";

export type CellularStage =
  | "presentation"
  | "helper-activation"
  | "cytotoxic-activation"
  | "clonal-expansion"
  | "target-recognition"
  | "target-lysis"
  | "memory";

export interface CellularSettings {
  target: TargetType;
  tCellSpecificity: AntigenSpecificity;
  exposure: "primary" | "secondary";
  memorySpecificity?: AntigenSpecificity;
  condition: CellularCondition;
}

export interface CellularSnapshot {
  stage: CellularStage;
  blockedAt: CellularStage | null;
  helperActive: boolean;
  cytotoxicActive: boolean;
  effectorCount: number;
  targetCount: number;
  targetRecognized: boolean;
  targetLysed: boolean;
  memoryCount: number;
  memoryMatched: boolean;
}
