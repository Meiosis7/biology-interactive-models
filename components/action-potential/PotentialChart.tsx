import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface PotentialChartProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}

export function PotentialChart({ snapshot }: PotentialChartProps) {
  return <section>膜电位曲线：{Math.round(snapshot.membranePotential)} mV</section>;
}
