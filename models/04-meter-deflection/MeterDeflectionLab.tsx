"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnalogMeter } from "./AnalogMeter";
import { ElectrodeChart } from "./ElectrodeChart";
import { NerveElectrodeView } from "./NerveElectrodeView";
import { getMeterSnapshot, METER_DURATION } from "./simulation";
import type { MeterSettings, MeterStage, RecordingMode } from "./types";

const INITIAL_SETTINGS: MeterSettings = {
  mode: "extracellular",
  stimulusPosition: 10,
  electrodeA: 35,
  electrodeB: 65,
  leadsReversed: false,
};

const PRESETS: Record<RecordingMode, MeterSettings> = {
  extracellular: INITIAL_SETTINGS,
  transmembrane: { mode: "transmembrane", stimulusPosition: 20, electrodeA: 45, electrodeB: 70, leadsReversed: false },
  equidistant: { mode: "equidistant", stimulusPosition: 50, electrodeA: 30, electrodeB: 70, leadsReversed: false },
};

const STAGE_COPY: Record<MeterStage, string> = {
  resting: "波前尚未到达任一电极，两个细胞外位置均接近静息基线。",
  "approaching-a": "兴奋正从刺激点向 A 侧传播，尚未到达 A。",
  "approaching-b": "兴奋正从刺激点向 B 侧传播，尚未到达 B。",
  "at-a": "兴奋到达 A，A 位置首先发生电位改变。",
  between: "兴奋已离开先到电极、尚未造成另一个电极的局部改变。",
  "at-b": "兴奋到达 B，B 位置发生电位改变。",
  passed: "兴奋波前已通过两电极，局部电位恢复基线。",
  simultaneous: "兴奋同时到达 A、B；两处读数相同，差值接近 0。",
};

