import type { CSSProperties } from "react";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  onElectrodeChange: (position: number) => void;
}

const CHANNELS = [12, 28, 44, 60, 76, 90];
const IONS = [18, 34, 50, 66, 82];

export function AxonView({ settings, snapshot, onElectrodeChange }: AxonViewProps) {
  const conditionLabel = settings.stimulusPosition <= 0.15
    ? "左侧刺激：兴奋主要向右传播"
    : settings.stimulusPosition >= 0.85
      ? "右侧刺激：兴奋主要向左传播"
      : "中部刺激：兴奋向两侧传播";
  const sodiumOpen = snapshot.ionFlow === "sodium-in";
  const potassiumOpen = snapshot.ionFlow === "potassium-out";

  return (
    <section className="axon-card" aria-labelledby="axon-title">
      <h2 id="axon-title" className="sr-only">神经纤维动态视图</h2>
      <p className="condition-note">{conditionLabel}</p>
      <div
        className="axon-stage"
        role="img"
        aria-label={`离体神经纤维，当前为${snapshot.stage}阶段，${conditionLabel}`}
      >
        <span className="membrane-label outside">膜外</span>
        <span className="membrane-label inside">膜内</span>
        <div className="axon-body">
          {snapshot.wavefronts.map((position, index) => (
            <span
              className="wavefront"
              key={`wavefront-${index}`}
              style={{ left: `${position * 100}%` }}
            />
          ))}
          <span
            className="stimulus-marker"
            style={{ left: `${settings.stimulusPosition * 100}%` }}
          >刺激点</span>
          <span
            className="electrode-marker"
            style={{ left: `${settings.electrodePosition * 100}%` }}
          >记录电极</span>
          {CHANNELS.map((left, index) => (
            <span
              key={`channel-${left}`}
              className={`channel ${index % 2 === 0 ? "sodium-channel" : "potassium-channel"} ${(index % 2 === 0 ? sodiumOpen : potassiumOpen) ? "open" : "closed"}`}
              style={{ left: `${left}%` }}
            />
          ))}
          {IONS.map((left, index) => (
            <span
              key={`sodium-${left}`}
              className={`ion sodium ${sodiumOpen ? "moving-in" : ""}`}
              style={{ left: `${left}%`, top: `${-44 - (index % 2) * 22}px` } as CSSProperties}
            >Na⁺</span>
          ))}
          {IONS.map((left, index) => (
            <span
              key={`potassium-${left}`}
              className={`ion potassium ${potassiumOpen ? "moving-out" : ""}`}
              style={{ left: `${left + 5}%`, top: `${32 + (index % 2) * 22}px` } as CSSProperties}
            >K⁺</span>
          ))}
        </div>
      </div>
      <label className="electrode-control">
        <span>拖动记录电极，改变膜电位记录位置</span>
        <input
          aria-label="记录电极位置"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.electrodePosition}
          onChange={(event) => onElectrodeChange(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
