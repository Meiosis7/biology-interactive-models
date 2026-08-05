"use client";

import type { AntigenType, HumoralSettings, HumoralSnapshot, HumoralStage } from "./types";

export interface HumoralProcessViewProps {
  settings: HumoralSettings;
  snapshot: HumoralSnapshot;
  playing: boolean;
}

const PROCESS: Array<{ stage: HumoralStage; label: string; shortLabel: string }> = [
  { stage: "presentation", label: "抗原呈递", shortLabel: "呈递" },
  { stage: "helper-activation", label: "辅助性 T 细胞活化", shortLabel: "T 细胞" },
  { stage: "b-activation", label: "匹配 B 细胞活化", shortLabel: "B 细胞" },
  { stage: "clonal-expansion", label: "B 细胞克隆增殖", shortLabel: "增殖" },
  { stage: "differentiation", label: "形成浆细胞和记忆 B 细胞", shortLabel: "分化" },
  { stage: "antibody-release", label: "浆细胞产生抗体", shortLabel: "抗体" },
  { stage: "clearance", label: "抗体结合并清除抗原", shortLabel: "清除" },
];

const ORDER: HumoralStage[] = [
  "entry",
  "presentation",
  "helper-activation",
  "b-activation",
  "clonal-expansion",
  "differentiation",
  "antibody-release",
  "clearance",
  "memory",
];

function AntigenMark({ antigen, className = "" }: { antigen: AntigenType; className?: string }) {
  const shape = antigen === "A" ? "圆形标记" : "三角形标记";
  return <span className={`humoral-antigen-mark antigen-${antigen} ${className}`} aria-label={`抗原 ${antigen}：${shape}`} role="img">抗原 {antigen}</span>;
}

export function HumoralProcessView({ settings, snapshot, playing }: HumoralProcessViewProps) {
  const currentIndex = ORDER.indexOf(snapshot.stage);
  const blockedIndex = snapshot.blockedAt ? ORDER.indexOf(snapshot.blockedAt) : -1;
  const isPast = (stage: HumoralStage) => ORDER.indexOf(stage) < currentIndex;
  const antibodyActive = snapshot.antibodyTarget === settings.antigen;

  return (
    <section className="humoral-process-card" aria-labelledby="humoral-process-title">
      <header>
        <div>
          <p className="humoral-kicker">免疫反应流程</p>
          <h2 id="humoral-process-title">从识别到特异性清除</h2>
        </div>
        <span className="humoral-stage-readout">当前：{PROCESS.find((item) => item.stage === snapshot.stage)?.label ?? "抗原进入"}</span>
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
              {blocked && <em>受阻</em>}
            </div>
          );
        })}
      </div>

      <div className="humoral-process-scene" role="img" aria-label={`当前抗原 ${settings.antigen}，${snapshot.blockedAt ? `流程受阻于${snapshot.blockedAt}` : "流程正常推进"}`}>
        <div className="humoral-antigen-zone">
          <AntigenMark antigen={settings.antigen} />
          <span>抗原进入</span>
        </div>
        <div className={`humoral-cell apc ${snapshot.blockedAt === "presentation" ? "is-blocked" : ""}`}><b>APC</b><small>呈递抗原</small></div>
        <div className={`humoral-cell helper-t ${snapshot.helperActive ? "is-active" : ""} ${snapshot.blockedAt === "helper-activation" ? "is-blocked" : ""}`}><b>辅助性 T</b><small>{snapshot.helperActive ? "已激活" : "待激活"}</small></div>
        <div className={`humoral-cell b-cell ${snapshot.bCellActive ? "is-active" : ""} ${snapshot.blockedAt === "b-activation" ? "is-blocked" : ""}`}><b>匹配 B</b><small>{snapshot.bCellActive ? "已活化" : "待活化"}</small></div>
        <div className="humoral-clone-zone">
          <span>克隆增殖</span>
          {Array.from({ length: Math.min(6, Math.max(1, Math.ceil(snapshot.plasmaCount / 10))) }, (_, index) => (
            <i className={playing && snapshot.plasmaCount > 0 ? "is-growing" : ""} key={index}>B</i>
          ))}
          <small>{snapshot.plasmaCount} 个浆细胞（相对数量）</small>
        </div>
        <div className="humoral-plasma-zone">
          <div className="humoral-cell plasma"><b>浆细胞</b><small>分泌抗体</small></div>
          <div className="humoral-memory"><b>记忆 B</b><small>{snapshot.memoryCount} 个</small></div>
        </div>
        <div className="humoral-binding-zone">
          <AntigenMark antigen={settings.antigen} className="binding-antigen" />
          {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(snapshot.antibodyLevel / 25))) }, (_, index) => (
            <i className={`humoral-antibody ${antibodyActive ? "is-bound" : ""} ${playing && antibodyActive ? "is-moving" : ""}`} key={index}>Y</i>
          ))}
          <small>{antibodyActive ? `抗体只结合抗原 ${settings.antigen}` : "尚无特异性抗体结合"}</small>
        </div>
      </div>
      <p className="humoral-process-note">抗原 A 用圆形、抗原 B 用三角形表示；抗体结合的是匹配抗原，随后再由其他机制清除。暂停时细胞与抗体粒子保持静止。</p>
    </section>
  );
}
