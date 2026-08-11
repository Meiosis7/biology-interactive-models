export type ActionPotentialMode = "resting" | "generation" | "conduction";

export type ActionPotentialPhase =
  | "resting"
  | "stimulus"
  | "sodium-channel-opening"
  | "sodium-in"
  | "excited"
  | "local-current"
  | "neighbor-sodium-in"
  | "neighbor-excited"
  | "conducted";

export type SegmentPolarity = "resting" | "excited";
export type LocalCurrentStep = 1 | 2 | 3 | null;
export type ConductionStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MembraneSegmentFrame {
  id: number;
  polarity: SegmentPolarity;
  sodiumChannelOpen: boolean;
  sodiumInflux: boolean;
  currentTarget: boolean;
}

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  segments: readonly MembraneSegmentFrame[];
  potassiumChannelOpen: boolean;
  potassiumOutflow: boolean;
  stimulusVisible: boolean;
  localCurrentStep: LocalCurrentStep;
  instruction: string;
}

export interface ModeContent {
  id: ActionPotentialMode;
  label: string;
  title: string;
  summary: string;
  facts: readonly [
    { label: string; value: string },
    { label: string; value: string },
    { label: string; value: string },
  ];
}
