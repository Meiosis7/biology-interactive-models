import type { CSSProperties } from "react";
import { getSimulationSnapshot } from "./simulation";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  playing: boolean;
  onElectrodeChange: (position: number) => void;
}

const CHANNELS = [12, 28, 44, 60, 76, 90];
const IONS = [18, 34, 50, 66, 82];

export function AxonView({
  time,
  settings,
  snapshot,
  playing,
  onElectrodeChange,
}: AxonViewProps) {
  const conditionLabel = settings.stimulusPosition <= 0.15
    ? "左侧刺激：兴奋向两侧传播，左侧先到达边界"
    : settings.stimulusPosition >= 0.85
      ? "右侧刺激：兴奋向两侧传播，右侧先到达边界"
      : "中部刺激：兴奋向两侧传播";
  const snapshotAt = (position: number) => getSimulationSnapshot(time, {
    ...settings,
    electrodePosition: position,
  });

  return (
    <section className="axon-card" aria-labelledby="axon-title">
      <h2 id="axon-title" className="sr-only">神经纤维动态视图</h2>
      <p className="condition-note">{conditionLabel}</p>
      <div
        className="axon-stage"
        role="img"
        aria-label={`离体神经纤维，记录电极当前为${snapshot.stage}阶段，${conditionLabel}`}
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
          {CHANNELS.map((left, index) => {
            const localSnapshot = snapshotAt(left / 100);
            const sodiumChannel = index % 2 === 0;
            const open = sodiumChannel
              ? localSnapshot.ionFlow === "sodium-in"
              : localSnapshot.ionFlow === "potassium-out";
            return (
              <span
                key={`channel-${left}`}
                className={`channel ${sodiumChannel ? "sodium-channel" : "potassium-channel"} ${open ? "open" : "closed"}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${left}%` }}
              />
            );
          })}
          {IONS.map((left, index) => {
            const localSnapshot = snapshotAt(left / 100);
            const sodiumActive = localSnapshot.ionFlow === "sodium-in";
            return (
              <span
                key={`sodium-${left}`}
                className={`ion sodium ${playing && sodiumActive ? "moving-in" : ""}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${left}%`, top: `${-44 - (index % 2) * 22}px` } as CSSProperties}
              >Na⁺</span>
            );
          })}
          {IONS.map((left, index) => {
            const position = (left + 5) / 100;
            const localSnapshot = snapshotAt(position);
            const potassiumActive = localSnapshot.ionFlow === "potassium-out";
            return (
              <span
                key={`potassium-${left}`}
                className={`ion potassium ${playing && potassiumActive ? "moving-out" : ""}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${left + 5}%`, top: `${32 + (index % 2) * 22}px` } as CSSProperties}
              >K⁺</span>
            );
          })}
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
