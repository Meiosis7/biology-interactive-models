"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AntibodyChart } from "./AntibodyChart";
import { HumoralProcessView } from "./HumoralProcessView";
import { getHumoralSnapshot, HUMORAL_DURATION } from "./simulation";
import type { AntigenType, HumoralCondition, HumoralSettings, HumoralStage } from "./types";

const INITIAL_SETTINGS: HumoralSettings = { antigen: "A", exposure: "primary", memoryAntigen: "A", condition: "normal" };

const CONDITIONS: Array<[HumoralCondition, string]> = [
  ["normal", "正常流程"],
  ["presentation-blocked", "抗原呈递受阻"],
  ["helper-t-blocked", "辅助性 T 细胞受阻"],
  ["b-cell-missing", "匹配 B 细胞缺失"],
];

const STAGE_COPY: Record<HumoralStage, { title: string; recognition: string; cells: string; result: string; memory: string }> = {
  entry: { title: "抗原进入", recognition: "当前抗原进入体内。", cells: "抗原呈递细胞准备摄取抗原。", result: "尚未产生特异性抗体。", memory: "尚未形成新的记忆 B 细胞。" },
  presentation: { title: "抗原呈递", recognition: "抗原呈递细胞处理并展示抗原信息。", cells: "抗原呈递细胞、辅助性 T 细胞。", result: "为辅助性 T 细胞的特异性活化提供信息。", memory: "尚未形成新的记忆 B 细胞。" },
  "helper-activation": { title: "辅助性 T 细胞活化", recognition: "辅助性 T 细胞识别呈递的抗原信息。", cells: "辅助性 T 细胞。", result: "发出帮助匹配 B 细胞活化的信号。", memory: "尚未形成新的记忆 B 细胞。" },
  "b-activation": { title: "匹配 B 细胞活化", recognition: "只有能识别当前抗原的 B 细胞获得有效帮助。", cells: "匹配 B 细胞、辅助性 T 细胞。", result: "B 细胞进入克隆增殖准备阶段。", memory: "尚未形成新的记忆 B 细胞。" },
  "clonal-expansion": { title: "B 细胞克隆增殖", recognition: "同一特异性的 B 细胞被选择性扩增。", cells: "活化的匹配 B 细胞。", result: "产生许多相同特异性的细胞后代。", memory: "部分后代将成为记忆 B 细胞。" },
  differentiation: { title: "分化形成效应细胞与记忆细胞", recognition: "后代保留对当前抗原的特异性。", cells: "B 细胞后代、浆细胞、记忆 B 细胞。", result: "浆细胞准备大量分泌抗体。", memory: "记忆 B 细胞形成，为同种抗原再次进入做好准备。" },
  "antibody-release": { title: "浆细胞产生抗体", recognition: "抗体的结合位点与当前抗原匹配。", cells: "浆细胞。", result: "分泌特异性抗体，与抗原结合。", memory: "记忆 B 细胞并不持续大量分泌抗体。" },
  clearance: { title: "抗体结合后促进清除", recognition: "抗体只结合相应的抗原 A 或 B。", cells: "抗体、其他清除机制。", result: "抗原被标记或形成复合物，随后被进一步清除。", memory: "保留当前抗原的记忆 B 细胞。" },
  memory: { title: "保留免疫记忆", recognition: "记忆 B 细胞仍特异识别原抗原。", cells: "记忆 B 细胞。", result: "本次抗体相对量已下降。", memory: "同种抗原再次进入时，可更快、更强、更持久地应答。" },
};

