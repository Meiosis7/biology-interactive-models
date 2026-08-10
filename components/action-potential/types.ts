export type ActionPotentialMode = "resting" | "generation" | "conduction";

export type ActionPotentialPhase =
  | "resting"
  | "stimulus"
  | "sodium-in"
  | "excited"
  | "conducting";

export type IonMotion = "potassium-out" | "sodium-in" | "none";
export type MembranePolarity = "outside-positive" | "inside-positive";
export type OpenChannel = "potassium" | "sodium" | "none";

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  ionMotion: IonMotion;
  polarity: MembranePolarity;
  openChannel: OpenChannel;
  stimulusVisible: boolean;
  excitedCenters: readonly number[];
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
