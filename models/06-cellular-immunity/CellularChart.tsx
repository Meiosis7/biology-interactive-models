"use client";

import { CELLULAR_DURATION, getCellularSnapshot } from "./simulation";
import type { CellularSettings, CellularSnapshot } from "./types";

export interface CellularChartProps { settings: CellularSettings; snapshot: CellularSnapshot; time: number; }

const width = 560;
const height = 278;
const pad = { left: 44, right: 18, top: 24, bottom: 34 };
const chartWidth = width - pad.left - pad.right;
const chartHeight = height - pad.top - pad.bottom;

function x(value: number) { return pad.left + value / CELLULAR_DURATION * chartWidth; }
function y(value: number) { return pad.top + (100 - value) / 100 * chartHeight; }
function makePath(values: number[]) { return values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)} ${y(value)}`).join(" "); }

export function CellularChart({ settings, snapshot, time }: CellularChartProps) {
  const samples = Array.from({ length: CELLULAR_DURATION + 1 }, (_, value) => getCellularSnapshot(value, settings));
  const effector = samples.map((item) => item.effectorCount);
  const target = samples.map((item) => item.targetCount * 100);
  const showPrimary = settings.exposure === "secondary" && snapshot.memoryMatched && settings.condition === "normal";
  const primarySettings = { ...settings, exposure: "primary" as const, memorySpecificity: undefined };
  const primary = Array.from({ length: CELLULAR_DURATION + 1 }, (_, value) => getCellularSnapshot(value, primarySettings).effectorCount);

  return <figure className="cellular-chart-card" aria-labelledby="cellular-chart-title">
    <figcaption><div><p className="cellular-kicker">效应与靶细胞变化</p><h2 id="cellular-chart-title">效应 T 细胞与靶细胞相对数量</h2></div><strong>{showPrimary ? "记忆匹配：更快、更强的应答" : "同步教学时间轴"}</strong></figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="效应细胞增殖与靶细胞数量变化曲线">
      {[0, 25, 50, 75, 100].map((value) => <g key={value}><line className="cellular-chart-grid" x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} /><text className="cellular-chart-label" x={pad.left - 8} y={y(value) + 4} textAnchor="end">{value}</text></g>)}
      {[0, 4, 8, 12, 16].map((value) => <text className="cellular-chart-label" key={value} x={x(value)} y={height - 12} textAnchor="middle">{value}</text>)}
      {showPrimary && <path className="cellular-primary-comparison" d={makePath(primary)} />}
      <path className="cellular-effector-curve" d={makePath(effector)} />
      <path className="cellular-target-curve" d={makePath(target)} />
      <line className="cellular-chart-cursor" x1={x(time)} x2={x(time)} y1={pad.top} y2={height - pad.bottom} />
      <circle className="cellular-chart-point effector" cx={x(time)} cy={y(snapshot.effectorCount)} r="4" />
      <circle className="cellular-chart-point target" cx={x(time)} cy={y(snapshot.targetCount * 100)} r="4" />
      <text className="cellular-chart-label" x={width / 2} y={height - 2} textAnchor="middle">教学时间</text>
    </svg>
    <div className="cellular-chart-legend"><span><i className="effector" />效应 T 细胞</span><span><i className="target" />靶细胞</span>{showPrimary && <span><i className="primary" />初次反应（对照虚线）</span>}</div>
    <p>{snapshot.blockedAt ? "所选干预使过程停在相应环节，下游效应细胞与靶细胞状态保持不变。" : "曲线为教学相对量；光标与流程场景共用同一时间，暂停后共同冻结。"}</p>
  </figure>;
}
