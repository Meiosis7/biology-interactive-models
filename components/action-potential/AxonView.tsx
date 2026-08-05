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

const CHANNELS = [
  { id: "sodium-left", ion: "sodium", left: 10 },
  { id: "potassium-left", ion: "potassium", left: 16 },
  { id: "sodium-middle", ion: "sodium", left: 50 },
  { id: "potassium-middle", ion: "potassium", left: 56 },
  { id: "potassium-right", ion: "potassium", left: 84 },
  { id: "sodium-right", ion: "sodium", left: 90 },
] as const;

const SODIUM_IONS = [
  { id: "sodium-left", left: 10, top: -44 },
  { id: "sodium-left-middle", left: 30, top: -66 },
  { id: "sodium-middle", left: 50, top: -44 },
  { id: "sodium-right-middle", left: 70, top: -66 },
  { id: "sodium-right", left: 90, top: -44 },
] as const;

const POTASSIUM_IONS = [
  { id: "potassium-left", left: 14, top: 32 },
  { id: "potassium-left-middle", left: 34, top: 54 },
  { id: "potassium-middle", left: 54, top: 32 },
  { id: "potassium-right-middle", left: 74, top: 54 },
  { id: "potassium-right", left: 86, top: 32 },
] as const;

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
          {CHANNELS.map((channel) => {
            const localSnapshot = snapshotAt(channel.left / 100);
            const sodiumChannel = channel.ion === "sodium";
            const open = sodiumChannel
              ? localSnapshot.ionFlow === "sodium-in"
              : localSnapshot.ionFlow === "potassium-out";
            return (
              <span
                key={channel.id}
                className={`channel ${sodiumChannel ? "sodium-channel" : "potassium-channel"} ${open ? "open" : "closed"}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${channel.left}%` }}
              />
            );
          })}
          {SODIUM_IONS.map((ion) => {
            const localSnapshot = snapshotAt(ion.left / 100);
            const sodiumActive = localSnapshot.ionFlow === "sodium-in";
            return (
              <span
                key={ion.id}
                className={`ion sodium ${playing && sodiumActive ? "moving-in" : ""}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${ion.left}%`, top: `${ion.top}px` } as CSSProperties}
              >Na⁺</span>
            );
          })}
          {POTASSIUM_IONS.map((ion) => {
            const localSnapshot = snapshotAt(ion.left / 100);
            const potassiumActive = localSnapshot.ionFlow === "potassium-out";
            return (
              <span
                key={ion.id}
                className={`ion potassium ${playing && potassiumActive ? "moving-out" : ""}`}
                data-stage={localSnapshot.stage}
                style={{ left: `${ion.left}%`, top: `${ion.top}px` } as CSSProperties}
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
