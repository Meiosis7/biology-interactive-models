"use client";

import type { AntigenSpecificity, CellularSettings, CellularSnapshot, CellularStage, TargetType } from "./types";

export interface CellularProcessViewProps {
  settings: CellularSettings;
  snapshot: CellularSnapshot;
  playing: boolean;
}

const PROCESS: Array<{ stage: CellularStage; label: string; shortLabel: string }> = [
  { stage: "presentation", label: "抗原呈递", shortLabel: "呈递" },
  { stage: "helper-activation", label: "辅助性 T 细胞活化", shortLabel: "辅助 T" },
  { stage: "cytotoxic-activation", label: "细胞毒性 T 细胞活化", shortLabel: "杀伤 T" },
  { stage: "clonal-expansion", label: "克隆增殖", shortLabel: "增殖" },
  { stage: "target-recognition", label: "特异性识别靶细胞", shortLabel: "识别" },
  { stage: "target-lysis", label: "靶细胞裂解", shortLabel: "裂解" },
  { stage: "memory", label: "保留免疫记忆", shortLabel: "记忆" },
];

const ORDER = PROCESS.map((item) => item.stage);

function TargetMark({ target }: { target: TargetType }) {
  if (target === "normal") {
    return <span className="cellular-target target-normal" aria-label="正常细胞：方形，无病毒抗原标志" role="img"><b>正常细胞</b><small>方形 · 无抗原</small></span>;
  }
  const marker = target === "infected-a" ? "A" : "B";
  const shape = marker === "A" ? "圆形" : "菱形";
  return <span className={`cellular-target target-infected target-${marker}`} aria-label={`感染细胞 ${marker}：${shape}，抗原 ${marker} 标志`} role="img"><i aria-hidden="true">抗原 {marker}</i><b>感染细胞 {marker}</b><small>{shape} · 感染靶细胞</small></span>;
}

function ReceptorMark({ specificity }: { specificity: AntigenSpecificity }) {
  return <span className={`cellular-receptor receptor-${specificity}`} aria-label={`细胞毒性 T 细胞受体：特异识别抗原 ${specificity}`}>TCR {specificity}</span>;
}

export function CellularProcessView({ settings, snapshot, playing }: CellularProcessViewProps) {
  const currentIndex = ORDER.indexOf(snapshot.stage);
  const blockedIndex = snapshot.blockedAt ? ORDER.indexOf(snapshot.blockedAt) : -1;
  const matched = snapshot.targetRecognized || snapshot.targetLysed;
  const separated = !matched;
  const targetLabel = settings.target === "normal" ? "正常细胞" : settings.target === "infected-a" ? "感染细胞 A" : "感染细胞 B";

  return (
    <section className="cellular-process-card" aria-labelledby="cellular-process-title">
      <header>
        <div><p className="cellular-kicker">细胞免疫反应流程</p><h2 id="cellular-process-title">从活化到靶细胞裂解</h2></div>
        <span className="cellular-stage-readout">当前：{PROCESS[currentIndex]?.label}</span>
      </header>

      <div className="cellular-process-spine" aria-label="细胞免疫有序流程">
        {PROCESS.map((item, index) => {
          const blocked = snapshot.blockedAt === item.stage;
          const disabled = blockedIndex >= 0 && index > blockedIndex;
          return <div className={`cellular-process-step ${index === currentIndex ? "is-current" : ""} ${index < currentIndex ? "is-past" : ""} ${blocked ? "is-blocked" : ""} ${disabled ? "is-disabled" : ""}`} key={item.stage}>
            <span className="cellular-step-number">{index + 1}</span><strong>{item.label}</strong>{blocked && <em>受阻</em>}
          </div>;
        })}
      </div>

      <div className={`cellular-process-scene ${playing ? "is-playing" : "is-paused"}`} aria-label="细胞毒性 T 细胞与靶细胞相互作用示意">
        <div className={`cellular-helper ${snapshot.helperActive ? "is-active" : ""}`}><b>辅助性 T 细胞</b><small>{snapshot.helperActive ? "提供活化信号" : "等待呈递信息"}</small></div>
        <div className={`cellular-cytotoxic ${snapshot.cytotoxicActive ? "is-active" : ""} ${snapshot.blockedAt === "cytotoxic-activation" ? "is-blocked" : ""}`}><b>细胞毒性 T 细胞</b><ReceptorMark specificity={settings.tCellSpecificity} /><small>{snapshot.cytotoxicActive ? "已获得杀伤功能" : "尚未活化"}</small></div>
        <div className="cellular-clone-zone" aria-label={`效应细胞克隆数 ${snapshot.effectorCount}`}><b>克隆增殖</b><div>{[0, 1, 2, 3, 4, 5].map((cell) => <i className={snapshot.effectorCount > cell * 8 ? "is-visible" : ""} key={cell}>T</i>)}</div><small>效应 T 细胞 {snapshot.effectorCount}</small></div>
        <div className={`cellular-contact-zone ${separated ? "is-separated" : "is-contact"} ${snapshot.targetLysed ? "is-lysed" : ""}`}>
          <div className="cellular-effector-token"><ReceptorMark specificity={settings.tCellSpecificity} /><small>细胞毒性 T</small></div>
          <span className="cellular-contact-line" aria-hidden="true" />
          <TargetMark target={settings.target} />
          <small className="cellular-contact-status">{snapshot.targetLysed ? `${targetLabel} 已裂解` : matched ? "受体—抗原匹配，形成接触" : "保持距离，未形成有效接触"}</small>
        </div>
      </div>

      <p className="cellular-process-note">
        {snapshot.targetLysed
          ? "匹配的细胞毒性 T 细胞使感染靶细胞裂解；它不直接吞噬病毒，抗原清除还需要其他免疫步骤参与。"
          : settings.condition === "marker-mismatch"
            ? "受体与展示标志不匹配，停留在识别阶段；不能形成有效接触或裂解。"
            : separated
              ? "该靶细胞不能特异性识别，因此不裂解；正常细胞或携带不同抗原的感染细胞保持分离。"
              : "受体与靶细胞展示的抗原标志匹配，细胞毒性 T 细胞正在执行特异性杀伤。"}
      </p>
    </section>
  );
}
