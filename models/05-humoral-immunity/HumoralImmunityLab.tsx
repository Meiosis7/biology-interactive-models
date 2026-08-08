"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AntibodyChart } from "./AntibodyChart";
import { HumoralProcessView } from "./HumoralProcessView";
import { getHumoralSnapshot, HUMORAL_DURATION } from "./simulation";
import type { AntigenType, BCellSpecificity, HumoralCondition, HumoralSettings, HumoralStage } from "./types";

const INITIAL_SETTINGS: HumoralSettings = {
  antigen: "A",
  bCellSpecificity: "A",
  exposure: "primary",
  memorySpecificity: "A",
  condition: "normal",
};

const CONDITIONS: Array<[HumoralCondition, string]> = [
  ["normal", "正常流程"],
  ["presentation-blocked", "抗原呈递受阻"],
  ["helper-t-blocked", "辅助性 T 细胞受阻"],
  ["b-cell-missing", "缺少 B 细胞"],
];

const STAGE_TITLES: Record<HumoralStage, string> = {
  presentation: "抗原呈递",
  "helper-activation": "辅助性 T 细胞活化",
  "b-activation": "B 细胞活化",
  "clonal-expansion": "克隆增殖",
  differentiation: "分化",
  "antibody-binding": "抗体产生与结合",
  memory: "免疫记忆",
};

const STAGE_COPY: Record<HumoralStage, { what: string; recognition: string; result: string }> = {
  presentation: {
    what: "部分病原体可直接接触 B 细胞并提供第一信号；另一些病原体由抗原呈递细胞摄取。",
    recognition: "树突状细胞、B 细胞等抗原呈递细胞摄取并处理抗原，再将处理后的抗原呈递给辅助性 T 细胞。",
    result: "辅助性 T 细胞获得活化信息，B 细胞也可通过匹配的 BCR 建立第一信号。",
  },
  "helper-activation": {
    what: "辅助性 T 细胞识别呈递抗原后活化，开始增殖、分化并分泌细胞因子。",
    recognition: "辅助性 T 细胞读取抗原呈递细胞展示的特异性抗原信息。",
    result: "活化的辅助性 T 细胞接触 B 细胞并提供第二信号，细胞因子促进后续应答。",
  },
  "b-activation": {
    what: "BCR 与抗原接触建立第一信号，活化的辅助性 T 细胞接触 B 细胞并提供第二信号。",
    recognition: "BCR 必须与当前抗原特异性匹配，辅助性 T 细胞同时提供协同帮助。",
    result: "只有同时获得第一、第二信号，B 细胞才会活化并进入增殖、分化阶段。",
  },
  "clonal-expansion": {
    what: "获得两个信号的 B 细胞开始克隆增殖，细胞因子促进这一过程。",
    recognition: "同一特异性的 B 细胞被选择性扩增，后代保留相同 BCR。",
    result: "形成许多具有相同抗原特异性的 B 细胞后代。",
  },
  differentiation: {
    what: "B 细胞后代在细胞因子促进下，大部分分化为浆细胞，少部分成为记忆 B 细胞。",
    recognition: "浆细胞和记忆 B 细胞都保留对当前抗原的特异性。",
    result: "浆细胞准备分泌抗体，记忆 B 细胞为再次应答保留特异性。",
  },
  "antibody-binding": {
    what: "浆细胞将抗体分泌到体液中，抗体随体液到达相应抗原。",
    recognition: "抗体的结合位点与当前抗原特异性匹配。",
    result: "抗体与病原体结合后可抑制病原体增殖或对人体细胞的黏附。",
  },
  memory: {
    what: "本次应答留下少部分记忆 B 细胞。",
    recognition: "记忆 B 细胞仍特异识别原抗原。",
    result: "同种抗原再次进入时可更快、更强、更持久地应答。",
  },
};

