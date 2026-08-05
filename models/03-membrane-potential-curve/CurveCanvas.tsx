"use client";

import { useEffect, useRef } from "react";
import { getCurveSnapshot } from "./simulation";
import type { CurveIntensity, CurveSnapshot } from "./types";

const DURATION = 6;
const PADDING = { top: 22, right: 20, bottom: 38, left: 68 };

export interface CurveCanvasProps {
  time: number;
  intensity: CurveIntensity;
  snapshot: CurveSnapshot;
  compare: boolean;
  showLabels: boolean;
  showThreshold: boolean;
}

const CURVE_STYLE: Record<CurveIntensity, { color: string; dash: number[]; label: string }> = {
  weak: { color: "#b798ff", dash: [8, 5], label: "弱刺激（局部电位）" },
  threshold: { color: "#ff8b6c", dash: [], label: "阈刺激" },
  strong: { color: "#3de0d1", dash: [2, 5], label: "强刺激" },
};

function stageLabel(stage: CurveSnapshot["stage"]) {
  return ({
    resting: "静息",
    local: "局部电位",
    threshold: "阈电位",
    depolarization: "去极化",
    peak: "反极化",
    repolarization: "复极化",
    recovery: "恢复",
  })[stage];
}

function getStageInterval(
  time: number,
  intensity: CurveIntensity,
  stage: CurveSnapshot["stage"],
): [number, number] {
  if (intensity === "weak") {
    if (stage === "local") return [1, 4];
    return time < 1 ? [0, 1] : [4, DURATION];
  }

  switch (stage) {
    case "threshold": return [1, 2];
    case "depolarization": return [2, 3];
    case "peak": return [3, 4];
    case "repolarization": return [4, 5];
    case "recovery": return [5, 6];
    case "resting": return time < 1 ? [0, 1] : [6, DURATION];
    default: return [0, DURATION];
  }
}

export function CurveCanvas({
  time,
  intensity,
  snapshot,
  compare,
  showLabels,
  showThreshold,
}: CurveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const width = canvas.clientWidth || 700;
      const height = canvas.clientHeight || 330;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const plotWidth = width - PADDING.left - PADDING.right;
      const plotHeight = height - PADDING.top - PADDING.bottom;
      const x = (value: number) => PADDING.left + (value / DURATION) * plotWidth;
      const y = (mv: number) => PADDING.top + ((35 - mv) / 125) * plotHeight;

      context.font = "12px sans-serif";
      [-70, -55, 0, 30].forEach((mv) => {
        if (mv === -55 && !showThreshold) return;
        context.beginPath();
        context.strokeStyle = mv === -55 ? "rgba(255, 211, 107, .52)" : "rgba(187, 213, 231, .18)";
        context.lineWidth = 1;
        context.setLineDash?.(mv === -55 && showThreshold ? [5, 4] : []);
        context.moveTo(PADDING.left, y(mv));
        context.lineTo(width - PADDING.right, y(mv));
        context.stroke();
        context.setLineDash?.([]);
        context.fillStyle = "#a9bfd0";
        context.fillText(`${mv > 0 ? "+" : ""}${mv} mV`, 8, y(mv) + 4);
      });

      const [stageStart, stageEnd] = getStageInterval(time, intensity, snapshot.stage);
      context.fillStyle = "rgba(61, 224, 209, .13)";
      context.fillRect(x(stageStart), PADDING.top, x(stageEnd) - x(stageStart), plotHeight);

      const intensities: CurveIntensity[] = compare ? ["weak", "threshold", "strong"] : [intensity];
      intensities.forEach((curveIntensity) => {
        const style = CURVE_STYLE[curveIntensity];
        context.beginPath();
        for (let index = 0; index <= 180; index += 1) {
          const pointTime = (DURATION * index) / 180;
          const point = getCurveSnapshot(pointTime, curveIntensity);
          if (index === 0) context.moveTo(x(pointTime), y(point.mv));
          else context.lineTo(x(pointTime), y(point.mv));
        }
        context.strokeStyle = style.color;
        context.lineWidth = curveIntensity === intensity ? 3.2 : 2.2;
        context.setLineDash?.(style.dash);
        context.stroke();
        context.setLineDash?.([]);
      });

      context.beginPath();
      context.strokeStyle = "#f5fbff";
      context.lineWidth = 1.5;
      context.moveTo(x(time), PADDING.top);
      context.lineTo(x(time), height - PADDING.bottom);
      context.stroke();
      context.beginPath();
      context.fillStyle = "#f5fbff";
      context.arc?.(x(time), y(snapshot.mv), 5, 0, Math.PI * 2);
      context.fill?.();

      if (showLabels) {
        context.fillStyle = "#f5fbff";
        context.fillText(`当前：${stageLabel(snapshot.stage)}`, Math.min(x(time) + 8, width - 110), PADDING.top + 15);
      }
      [0, 1, 2, 3, 4, 5, 6].forEach((tick) => {
        context.fillStyle = "#a9bfd0";
        context.fillText(String(tick), x(tick) - 3, height - 12);
      });
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [compare, intensity, showLabels, showThreshold, snapshot, time]);

  const legendIntensities: CurveIntensity[] = compare ? ["weak", "threshold", "strong"] : [intensity];
  return (
    <figure className="membrane-curve-card">
      <figcaption>
        <span>膜电位变化曲线</span>
        <strong>{snapshot.mv.toFixed(0)} mV</strong>
      </figcaption>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`膜电位曲线，当前处于${stageLabel(snapshot.stage)}，膜电位${snapshot.mv.toFixed(0)} mV。`}
      />
      <div className="membrane-legend" aria-label="曲线图例">
        {legendIntensities.map((curveIntensity) => (
          <span key={curveIntensity}><i style={{ borderTopColor: CURVE_STYLE[curveIntensity].color, borderTopStyle: CURVE_STYLE[curveIntensity].dash.length ? "dashed" : "solid" }} />{CURVE_STYLE[curveIntensity].label}</span>
        ))}
      </div>
      <p>横轴：教学时间单位。曲线为典型示意，不表示所有神经元完全相同。</p>
    </figure>
  );
}
