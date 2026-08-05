"use client";

import type { MeterSettings, MeterSnapshot } from "./types";

export interface NerveElectrodeViewProps {
  settings: MeterSettings;
  snapshot: MeterSnapshot;
  onPositionChange: (field: "stimulusPosition" | "electrodeA" | "electrodeB", value: number) => void;
}

const positionName = {
  stimulusPosition: "刺激点位置",
  electrodeA: "A 电极位置",
  electrodeB: "B 电极位置",
} as const;

function point(position: number) {
  return 34 + position * 2.92;
}

export function NerveElectrodeView({ settings, snapshot, onPositionChange }: NerveElectrodeViewProps) {
  const transmembrane = settings.mode === "transmembrane";
  return (
    <section className="meter-nerve-card" aria-label="神经与电极示意图">
      <header>
        <span>神经纤维与电极</span>
        <strong>{transmembrane ? "跨膜记录：A 在膜内，B 为膜外参考" : "双侧细胞外记录：A、B 均在膜外"}</strong>
      </header>
      <svg viewBox="0 0 360 160" role="img" aria-label={`刺激点 ${settings.stimulusPosition}，A 电极 ${settings.electrodeA}，B 电极 ${settings.electrodeB}。`}>
        <defs><linearGradient id="nerve-fill" x1="0" x2="1"><stop stopColor="#1f5a78" /><stop offset=".5" stopColor="#3fbed1" /><stop offset="1" stopColor="#1f5a78" /></linearGradient></defs>
        <line className="nerve-axis" x1="28" y1="85" x2="332" y2="85" />
        <rect className="nerve-fiber" x="28" y="68" width="304" height="34" rx="17" fill="url(#nerve-fill)" />
        {snapshot.wavefronts.filter((wavefront) => wavefront >= 0 && wavefront <= 100).map((wavefront, index) => <circle className="wavefront" key={index} cx={point(wavefront)} cy="85" r="15" />)}
        <g className="stimulus"><line x1={point(settings.stimulusPosition)} y1="35" x2={point(settings.stimulusPosition)} y2="68" /><path d={`M ${point(settings.stimulusPosition) - 8} 37 l 8 -14 l 8 14 z`} /><text x={point(settings.stimulusPosition)} y="17">刺激</text></g>
        <g className="electrode electrode-a"><line x1={point(settings.electrodeA)} y1={transmembrane ? "128" : "116"} x2={point(settings.electrodeA)} y2={transmembrane ? "85" : "101"} /><circle cx={point(settings.electrodeA)} cy={transmembrane ? "83" : "103"} r="5" /><text x={point(settings.electrodeA)} y="151">A{transmembrane ? "（膜内）" : "（膜外）"}</text></g>
        <g className="electrode electrode-b"><line x1={point(settings.electrodeB)} y1="42" x2={point(settings.electrodeB)} y2="68" /><circle cx={point(settings.electrodeB)} cy="66" r="5" /><text x={point(settings.electrodeB)} y="151">B（膜外）</text></g>
      </svg>
      <div className="meter-position-controls">
        {(Object.keys(positionName) as Array<keyof typeof positionName>).map((field) => (
          <label key={field}>
            <span>{positionName[field]}</span>
            <input aria-label={positionName[field]} type="range" min="0" max="100" step="1" value={settings[field]} onChange={(event) => onPositionChange(field, Number(event.target.value))} />
            <output>{settings[field]} 格</output>
          </label>
        ))}
      </div>
    </section>
  );
}
