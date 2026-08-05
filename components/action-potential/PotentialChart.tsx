import { useEffect, useRef } from "react";
import { DURATION, getSimulationSnapshot } from "./simulation";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface PotentialChartProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}

const MIN_MV = -90;
const MAX_MV = 40;

export function PotentialChart({ time, settings, snapshot }: PotentialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const padding = { top: 18, right: 18, bottom: 28, left: 48 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const x = (seconds: number) => padding.left + (seconds / DURATION) * plotWidth;
      const y = (mv: number) => padding.top + ((MAX_MV - mv) / (MAX_MV - MIN_MV)) * plotHeight;

      context.font = "12px sans-serif";
      [-70, -55, 0, 30].forEach((mv) => {
        context.beginPath();
        context.strokeStyle = mv === -55 ? "rgba(255,209,102,.55)" : "rgba(169,204,230,.18)";
        context.moveTo(padding.left, y(mv));
        context.lineTo(width - padding.right, y(mv));
        context.stroke();
        context.fillStyle = "#9bb3c9";
        context.fillText(`${mv} mV`, 4, y(mv) + 4);
      });

      context.beginPath();
      for (let sample = 0; sample <= DURATION; sample += 0.025) {
        const mv = getSimulationSnapshot(sample, settings).membranePotential;
        if (sample === 0) context.moveTo(x(sample), y(mv));
        else context.lineTo(x(sample), y(mv));
      }
      context.strokeStyle = "#ff6b4a";
      context.lineWidth = 3;
      context.stroke();

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
  }, [settings, time]);

  return (
    <section className="chart-card">
      <div className="chart-reading">
        <span>记录点膜电位</span>
        <strong>{Math.round(snapshot.membranePotential)} mV</strong>
      </div>
      <canvas ref={canvasRef} aria-label="膜电位曲线" role="img" />
    </section>
  );
}
