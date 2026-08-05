"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SYNAPSE_DURATION, getSynapseSnapshot } from "./simulation";
import { SynapseChart } from "./SynapseChart";
import { SynapseView } from "./SynapseView";
import type { SynapseCondition, SynapseKind, SynapseSettings, SynapseStimulation } from "./types";

const DEFAULT_SETTINGS: SynapseSettings = {
  kind: "excitatory",
  condition: "normal",
  stimulation: "presynaptic",
};

const STAGE_COPY = {
  resting: { title: "静息状态", event: "递质释放前", location: "突触前末梢与突触后膜", cause: "囊泡与受体尚未被激活。", result: "突触后膜维持约 −70 mV。" },
  arrival: { title: "兴奋抵达", event: "动作电位到达突触前末梢", location: "突触前膜", cause: "电信号传至轴突末梢。", result: "电压门控 Ca²⁺ 通道准备开放。" },
  "calcium-entry": { title: "Ca²⁺ 内流", event: "Ca²⁺ 通道开放", location: "突触前膜", cause: "去极化使电压门控通道开放。", result: "Ca²⁺ 进入突触前末梢。" },
  "vesicle-fusion": { title: "囊泡融合", event: "突触小泡靠近并融合", location: "突触前膜", cause: "Ca²⁺ 内流触发囊泡与膜融合。", result: "递质准备释放到突触间隙。" },
  "transmitter-release": { title: "递质释放", event: "神经递质扩散", location: "突触间隙", cause: "囊泡胞吐释放神经递质。", result: "递质向突触后膜移动。" },
  "receptor-binding": { title: "受体结合", event: "递质与特异性受体结合", location: "突触后膜", cause: "递质到达并识别受体。", result: "离子通道或信号通路被调节。" },
  "postsynaptic-response": { title: "突触后反应", event: "突触后膜电位改变", location: "突触后膜", cause: "受体被激活并改变离子通透性。", result: "兴奋性突触后膜电位升高；抑制性突触后膜电位降低。" },
  clearance: { title: "递质清除", event: "递质被清除或回收", location: "突触间隙", cause: "转运、降解等过程终止信号。", result: "突触后膜逐渐恢复静息状态。" },
  "reverse-stimulation": { title: "反向刺激不能跨越化学突触", event: "直接刺激突触后膜", location: "突触后膜一侧", cause: "递质释放装置主要位于突触前膜，而相应受体主要位于突触后膜。", result: "化学突触具有单向传递性；信号不会反向传到突触前末梢。" },
} as const;

const BLOCKED_STAGE_COPY = {
  "calcium-blocked": {
    title: "Ca²⁺通道被阻断",
    event: "动作电位到达，但 Ca²⁺ 内流被阻断",
    location: "突触前膜 Ca²⁺ 通道",
    cause: "通道被阻断，因此未发生 Ca²⁺ 内流。",
    result: "小泡不发生有效融合与递质释放，受体和突触后膜均无明显响应。",
  },
  "receptor-blocked": {
    title: "突触后受体被阻断",
    event: "递质已经释放并扩散到突触后膜附近",
    location: "突触后膜受体",
    cause: "受体被阻断，递质不能有效激活受体。",
    result: "突触后膜电位维持约 −70 mV，没有出现电压响应。",
  },
} as const;

const CONDITIONS: Array<[SynapseCondition, string]> = [
  ["normal", "正常传递"],
  ["calcium-blocked", "阻断 Ca²⁺通道"],
  ["receptor-blocked", "阻断受体"],
  ["clearance-inhibited", "抑制递质清除"],
];

function clamp(value: number) {
  return Math.min(SYNAPSE_DURATION, Math.max(0, value));
}