const BLOCKED_COPY: Record<Exclude<HumoralCondition, "normal">, { title: string; cause: string; result: string }> = {
  "presentation-blocked": { title: "抗原呈递受阻", cause: "缺少被处理并呈递给辅助性 T 细胞的抗原信息。", result: "辅助性 T 细胞不能被有效活化，B 细胞无法获得帮助；因此不发生充分增殖、浆细胞分化或抗体产生。" },
  "helper-t-blocked": { title: "辅助性 T 细胞受阻", cause: "缺少辅助性 T 细胞的激活信号。", result: "B 细胞不能充分活化，不能克隆增殖和分化为浆细胞；因此没有足量特异性抗体，也不形成有效记忆。" },
  "b-cell-missing": { title: "匹配 B 细胞缺失", cause: "缺少能识别当前抗原的匹配 B 细胞。", result: "即使有辅助性 T 细胞信号，也没有 B 细胞可以增殖分化；因此不产生特异性抗体和记忆 B 细胞。" },
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
  const stageCopy = STAGE_COPY[snapshot.stage];
  const blockedCopy = settings.condition === "normal" ? null : BLOCKED_COPY[settings.condition];

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
  const exposureText = settings.exposure === "secondary" && snapshot.memoryMatched ? "同种抗原二次免疫：记忆匹配" : settings.exposure === "secondary" ? "二次进入但记忆不匹配：按初次反应" : "初次免疫：建立记忆";

  return (
    <main className="humoral-shell" aria-labelledby="humoral-title">
      <header className="humoral-header">
        <p className="humoral-eyebrow">选择性必修 1 · 免疫调节</p>
        <h1 id="humoral-title">体液免疫流程实验台</h1>
        <p>选择抗原、免疫次数和受阻环节，沿同一教学时间轴观察抗原呈递、B 细胞应答、抗体特异性结合与免疫记忆。</p>
      </header>

      <section className="humoral-grid">
        <HumoralProcessView settings={settings} snapshot={snapshot} playing={playing} />
        <AntibodyChart settings={settings} snapshot={snapshot} time={time} />
        <section className="humoral-explanation" aria-live="polite" aria-label="当前阶段解释">
          <p className="humoral-kicker">当前阶段解释</p>
          <h2>{blockedCopy?.title ?? stageCopy.title}</h2>
          {blockedCopy ? <dl><div><dt>缺少什么</dt><dd>{blockedCopy.cause}</dd></div><div><dt>下游结果</dt><dd>{blockedCopy.result}</dd></div></dl> : <dl><div><dt>识别对象</dt><dd>{stageCopy.recognition}</dd></div><div><dt>参与细胞</dt><dd>{stageCopy.cells}</dd></div><div><dt>产生结果</dt><dd>{stageCopy.result}</dd></div><div><dt>形成记忆</dt><dd>{stageCopy.memory}</dd></div></dl>}
          <p className="humoral-live-values">当前：浆细胞 {snapshot.plasmaCount}，记忆 B 细胞 {snapshot.memoryCount}，抗体相对量 {snapshot.antibodyLevel}，抗原相对量 {snapshot.antigenLevel}。</p>
        </section>
      </section>

      <section className="humoral-controls" aria-label="实验控制台">
        <div className="humoral-control-groups">
          <fieldset><legend>抗原类型</legend><div className="humoral-button-row">{(["A", "B"] as AntigenType[]).map((antigen) => <button className="humoral-button" key={antigen} aria-pressed={settings.antigen === antigen} onClick={() => changeSettings({ antigen })}>抗原 {antigen}</button>)}</div></fieldset>
          <fieldset><legend>暴露次数</legend><div className="humoral-button-row"><button className="humoral-button" aria-pressed={settings.exposure === "primary"} onClick={() => changeSettings({ exposure: "primary" })}>初次免疫</button><button className="humoral-button" aria-pressed={settings.exposure === "secondary"} onClick={() => changeSettings({ exposure: "secondary" })}>二次免疫</button></div></fieldset>
          <fieldset><legend>既往记忆抗原</legend><div className="humoral-button-row">{(["A", "B"] as AntigenType[]).map((antigen) => <button className="humoral-button" key={antigen} aria-pressed={settings.memoryAntigen === antigen} onClick={() => changeSettings({ memoryAntigen: antigen })}>记忆抗原 {antigen}</button>)}</div></fieldset>
          <fieldset><legend>实验干预</legend><div className="humoral-button-row">{CONDITIONS.map(([condition, label]) => <button className="humoral-button" key={condition} aria-pressed={settings.condition === condition} onClick={() => changeSettings({ condition })}>{label}</button>)}</div></fieldset>
        </div>
        <p className="humoral-setting-status">{exposureText}。切换抗原、暴露次数、记忆来源或干预条件会停止并归零本次演示。</p>
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
