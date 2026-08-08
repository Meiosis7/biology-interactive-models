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
  const blockedIndex = snapshot.stopAt ? ORDER.indexOf(snapshot.stopAt) : -1;
  const isPast = (stage: HumoralStage) => ORDER.indexOf(stage) < currentIndex;
  const mismatchConfigured = snapshot.stopReason === "bcr-mismatch";
  const mismatchReached = mismatchConfigured && snapshot.stopReached;
  const interventionReason =
    snapshot.stopReason !== "bcr-mismatch" ? snapshot.stopReason : null;
  const antibodyActive = snapshot.antibodyTarget === settings.antigen;
  const helperStatus =
    interventionReason === "presentation-blocked"
      ? "抗原呈递受阻，未获得处理后的抗原信息"
      : interventionReason === "helper-t-blocked"
        ? "帮助环节受阻，不能提供第二信号"
        : interventionReason === "b-cell-missing"
          ? "缺少可接触并接收第二信号的 B 细胞"
        : snapshot.helperActive
          ? "已活化并增殖、分化；接触 B 细胞提供第二信号并分泌细胞因子"
          : "等待树突状细胞、B 细胞等呈递处理后的抗原";
  const bCellStatus = mismatchReached
    ? "BCR 与抗原不匹配，第一信号未建立"
    : snapshot.bCellActive
      ? "获得两个信号，B 细胞已活化"
      : interventionReason === "helper-t-blocked"
        ? "辅助性 T 细胞的第二信号被阻断，B 细胞不能完成活化"
        : interventionReason === "presentation-blocked"
          ? "抗原呈递受阻；等待完整活化信号"
          : mismatchConfigured
            ? "等待 BCR 接触抗原并检验第一信号"
            : "BCR 接触抗原，获得第一信号；等待辅助性 T 细胞的第二信号";

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
          const unmatched =
            mismatchReached && snapshot.stopAt === item.stage;
          const blocked =
            interventionReason !== null && snapshot.stopAt === item.stage;
          const disabled = blockedIndex >= 0 && nodeIndex > blockedIndex;
          const active = nodeIndex === currentIndex;
          return (
            <div className={`humoral-process-step ${active ? "is-current" : ""} ${isPast(item.stage) ? "is-past" : ""} ${blocked ? "is-blocked" : ""} ${unmatched ? "is-unmatched" : ""} ${disabled ? "is-disabled" : ""}`} key={item.stage}>
              <span className="humoral-step-number">{index + 1}</span>
              <strong>{item.label}</strong>
              {(blocked || unmatched) && <em>{unmatched ? "未匹配" : "受阻"}</em>}
            </div>
          );
        })}
      </div>

      <div
        className={`humoral-process-scene ${playing ? "is-playing" : "is-paused"}`}
        aria-label="B 细胞与抗原的体液免疫相互作用示意"
        role="group"
      >
        <div className="humoral-helper-zone">
          <div className={`humoral-cell helper-t ${snapshot.helperActive ? "is-active" : ""} ${interventionReason === "helper-t-blocked" ? "is-blocked" : ""}`}>
            <b>辅助性 T 细胞</b>
            <small>{helperStatus}</small>
          </div>
        </div>
        <div className="humoral-b-cell-zone">
          {interventionReason === "b-cell-missing" ? (
            <div className="humoral-cell b-cell-absence is-blocked">
              <b>B 细胞缺失</b>
              <small>没有细胞接收第一、第二信号或执行特异性应答</small>
            </div>
          ) : (
            <div className={`humoral-cell b-cell ${snapshot.bCellActive ? "is-active" : ""} ${mismatchReached ? "is-unmatched" : ""}`}>
              <b>B 细胞</b>
              <ReceptorMark specificity={settings.bCellSpecificity} />
              <small>{bCellStatus}</small>
            </div>
          )}
        </div>
        <div className="humoral-clone-differentiation-zone">
          <b>克隆与分化</b>
          <small>获得双信号后，多数成为浆细胞，少数成为记忆 B 细胞；细胞因子促进此过程</small>
          <div className="humoral-clone-tokens">
            {Array.from({ length: Math.min(6, Math.max(1, Math.ceil(snapshot.plasmaCount / 10))) }, (_, index) => (
              <i aria-hidden="true" className={`humoral-clone-token ${snapshot.plasmaCount > 0 ? "is-visible" : ""}`} key={index}>B</i>
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
            <i aria-hidden="true" className={`humoral-antibody ${antibodyActive ? "is-bound" : ""}`} key={index}>Y</i>
          ))}
          <small>
            {mismatchReached
              ? "BCR 与抗原不匹配，未产生特异性抗体"
              : interventionReason
                ? "所选干预使下游不能产生特异性抗体"
                : antibodyActive
                  ? `抗体进入体液并特异性结合抗原 ${settings.antigen}，抑制病原体增殖或黏附`
                  : snapshot.stage === "memory" && snapshot.stopReason === null
                    ? "抗体已完成特异性结合，抗原已清除"
                  : "浆细胞尚未向体液分泌特异性抗体"}
          </small>
        </div>
      </div>
      <p className="humoral-process-note">B 细胞需先后获得抗原接触的第一信号和辅助性 T 细胞接触的第二信号；抗原 A 用圆形、抗原 B 用三角形表示。暂停时细胞与抗体粒子保持静止。</p>
    </section>
  );
}
