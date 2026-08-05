"use client";

import { getMeterSnapshot, METER_DURATION } from "./simulation";
import type { MeterSettings, MeterSnapshot } from "./types";

export interface ElectrodeChartProps {
  settings: MeterSettings;
  time: number;
  snapshot: MeterSnapshot;
}

const width = 540;
const height = 260;
const inset = { left: 47, right: 18, top: 20, bottom: 35 };
const chartWidth = width - inset.left - inset.right;
const chartHeight = height - inset.top - inset.bottom;
const x = (time: number) => inset.left + time / METER_DURATION * chartWidth;
const y = (mv: number) => inset.top + (35 - mv) / 110 * chartHeight;

function curve(settings: MeterSettings, key: "voltageA" | "voltageB" | "differenceMv") {
  return Array.from({ length: 101 }, (_, index) => {
    const pointTime = METER_DURATION * index / 100;
    const value = getMeterSnapshot(pointTime, settings)[key];
    return `${index === 0 ? "M" : "L"}${x(pointTime).toFixed(1)},${y(value).toFixed(1)}`;
  }).join(" ");
}

export function ElectrodeChart({ settings, time, snapshot }: ElectrodeChartProps) {
  const differenceLabel = settings.leadsReversed ? "V_B − V_A" : "V_A − V_B";
  const lines = [
    { key: "voltageA" as const, label: "V_A", color: "#6ee7df" },
    { key: "voltageB" as const, label: "V_B", color: "#ad98ff" },
    { key: "differenceMv" as const, label: differenceLabel, color: "#ff9c78" },
  ];
  return (
    <figure className="meter-chart-card">
      <figcaption><span>电极电位与差值</span><strong>时间游标 {time.toFixed(1)}</strong></figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`电位曲线，当前 A ${snapshot.voltageA.toFixed(0)} mV，B ${snapshot.voltageB.toFixed(0)} mV，电势差 ${snapshot.differenceMv.toFixed(0)} mV。`}>
        {[-70, -20, 0, 30].map((value) => <g key={value}><line className="chart-grid" x1={inset.left} x2={width - inset.right} y1={y(value)} y2={y(value)} /><text className="chart-label" x="5" y={y(value) + 4}>{value} mV</text></g>)}
        {[0, 2, 4, 6, 8, 10].map((value) => <text className="chart-label" key={value} x={x(value) - 3} y={height - 12}>{value}</text>)}
        {lines.map(({ key, color }) => <path key={key} className="chart-curve" d={curve(settings, key)} stroke={color} />)}
        <line className="chart-cursor" x1={x(time)} x2={x(time)} y1={inset.top} y2={height - inset.bottom} />
        <circle className="chart-point" cx={x(time)} cy={y(snapshot.differenceMv)} r="4" />
      </svg>
      <div className="meter-chart-legend">{lines.map(({ key, label, color }) => <span key={key}><i style={{ background: color }} />{label}</span>)}</div>
      <p>三条曲线共用同一教学时间轴；橙线：{differenceLabel} = {snapshot.differenceMv.toFixed(0)} mV，是检流计当前的输入差值。</p>
    </figure>
  );
}
