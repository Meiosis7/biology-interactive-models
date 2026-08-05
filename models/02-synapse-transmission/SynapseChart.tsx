import { useEffect, useRef } from "react";
import { SYNAPSE_DURATION, getSynapseSnapshot } from "./simulation";
import type { SynapseSettings, SynapseSnapshot } from "./types";

export interface SynapseChartProps {
  time: number;
  settings: SynapseSettings;
  snapshot: SynapseSnapshot;
}

export function SynapseChart({ time, settings, snapshot }: SynapseChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth || 640;
      const height = canvas.clientHeight || 260;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const padding = { top: 20, right: 22, bottom: 42, left: 75 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const x = (value: number) => padding.left + (value / SYNAPSE_DURATION) * plotWidth;
      const y = (mv: number) => padding.top + ((-45 - mv) / 45) * plotHeight;
      context.font = "12px sans-serif";
      context.beginPath();
      context.strokeStyle = "rgba(169,204,230,.38)";
      context.lineWidth = 1;
      context.moveTo(padding.left, y(-70));
      context.lineTo(width - padding.right, y(-70));
      context.stroke();
      context.fillStyle = "#9bb3c9";
      context.fillText("基线 −70 mV", 4, y(-70) + 4);
      context.beginPath();
      for (let index = 0; index <= 180; index += 1) {
        const teachingTime = (SYNAPSE_DURATION * index) / 180;
        const mv = getSynapseSnapshot(teachingTime, settings).postsynapticMv;
        if (index === 0) context.moveTo(x(teachingTime), y(mv));
        else context.lineTo(x(teachingTime), y(mv));
      }
      context.strokeStyle = settings.kind === "excitatory" ? "#ff6b4a" : "#aa7cff";
      context.lineWidth = 3;
      context.stroke();
      context.beginPath();
      context.strokeStyle = "#38d9ff";
      context.lineWidth = 1.5;
      context.moveTo(x(time), padding.top);
      context.lineTo(x(time), height - padding.bottom);
      context.stroke();
      [0, 3, 6, 9].forEach((tick) => {
        context.fillStyle = "#9bb3c9";
        context.fillText(String(tick), x(tick) - 3, height - 12);
      });
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [settings, time]);

  return (
    <figure className="synapse-chart-card">
      <figcaption><span>突触后膜电位</span><strong>{snapshot.postsynapticMv} mV</strong></figcaption>
      <canvas ref={canvasRef} role="img" aria-label={`突触后膜电位曲线，以 −70 mV 为基线；当前电位为 ${snapshot.postsynapticMv} mV。`} />
      <p>横轴：教学时间（时间单位）</p>
    </figure>
  );
}
