import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  onElectrodeChange: (position: number) => void;
}

export function AxonView({ snapshot, settings, onElectrodeChange }: AxonViewProps) {
  return (
    <section>
      <p>神经纤维视图：{snapshot.stage}</p>
      <input aria-label="记录电极位置" type="range" min="0" max="1" step="0.01" value={settings.electrodePosition} onChange={(event) => onElectrodeChange(Number(event.target.value))} />
    </section>
  );
}
