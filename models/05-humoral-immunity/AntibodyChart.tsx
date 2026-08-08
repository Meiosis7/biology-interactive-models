"use client";

import { getHumoralSnapshot, HUMORAL_DURATION } from "./simulation";
import type { HumoralSettings, HumoralSnapshot } from "./types";

export interface AntibodyChartProps {
  settings: HumoralSettings;
  snapshot: HumoralSnapshot;
  time: number;
}

const width = 620;
const height = 280;
const inset = { left: 58, right: 20, top: 24, bottom: 42 };
const plotWidth = width - inset.left - inset.right;
const plotHeight = height - inset.top - inset.bottom;
const x = (value: number) => inset.left + value / HUMORAL_DURATION * plotWidth;
const y = (value: number) => inset.top + (200 - value) / 200 * plotHeight;

function makeCurve(settings: HumoralSettings, field: "antibodyLevel" | "antigenLevel") {
  return Array.from({ length: 145 }, (_, index) => {
    const chartTime = HUMORAL_DURATION * index / 144;
    const value = getHumoralSnapshot(chartTime, settings)[field];
    return `${index === 0 ? "M" : "L"}${x(chartTime).toFixed(1)},${y(value).toFixed(1)}`;
  }).join(" ");
}

export function AntibodyChart({ settings, snapshot, time }: AntibodyChartProps) {
  const recognitionLimited =
    settings.condition === "normal" && !snapshot.bCellMatched;
  const experimentallyBlocked = settings.condition !== "normal";
  const matchedSecondary =
    settings.exposure === "secondary" &&
    snapshot.memoryMatched &&
    !recognitionLimited &&
    !experimentallyBlocked;
  const primaryComparison: HumoralSettings = {
    ...settings,
    exposure: "primary",
  };
  const antibodyCurve = makeCurve(settings, "antibodyLevel");
  const antigenCurve = makeCurve(settings, "antigenLevel");
  const primaryCurve = matchedSecondary ? makeCurve(primaryComparison, "antibodyLevel") : null;
  const chartSummary = recognitionLimited
    ? "BCR 与抗原不匹配，抗体保持 0，抗原不下降。"
    : experimentallyBlocked
      ? "所选干预阻断下游抗体产生，抗体保持 0，抗原不下降。"
      : matchedSecondary
        ? "同一抗原的二次反应调用记忆 B 细胞，曲线显示更快、更强、更持久；虚线保留初次反应作对照。"
        : "抗体升高后特异性结合当前抗原，抗原相对量随之下降。";

  return (
    <figure className="humoral-chart-card" aria-labelledby="humoral-chart-title">
      <figcaption id="humoral-chart-title"><span>抗体与抗原的相对变化</span><strong>教学时间 {time.toFixed(1)}</strong></figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`当前抗体相对量 ${snapshot.antibodyLevel}，抗原相对量 ${snapshot.antigenLevel}`}>
        {[0, 50, 100, 150, 200].map((value) => <g key={value}><line className="humoral-chart-grid" x1={inset.left} x2={width - inset.right} y1={y(value)} y2={y(value)} /><text className="humoral-chart-label" x="8" y={y(value) + 4}>{value}</text></g>)}
        {[0, 3, 6, 9, 12, 15, 18].map((value) => <text className="humoral-chart-label" key={value} x={x(value) - 4} y={height - 14}>{value}</text>)}
        {primaryCurve && <path className="humoral-chart-curve humoral-primary-comparison" d={primaryCurve} />}
        <path className="humoral-chart-curve humoral-antibody-curve" d={antibodyCurve} />
        <path className="humoral-chart-curve humoral-antigen-curve" d={antigenCurve} />
        <line className="humoral-chart-cursor" x1={x(time)} x2={x(time)} y1={inset.top} y2={height - inset.bottom} />
        <circle className="humoral-chart-point antibody" cx={x(time)} cy={y(snapshot.antibodyLevel)} r="4" />
        <circle className="humoral-chart-point antigen" cx={x(time)} cy={y(snapshot.antigenLevel)} r="4" />
      </svg>
      <div className="humoral-chart-legend">
        <span><i className="antibody" />抗体（相对量）</span>
        <span><i className="antigen" />抗原 {settings.antigen}（相对量）</span>
        {matchedSecondary && <span><i className="primary" />初次反应（对照虚线）</span>}
      </div>
      <p>{chartSummary} 时间与浓度均为教学示意，并非临床检测数值。</p>
    </figure>
  );
}