const BLOCKED_COPY: Record<Exclude<HumoralCondition, "normal">, { what: string; recognition: string; result: string }> = {
  "presentation-blocked": { what: "抗原呈递环节被阻断。", recognition: "缺少被处理并呈递给辅助性 T 细胞的抗原信息。", result: "辅助性 T 细胞不能被有效活化，后续 B 细胞应答不能充分发生。" },
  "helper-t-blocked": { what: "辅助性 T 细胞的帮助环节被阻断。", recognition: "缺少辅助性 T 细胞的激活信号。", result: "B 细胞不能充分活化，不能克隆增殖、分化或产生足量抗体。" },
  "b-cell-missing": { what: "B 细胞活化环节被阻断。", recognition: "没有执行特异性应答的 B 细胞。", result: "即使有辅助性 T 细胞信号，也不产生特异性抗体和记忆 B 细胞。" },
};

function clamp(value: number) {
  return Math.max(0, Math.min(HUMORAL_DURATION, value));
}

export function HumoralImmunityLab() {
  const [settings, setSettings] = useState<HumoralSettings>(INITIAL_SETTINGS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(() => getHumoralSnapshot(time, settings), [settings, time]);
  const mismatchConfigured = snapshot.stopReason === "bcr-mismatch";
  const mismatchReached = mismatchConfigured && snapshot.stopReached;
  const interventionReason =
    snapshot.stopReason !== "bcr-mismatch" ? snapshot.stopReason : null;
  const mismatchCopy = {
    what: "当前 B 细胞存在，但它的受体与抗原特异性不一致。",
    recognition: `BCR ${settings.bCellSpecificity} 只能特异识别抗原 ${settings.bCellSpecificity}。`,
    result: "不能有效活化，不形成浆细胞、特异性抗体或新的记忆 B 细胞。",
  };
  const copy = mismatchReached
    ? mismatchCopy
    : interventionReason
      ? BLOCKED_COPY[interventionReason]
      : STAGE_COPY[snapshot.stage];
  const explanationTitle = mismatchReached
    ? "未匹配"
    : interventionReason
      ? "过程受阻"
      : STAGE_TITLES[snapshot.stage];
  const announcedStage = mismatchReached
    ? `未匹配：${STAGE_TITLES[snapshot.stage]}`
    : interventionReason
      ? `过程受阻：${STAGE_TITLES[snapshot.stage]}`
      : STAGE_TITLES[snapshot.stage];

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + (now - previous) / 1000 * speed);
        if (next >= HUMORAL_DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); lastFrame.current = null; };
  }, [playing, speed]);

  const changeSettings = (patch: Partial<HumoralSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };
  const changeTime = (value: number) => { setPlaying(false); setTime(clamp(value)); };
  const changeSpeed = (next: 0.5 | 1 | 2) => { setPlaying(false); setSpeed(next); };
  const stopStageTitle = snapshot.stopAt
    ? STAGE_TITLES[snapshot.stopAt]
    : STAGE_TITLES[snapshot.stage];
  const exposureText = mismatchConfigured
    ? mismatchReached
      ? `BCR 未匹配：流程已在 ${stopStageTitle}阶段停止`
      : `流程将在 ${stopStageTitle}阶段检验 BCR 与抗原是否匹配`
    : interventionReason
      ? `实验干预：${CONDITIONS.find(([condition]) => condition === interventionReason)?.[1]}`
      : settings.exposure === "secondary" && snapshot.memoryMatched
        ? "同种抗原二次免疫：记忆匹配"
        : settings.exposure === "secondary"
          ? "二次进入但记忆不匹配：按初次反应"
          : "初次免疫：建立记忆";

  return (
    <main className="humoral-shell" aria-labelledby="humoral-title">
      <header className="humoral-header">
        <p className="humoral-eyebrow">选择性必修 1 · 免疫调节</p>
        <h1 id="humoral-title">体液免疫流程实验台</h1>
        <p>选择抗原、免疫次数和受阻环节，沿同一教学时间轴观察抗原呈递、B 细胞应答、抗体特异性结合与免疫记忆。</p>
      </header>

      <p className="humoral-sr-only" aria-label={`阶段播报：${announcedStage}`} aria-live="polite" aria-atomic="true">
        当前阶段：{announcedStage}
      </p>

      <section className="humoral-grid">
        <HumoralProcessView settings={settings} snapshot={snapshot} playing={playing} />
        <AntibodyChart settings={settings} snapshot={snapshot} time={time} />
        <section className="humoral-explanation" aria-label="当前阶段解释">
          <p className="humoral-kicker">当前阶段解释</p>
          <h2>{explanationTitle}</h2>
          <dl><div><dt>发生了什么</dt><dd>{copy.what}</dd></div><div><dt>为什么能识别</dt><dd>{copy.recognition}</dd></div><div><dt>结果是什么</dt><dd>{copy.result}</dd></div></dl>
        </section>
        <p className="humoral-live-values">当前：浆细胞 {snapshot.plasmaCount}，记忆 B 细胞 {snapshot.memoryCount}，抗体相对量 {snapshot.antibodyLevel}，抗原相对量 {snapshot.antigenLevel}。</p>
      </section>

      <section className="humoral-controls" aria-label="实验控制台">
        <div className="humoral-control-groups">
          <fieldset><legend>抗原类型</legend><div className="humoral-button-row">{(["A", "B"] as AntigenType[]).map((antigen) => <button className="humoral-button" key={antigen} aria-pressed={settings.antigen === antigen} onClick={() => changeSettings({ antigen })}>抗原 {antigen}</button>)}</div></fieldset>
          <fieldset><legend>B 细胞受体</legend><div className="humoral-button-row">{(["A", "B"] as BCellSpecificity[]).map((value) => <button className="humoral-button" key={value} aria-pressed={settings.bCellSpecificity === value} onClick={() => changeSettings({ bCellSpecificity: value })}>BCR {value}</button>)}</div></fieldset>
          <fieldset><legend>暴露次数</legend><div className="humoral-button-row"><button className="humoral-button" aria-pressed={settings.exposure === "primary"} onClick={() => changeSettings({ exposure: "primary" })}>初次免疫</button><button className="humoral-button" aria-pressed={settings.exposure === "secondary"} onClick={() => changeSettings({ exposure: "secondary" })}>二次免疫</button></div></fieldset>
          <fieldset><legend>既往记忆特异性</legend><div className="humoral-button-row">{(["A", "B"] as AntigenType[]).map((value) => <button className="humoral-button" key={value} aria-pressed={settings.memorySpecificity === value} onClick={() => changeSettings({ memorySpecificity: value })}>记忆 {value}</button>)}</div></fieldset>
          <fieldset><legend>实验干预</legend><div className="humoral-button-row">{CONDITIONS.map(([condition, label]) => <button className="humoral-button" key={condition} aria-pressed={settings.condition === condition} onClick={() => changeSettings({ condition })}>{label}</button>)}</div></fieldset>
        </div>
        <p className="humoral-setting-status">{exposureText}。切换任一条件都会暂停并归零本次演示。</p>
        <label className="humoral-timeline"><span>教学时间</span><input aria-label="教学时间" aria-valuetext={`${time.toFixed(1)} 时间单位`} type="range" min="0" max={HUMORAL_DURATION} step="0.1" value={time} onChange={(event) => changeTime(Number(event.target.value))} /><output>{time.toFixed(1)} 时间单位</output></label>
        <div className="humoral-button-row humoral-transport">
          <button className="humoral-button primary" onClick={() => { setTime(0); setPlaying(true); }}>开始演示</button>
          <button className="humoral-button" onClick={() => { if (time >= HUMORAL_DURATION) setTime(0); setPlaying((current) => !current); }}>{playing ? "暂停" : "播放"}</button>
          <button className="humoral-button" disabled={time <= 0} onClick={() => changeTime(time - 0.5)}>上一步</button>
          <button className="humoral-button" disabled={time >= HUMORAL_DURATION} onClick={() => changeTime(time + 0.5)}>下一步</button>
          {([0.5, 1, 2] as const).map((value) => <button className="humoral-button" key={value} aria-pressed={speed === value} onClick={() => changeSpeed(value)}>{value === 0.5 ? "慢速" : value === 1 ? "正常" : "快速"}</button>)}
          <button className="humoral-button" onClick={() => { setPlaying(false); setTime(0); setSettings(INITIAL_SETTINGS); }}>重置</button>
        </div>
        <p className="humoral-note">时间、浓度和细胞数量均为教学示意，用于比较过程和因果关系，不表示临床数值或真实细胞计数。</p>
      </section>
    </main>
  );
}