export function SynapseLab() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [settings, setSettings] = useState<SynapseSettings>(DEFAULT_SETTINGS);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(() => getSynapseSnapshot(time, settings), [settings, time]);
  const copy =
    snapshot.stage === "calcium-entry" && settings.condition === "calcium-blocked"
      ? BLOCKED_STAGE_COPY["calcium-blocked"]
      : snapshot.stage === "receptor-binding" && settings.condition === "receptor-blocked"
        ? BLOCKED_STAGE_COPY["receptor-blocked"]
        : STAGE_COPY[snapshot.stage];

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed);
        if (next >= SYNAPSE_DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastFrame.current = null;
    };
  }, [playing, speed]);

  const changeSettings = (patch: Partial<SynapseSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="synapse-shell" aria-labelledby="synapse-title">
      <header className="synapse-header">
        <p className="synapse-eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="synapse-title">化学突触的兴奋传递</h1>
        <p>调整突触类型与干预条件，观察电信号如何转为化学信号，再影响突触后膜电位。</p>
      </header>

      <section className="synapse-grid">
        <SynapseView
          snapshot={snapshot}
          playing={playing}
          kind={settings.kind}
          stimulation={settings.stimulation ?? "presynaptic"}
        />
        <SynapseChart time={time} settings={settings} snapshot={snapshot} />
        <section className="synapse-explanation" aria-live="polite" aria-label="当前阶段解释">
          <p className="synapse-kicker">当前阶段</p>
          <h2>{copy.title}</h2>
          <dl>
            <div><dt>事件</dt><dd>{copy.event}</dd></div>
            <div><dt>位置</dt><dd>{copy.location}</dd></div>
            <div><dt>原因</dt><dd>{copy.cause}</dd></div>
            <div><dt>结果</dt><dd>{copy.result}</dd></div>
          </dl>
        </section>
      </section>

      <section className="synapse-controls" aria-label="实验控制台">
        <div className="synapse-control-groups">
          <fieldset>
            <legend>刺激位置</legend>
            <div className="synapse-button-row">
              {([ ["presynaptic", "刺激突触前末梢（正向）"], ["postsynaptic-reverse", "刺激突触后膜（反向）"] ] as Array<[SynapseStimulation, string]>).map(([stimulation, label]) => (
                <button className="synapse-button" key={stimulation} aria-pressed={(settings.stimulation ?? "presynaptic") === stimulation} onClick={() => changeSettings({ stimulation })}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>突触类型</legend>
            <div className="synapse-button-row">
              {([ ["excitatory", "兴奋性突触"], ["inhibitory", "抑制性突触"] ] as Array<[SynapseKind, string]>).map(([kind, label]) => (
                <button className="synapse-button" key={kind} aria-pressed={settings.kind === kind} onClick={() => changeSettings({ kind })}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>实验干预</legend>
            <div className="synapse-button-row">
              {CONDITIONS.map(([condition, label]) => (
                <button className="synapse-button" key={condition} aria-pressed={settings.condition === condition} onClick={() => changeSettings({ condition })}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>动画速度</legend>
            <div className="synapse-button-row">
              <button className="synapse-button" aria-pressed={speed === 0.5} onClick={() => setSpeed(0.5)}>慢速</button>
              <button className="synapse-button" aria-pressed={speed === 1} onClick={() => setSpeed(1)}>正常</button>
            </div>
          </fieldset>
        </div>
        <label className="synapse-timeline">
          <span>教学时间</span>
          <input aria-label="教学时间" aria-valuetext={`${time.toFixed(1)} 时间单位`} type="range" min="0" max={SYNAPSE_DURATION} step="0.1" value={time} onChange={(event) => { setPlaying(false); setTime(clamp(Number(event.target.value))); }} />
          <output>{time.toFixed(1)} 时间单位</output>
        </label>
        <div className="synapse-button-row synapse-transport">
          <button className="synapse-button primary" onClick={() => { setTime(0); setPlaying(true); }}>开始刺激</button>
          <button className="synapse-button" onClick={() => { if (time >= SYNAPSE_DURATION) setTime(0); setPlaying((current) => !current); }}>{playing ? "暂停" : "播放"}</button>
          <button className="synapse-button" disabled={time <= 0} onClick={() => { setPlaying(false); setTime((current) => clamp(current - 0.5)); }}>上一步</button>
          <button className="synapse-button" disabled={time >= SYNAPSE_DURATION} onClick={() => { setPlaying(false); setTime((current) => clamp(current + 0.5)); }}>下一步</button>
          <button className="synapse-button" onClick={() => { setPlaying(false); setTime(0); setSettings(DEFAULT_SETTINGS); }}>重置</button>
        </div>
        <p className="synapse-note">传递方向具有单向性；时间、粒子与数量均为教学示意。</p>
      </section>
    </main>
  );
}
