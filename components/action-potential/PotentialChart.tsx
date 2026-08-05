import { useEffect, useRef } from "react";
import { getSimulationSnapshot } from "./simulation";
import { STAGE_COPY } from "./StageExplanation";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface PotentialChartProps {
  time: number;
  duration: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}

const MIN_MV = -90;
const MAX_MV = 40;
const SAMPLE_COUNT = 400;

function formatTeachingTime(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function PotentialChart({
  time,
  duration,
  settings,
  snapshot,
}: PotentialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageTitle = STAGE_COPY[snapshot.stage].title;
  const accessibleSummary = [
    "膜电位曲线。",
    "阈电位参考为 −55 mV。",
    `横轴为教学时间，共 ${formatTeachingTime(duration)} 个时间单位。`,
    "纵轴为记录点膜电位。",
    `当前阶段为${stageTitle}，记录点膜电位为 ${Math.round(snapshot.membranePotential)} mV。`,
  ].join("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawChart = () => {
      const width = canvas.clientWidth || 640;
      const height = canvas.clientHeight || 235;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const padding = { top: 18, right: 18, bottom: 42, left: 88 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const x = (teachingTime: number) => (
        padding.left + (teachingTime / duration) * plotWidth
      );
      const y = (mv: number) => (
        padding.top + ((MAX_MV - mv) / (MAX_MV - MIN_MV)) * plotHeight
      );

      context.font = "12px sans-serif";
      [-70, -55, 0, 30].forEach((mv) => {
        context.beginPath();
        context.strokeStyle = mv === -55
          ? "rgba(255,209,102,.55)"
          : "rgba(169,204,230,.18)";
        context.moveTo(padding.left, y(mv));
        context.lineTo(width - padding.right, y(mv));
        context.stroke();
        context.fillStyle = mv === -55 ? "#ffd166" : "#9bb3c9";
        context.fillText(mv === -55 ? "阈电位 −55 mV" : `${mv} mV`, 4, y(mv) + 4);
      });

      context.beginPath();
      for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
        const sample = (duration * index) / SAMPLE_COUNT;
        const mv = getSimulationSnapshot(sample, settings).membranePotential;
        if (index === 0) context.moveTo(x(sample), y(mv));
        else context.lineTo(x(sample), y(mv));
      }
      context.strokeStyle = "#ff6b4a";
      context.lineWidth = 3;
      context.stroke();

      [0, duration / 2, duration].forEach((tick) => {
        const tickX = x(tick);
        context.beginPath();
        context.strokeStyle = "rgba(169,204,230,.32)";
        context.lineWidth = 1;
        context.moveTo(tickX, height - padding.bottom);
        context.lineTo(tickX, height - padding.bottom + 5);
        context.stroke();
        context.fillStyle = "#9bb3c9";
        context.fillText(
          formatTeachingTime(tick),
          Math.min(width - 30, Math.max(4, tickX - 8)),
          height - 12,
        );
      });

      context.beginPath();
      context.strokeStyle = "#38d9ff";
      context.lineWidth = 1.5;
      context.moveTo(x(time), padding.top);
      context.lineTo(x(time), height - padding.bottom);
      context.stroke();
    };

    drawChart();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(drawChart);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [duration, settings, time]);

  return (
    <figure className="chart-card">
      <figcaption className="chart-reading">
        <span>记录点膜电位</span>
        <strong>{Math.round(snapshot.membranePotential)} mV</strong>
      </figcaption>
      <p className="chart-stage">当前阶段：{stageTitle}</p>
      <canvas ref={canvasRef} aria-label={accessibleSummary} role="img" />
      <div className="chart-meta" aria-hidden="true">
        <span>横轴：教学时间（时间单位）</span>
        <span className="threshold-reference">阈电位参考：−55 mV</span>
      </div>
    </figure>
  );
}
