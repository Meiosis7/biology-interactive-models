"use client";

import type { CurveSnapshot } from "./types";

export interface MembraneViewProps {
  snapshot: CurveSnapshot;
  playing: boolean;
  showIonHint: boolean;
}

const FLOW_COPY = {
  none: "当前没有主要离子跨膜流动",
  "sodium-in": "Na⁺由膜外流向膜内",
  "potassium-out": "K⁺由膜内流向膜外",
} as const;

export function MembraneView({ snapshot, playing, showIonHint }: MembraneViewProps) {
  const ion = snapshot.ionFlow === "sodium-in" ? "Na⁺" : snapshot.ionFlow === "potassium-out" ? "K⁺" : "";
  const isMoving = playing && snapshot.ionFlow !== "none";
  return (
    <section className="membrane-view-card" aria-label="膜局部剖面">
      <header><span>膜局部剖面</span><strong>膜内相对{snapshot.insidePolarity === "positive" ? "正" : "负"}</strong></header>
      <div className="membrane-cross-section">
        <div className="membrane-side membrane-outside"><span>膜外</span><b>{snapshot.insidePolarity === "positive" ? "−" : "+"}</b></div>
        <div className="membrane-barrier">
          <div className={`membrane-channel sodium ${snapshot.sodiumOpen ? "open" : ""}`}>Na⁺ 通道</div>
          <div className={`membrane-channel potassium ${snapshot.potassiumOpen ? "open" : ""}`}>K⁺ 通道</div>
          {showIonHint && ion && <span className={`membrane-ion ${isMoving ? "moving" : ""} ${snapshot.ionFlow}`}>{ion} {snapshot.ionFlow === "sodium-in" ? "↓" : "↑"}</span>}
        </div>
        <div className="membrane-side membrane-inside"><span>膜内</span><b>{snapshot.insidePolarity === "positive" ? "+" : "−"}</b></div>
      </div>
      {showIonHint && <p><span>离子提示：{snapshot.ionFlow === "sodium-in" ? "Na⁺ 内流" : snapshot.ionFlow === "potassium-out" ? "K⁺ 外流" : FLOW_COPY.none}</span>。{FLOW_COPY[snapshot.ionFlow]}{playing ? "；动画播放中。" : "；已暂停，离子图示保持静止。"}</p>}
    </section>
  );
}