function clamp(value: number) {
  return Math.max(0, Math.min(METER_DURATION, value));
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}`;
}

export function MeterDeflectionLab() {
  const [settings, setSettings] = useState<MeterSettings>(INITIAL_SETTINGS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [showHint, setShowHint] = useState(true);
  const frameTime = useRef<number | null>(null);
  const snapshot = useMemo(() => getMeterSnapshot(time, settings), [settings, time]);
  const transmembrane = settings.mode === "transmembrane";

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = frameTime.current ?? now;
      frameTime.current = now;
      setTime((current) => {
        const next = clamp(current + (now - previous) / 1000 * speed);
        if (next >= METER_DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); frameTime.current = null; };
  }, [playing, speed]);

  const resetToStart = (next: MeterSettings) => {
    setPlaying(false);
    setTime(0);
    setSettings(next);
  };
  const setPreset = (mode: RecordingMode) => resetToStart({ ...PRESETS[mode] });
  const changePosition = (field: "stimulusPosition" | "electrodeA" | "electrodeB", value: number) => {
    resetToStart({ ...settings, [field]: value });
  };
  const changeTime = (value: number) => {
    setPlaying(false);
    setTime(clamp(value));
  };
  const changeSpeed = (next: 0.5 | 1 | 2) => {
    setPlaying(false);
    setSpeed(next);
  };
  const swapLeads = () => setSettings((current) => ({ ...current, leadsReversed: !current.leadsReversed }));

  const voltageA = signed(snapshot.voltageA);
  const voltageB = signed(snapshot.voltageB);
  const displayedCalculation = settings.leadsReversed
    ? `导线交换后按 V_B − V_A 代入：${voltageB} − ${voltageA} = ${signed(snapshot.differenceMv)} mV`
    : `按 V_A − V_B 代入：${voltageA} − ${voltageB} = ${signed(snapshot.differenceMv)} mV`;

  return (
    <main className="meter-shell" aria-labelledby="meter-title">
      <header className="meter-header">
        <p className="meter-eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="meter-title">兴奋传导与检流计偏转实验台</h1>
        <p>移动刺激点和电极，观察神经纤维上局部电位如何经由 <strong>U = V_A − V_B</strong> 转化为表针偏转。</p>
      </header>

      <section className="meter-presets" aria-label="记录方式与预设">
        <span>快速预设</span>
        <button className="meter-button" aria-pressed={settings.mode === "extracellular"} onClick={() => setPreset("extracellular")}>双侧细胞外</button>
        <button className="meter-button" aria-pressed={settings.mode === "transmembrane"} onClick={() => setPreset("transmembrane")}>跨膜记录</button>
        <button className="meter-button" aria-pressed={settings.mode === "equidistant"} onClick={() => setPreset("equidistant")}>等距同时到达</button>
      </section>
      {settings.mode === "equidistant" && <p className="meter-preset-note">等距预设：兴奋将同时到达 A、B，两个细胞外电位相同，检流计差值接近 0。</p>}

      <section className="meter-grid">
        <NerveElectrodeView settings={settings} snapshot={snapshot} onPositionChange={changePosition} />
        <AnalogMeter differenceMv={snapshot.differenceMv} pointerAngle={snapshot.pointerAngle} leadsReversed={settings.leadsReversed} />
        <ElectrodeChart settings={settings} time={time} snapshot={snapshot} />
      </section>

      <section className="meter-explanation" aria-live="polite" aria-label="四步解释链">
        <header><div><p className="meter-eyebrow">四步解释链</p><h2>从波前到指针</h2></div><span className="meter-stage">{STAGE_COPY[snapshot.stage]}</span></header>
        <ol>
          <li><b>1. 兴奋到达位置</b><span>{snapshot.stage === "simultaneous" ? "A、B 等距，波前同时到达。" : STAGE_COPY[snapshot.stage]}</span></li>
          <li><b>2. A / B 电位</b><span>{transmembrane ? "A 是膜内电位，B 是膜外参考电位。" : "A、B 都是细胞外局部电位。"} 当前 V_A = {voltageA} mV，V_B = {voltageB} mV。</span></li>
          <li><b>3. 电势差计算</b><span>{displayedCalculation}</span></li>
          <li><b>4. 指针方向</b><span>{snapshot.differenceMv === 0 ? "差值为 0，指针回到中央。" : `差值为 ${signed(snapshot.differenceMv)} mV，指针向${snapshot.differenceMv > 0 ? "正" : "负"}方向偏转 ${Math.abs(snapshot.pointerAngle).toFixed(0)}°。`}</span></li>
        </ol>
      </section>

      {showHint && <aside className="meter-hint"><p><strong>读图提示：</strong>细胞外兴奋处相对为负；跨膜记录中，A 的读数表示膜内相对膜外的电位。不要把“细胞外电位”与“跨膜电位”混为一谈。</p><button className="meter-button small" aria-label="关闭提示" onClick={() => setShowHint(false)}>关闭提示</button></aside>}

      <section className="meter-controls" aria-label="实验控制台">
        <label className="meter-timeline"><span>教学时间</span><input aria-label="教学时间" type="range" min="0" max={METER_DURATION} step="0.1" value={time} onChange={(event) => changeTime(Number(event.target.value))} /><output>{time.toFixed(1)} 时间单位</output></label>
        <div className="meter-button-row">
          <button className="meter-button primary" onClick={() => { setTime(0); setPlaying(true); }}>开始刺激</button>
          <button className="meter-button" onClick={() => { if (time >= METER_DURATION) setTime(0); setPlaying((current) => !current); }}>{playing ? "暂停" : "播放"}</button>
          <button className="meter-button" disabled={time <= 0} onClick={() => changeTime(time - 0.5)}>上一步</button>
          <button className="meter-button" disabled={time >= METER_DURATION} onClick={() => changeTime(time + 0.5)}>下一步</button>
          <button className="meter-button" onClick={swapLeads}>交换导线</button>
          {([0.5, 1, 2] as const).map((value) => <button key={value} className="meter-button" aria-pressed={speed === value} onClick={() => changeSpeed(value)}>{value === 0.5 ? "慢速" : value === 1 ? "正常" : "快速"}</button>)}
          <button className="meter-button" onClick={() => { setPlaying(false); setTime(0); setSettings(INITIAL_SETTINGS); }}>重置</button>
        </div>
      </section>
    </main>
  );
}
