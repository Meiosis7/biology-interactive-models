"use client";

import type { AntigenType, BCellSpecificity, HumoralSettings, HumoralSnapshot, HumoralStage } from "./types";

export interface HumoralProcessViewProps {
  settings: HumoralSettings;
  snapshot: HumoralSnapshot;
  playing: boolean;
}

const PROCESS: Array<{ stage: HumoralStage; label: string }> = [
  { stage: "presentation", label: "抗原呈递" },
  { stage: "helper-activation", label: "辅助性 T 细胞活化" },
  { stage: "b-activation", label: "B 细胞活化" },
  { stage: "clonal-expansion", label: "克隆增殖" },
  { stage: "differentiation", label: "分化" },
  { stage: "antibody-binding", label: "抗体产生与结合" },
  { stage: "memory", label: "免疫记忆" },
];

const ORDER = PROCESS.map((item) => item.stage);

function AntigenMark({ antigen, className = "" }: { antigen: AntigenType; className?: string }) {
  const shape = antigen === "A" ? "圆形标记" : "三角形标记";
  return <span className={`humoral-antigen-mark antigen-${antigen} ${className}`} aria-label={`抗原 ${antigen}：${shape}`} role="img">抗原 {antigen}</span>;
}

function ReceptorMark({ specificity }: { specificity: BCellSpecificity }) {
  return (
    <span
      className={`humoral-receptor receptor-${specificity}`}
      aria-label={`B 细胞受体：特异识别抗原 ${specificity}`}
    >
      BCR {specificity}
    </span>
  );
}

export function HumoralProcessView({ settings, snapshot, playing }: HumoralProcessViewProps) {
  const currentIndex = ORDER.indexOf(snapshot.stage);
  const blockedIndex = snapshot.blockedAt ? ORDER.indexOf(snapshot.blockedAt) : -1;
  const isPast = (stage: HumoralStage) => ORDER.indexOf(stage) < currentIndex;
  const antibodyActive = snapshot.antibodyTarget === settings.antigen && snapshot.bCellMatched;

  return (
    <section className="humoral-process-card" aria-labelledby="humoral-process-title">
      <header>
        <div>
          <p className="humoral-kicker">免疫反应流程</p>
          <h2 id="humoral-process-title">从识别到特异性清除</h2>
        </div>
        <span className="humoral-stage-readout">当前：{PROCESS.find((item) => item.stage === snapshot.stage)?.label ?? "抗原呈递"}</span>
      </header>

      <div className="humoral-process-spine" aria-label="体液免疫有序流程">
        {PROCESS.map((item, index) => {
          const nodeIndex = ORDER.indexOf(item.stage);
          const blocked = snapshot.blockedAt === item.stage;
          const disabled = blockedIndex >= 0 && nodeIndex > blockedIndex;
          const active = nodeIndex === currentIndex;
          return (
            <div className={`humoral-process-step ${active ? "is-current" : ""} ${isPast(item.stage) ? "is-past" : ""} ${blocked ? "is-blocked" : ""} ${disabled ? "is-disabled" : ""}`} key={item.stage}>
              <span className="humoral-step-number">{index + 1}</span>
              <strong>{item.label}</strong>
              {blocked && (
                <em>
                  {settings.condition === "normal" && !snapshot.bCellMatched
                    ? "未匹配"
                    : "受阻"}
                </em>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`humoral-process-scene ${playing ? "is-playing" : "is-paused"}`}
        aria-label="B 细胞与抗原的体液免疫相互作用示意"
      >
        <div className="humoral-helper-zone">
          <div className={`humoral-cell helper-t ${snapshot.helperActive ? "is-active" : ""} ${snapshot.blockedAt === "helper-activation" ? "is-blocked" : ""}`}>
            <b>辅助性 T 细胞</b>
            <small>{snapshot.helperActive ? "已活化，提供协同刺激" : "待活化"}</small>
          </div>
        </div>
        <div className="humoral-b-cell-zone">
          <div className={`humoral-cell b-cell ${snapshot.bCellActive ? "is-active" : ""} ${snapshot.blockedAt === "b-activation" ? "is-blocked" : ""}`}>
            <b>匹配 B 细胞</b>
            <ReceptorMark specificity={settings.bCellSpecificity} />
            <small>{snapshot.bCellMatched ? (snapshot.bCellActive ? "已活化" : "待活化") : "BCR 与抗原不匹配"}</small>
          </div>
        </div>
        <div className="humoral-clone-differentiation-zone">
          <b>克隆与分化</b>
          <div className="humoral-clone-tokens">
            {Array.from({ length: Math.min(6, Math.max(1, Math.ceil(snapshot.plasmaCount / 10))) }, (_, index) => (
              <i className={`humoral-clone-token ${snapshot.plasmaCount > 0 ? "is-visible" : ""}`} key={index}>B</i>
            ))}
          </div>
          <div className="humoral-plasma-zone">
            <span>浆细胞 {snapshot.plasmaCount}</span>
            <span>记忆 B 细胞 {snapshot.memoryCount}</span>
          </div>
        </div>
        <div className="humoral-binding-zone">
          <b>抗体—抗原结合</b>
          <AntigenMark antigen={settings.antigen} className="binding-antigen" />
          {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(snapshot.antibodyLevel / 25))) }, (_, index) => (
            <i className={`humoral-antibody ${antibodyActive ? "is-bound" : ""}`} key={index}>Y</i>
          ))}
          <small>{!snapshot.bCellMatched ? "BCR 与抗原不匹配，未产生特异性抗体" : antibodyActive ? `抗体只结合抗原 ${settings.antigen}` : "尚未产生特异性抗体"}</small>
        </div>
      </div>
      <p className="humoral-process-note">抗原 A 用圆形、抗原 B 用三角形表示；抗体结合的是匹配抗原，随后再由其他机制清除。暂停时细胞与抗体粒子保持静止。</p>
    </section>
  );
}
