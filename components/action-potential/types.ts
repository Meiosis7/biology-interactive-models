export type ActionPotentialMode = "resting" | "generation" | "conduction";

export type ActionPotentialPhase =
  | "resting"
  | "sodium-in"
  | "polarity-reversed"
  | "potassium-out"
  | "recovered"
  | "conducting";

export type IonMotion = "potassium-out" | "sodium-in" | "none";
export type MembranePolarity = "outside-positive" | "inside-positive";

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  ionMotion: IonMotion;
  polarity: MembranePolarity;
  excitedCenters: readonly [number, number];
  localCurrentVisible: boolean;
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
