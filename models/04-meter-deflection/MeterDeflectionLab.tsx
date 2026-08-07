"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdvancedPanel, NeuralLearningGuide } from "../../components/neural-guidance/NeuralLearningGuide";
import { AnalogMeter } from "./AnalogMeter";
import { ElectrodeChart } from "./ElectrodeChart";
import { NerveElectrodeView } from "./NerveElectrodeView";
import { getMeterSnapshot, METER_DURATION } from "./simulation";
import type { MeterSettings, MeterStage } from "./types";

const INITIAL_SETTINGS: MeterSettings = {
  mode: "extracellular",
  stimulusPosition: 10,
  electrodeA: 35,
  electrodeB: 65,
  leadsReversed: false,
};

type MeterPreset =
  | "extracellular-a-first"
  | "extracellular-b-first"
  | "transmembrane"
  | "equidistant";

const PRESETS: Record<
  MeterPreset,
  { label: string; settings: MeterSettings; note: string }
> = {
  "extracellular-a-first": {
    label: "膜外双电极（A 先到）",
    settings: INITIAL_SETTINGS,
    note: "膜外双电极：兴奋先到 A、后到 B，可观察两次方向相反的偏转。",
  },
  "extracellular-b-first": {
    label: "膜外双电极（B 先到）",
    settings: {
      mode: "extracellular",
      stimulusPosition: 10,
      electrodeA: 65,
      electrodeB: 35,
      leadsReversed: false,
    },
    note: "膜外双电极：B 距刺激点更近，因此兴奋先到 B、后到 A。",
  },
  transmembrane: {
    label: "膜内外跨膜",
    settings: {
      mode: "transmembrane",
      stimulusPosition: 20,
      electrodeA: 45,
      electrodeB: 70,
      leadsReversed: false,
    },
    note: "膜内外跨膜：A 记录膜内电位，B 是保持 0 mV 的膜外参考端。",
  },
  equidistant: {
    label: "等距验证",
    settings: {
      mode: "equidistant",
      stimulusPosition: 50,
      electrodeA: 30,
      electrodeB: 70,
      leadsReversed: false,
    },
    note: "等距验证：兴奋将同时到达 A、B，两个细胞外电位相同，检流计差值接近 0。",
  },
};

const PRESET_ORDER = Object.keys(PRESETS) as MeterPreset[];

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

function getStageCopy(stage: MeterStage, transmembrane: boolean) {
  if (!transmembrane) return STAGE_COPY[stage];

  const copy: Partial<Record<MeterStage, string>> = {
    resting: "A 尚处于静息状态；B 是固定的膜外参考端。",
    "approaching-a": "兴奋正向 A 传播，尚未到达膜内记录点 A。",
    "at-a": "兴奋到达 A，A 的膜内电位发生改变；B 仍是膜外参考端。",
    passed: "兴奋已通过 A，A 的膜内电位恢复；B 始终作为膜外参考端。",
  };

  return copy[stage] ?? copy.resting!;
}

export function MeterDeflectionLab() {
  const [settings, setSettings] = useState<MeterSettings>(INITIAL_SETTINGS);
  const [activePreset, setActivePreset] = useState<MeterPreset | null>(
    "extracellular-a-first",
  );
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [showHint, setShowHint] = useState(true);
  const [showReasoning, setShowReasoning] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const frameTime = useRef<number | null>(null);
  const snapshot = useMemo(() => getMeterSnapshot(time, settings), [settings, time]);
  const transmembrane = settings.mode === "transmembrane";
  const stageCopy = getStageCopy(snapshot.stage, transmembrane);

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
  const setPreset = (preset: MeterPreset) => {
    setActivePreset(preset);
    resetToStart({ ...PRESETS[preset].settings });
  };
  const changePosition = (field: "stimulusPosition" | "electrodeA" | "electrodeB", value: number) => {
    setActivePreset(null);
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
  const nextPreset = () => {
    const currentIndex = activePreset ? PRESET_ORDER.indexOf(activePreset) : -1;
    setPreset(PRESET_ORDER[(currentIndex + 1) % PRESET_ORDER.length]);
  };

  const voltageA = signed(snapshot.voltageA);
  const voltageB = signed(snapshot.voltageB);
  const displayedCalculation = settings.leadsReversed
    ? `导线交换后按 V_B − V_A 代入：${voltageB} − ${voltageA} = ${signed(snapshot.differenceMv)} mV`
    : `按 V_A − V_B 代入：${voltageA} − ${voltageB} = ${signed(snapshot.differenceMv)} mV`;
  const firstExcited = activePreset === "equidistant"
    ? "A、B 同时兴奋"
    : activePreset === "extracellular-b-first"
      ? "B 先兴奋"
      : "A 先兴奋";
  const direction = snapshot.differenceMv === 0
    ? "指针在中央"
    : `指针向${snapshot.differenceMv > 0 ? "正" : "负"}方向偏`;

  return (
    <main className="meter-shell" aria-labelledby="meter-title">
      <header className="meter-header">
        <p className="meter-eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="meter-title">兴奋传导与检流计偏转实验台</h1>
        <p>移动刺激点和电极，观察神经纤维上局部电位如何经由 <strong>U = V_A − V_B</strong> 转化为表针偏转。</p>
      </header>

      <NeuralLearningGuide
        goal="先后顺序决定电位差，电位差决定指针方向"
        steps={["先找谁先兴奋", "再看电位差正负", "最后判断指针方向"]}
        currentStep={time === 0 ? 0 : snapshot.differenceMv === 0 ? 1 : 2}
        takeaway="先到的电极先发生电位变化，再用 V_A − V_B 判断偏转。"
      />
      {activePreset && <p className="meter-preset-note">{PRESETS[activePreset].note}</p>}

      <section className="meter-grid">
        <NerveElectrodeView settings={settings} snapshot={snapshot} showPositionControls={advanced} onPositionChange={changePosition} />
        <AnalogMeter differenceMv={snapshot.differenceMv} pointerAngle={snapshot.pointerAngle} leadsReversed={settings.leadsReversed} />
        <ElectrodeChart settings={settings} time={time} snapshot={snapshot} />
      </section>

      <section className="meter-simple-reasoning" aria-live="polite" aria-label="基础判断链">
        <h2>三步判断指针</h2>
        <ol>
          <li><b>1. 谁先兴奋</b><span>{firstExcited}</span></li>
          <li><b>2. 电位差正负</b><span>当前 V_A − V_B = {signed(snapshot.differenceMv)} mV</span></li>
          <li><b>3. 指针方向</b><span>{direction}</span></li>
        </ol>
      </section>

      {showHint && <aside className="meter-hint"><p><strong>读图提示：</strong>细胞外兴奋处相对为负；跨膜记录中，A 的读数表示膜内相对膜外的电位。不要把“细胞外电位”与“跨膜电位”混为一谈。</p><button className="meter-button small" aria-label="关闭提示" onClick={() => setShowHint(false)}>关闭提示</button></aside>}

      <section className="meter-controls" aria-label="实验控制台">
        <div className="meter-button-row">
          <button className="meter-button primary" onClick={() => { setTime(0); setPlaying(true); }}>开始刺激</button>
          <button className="meter-button" onClick={() => { if (time >= METER_DURATION) setTime(0); setPlaying((current) => !current); }}>{playing ? "暂停" : "播放"}</button>
          <button className="meter-button" onClick={nextPreset}>下一个示例</button>
          <button className="meter-button" onClick={() => { setPlaying(false); setTime(0); setSpeed(1); setSettings(INITIAL_SETTINGS); setActivePreset("extracellular-a-first"); setAdvanced(false); }}>重置</button>
        </div>
        <AdvancedPanel id="meter-advanced-controls" expanded={advanced} onExpandedChange={setAdvanced}>
          <section className="meter-presets" aria-label="记录方式与预设">
            <span>快速预设</span>
            {PRESET_ORDER.map((preset) => (
              <button className="meter-button" key={preset} aria-pressed={activePreset === preset} onClick={() => setPreset(preset)}>{PRESETS[preset].label}</button>
            ))}
          </section>
          <label className="meter-timeline"><span>教学时间</span><input aria-label="教学时间" type="range" min="0" max={METER_DURATION} step="0.1" value={time} onChange={(event) => changeTime(Number(event.target.value))} /><output>{time.toFixed(1)} 时间单位</output></label>
          <div className="meter-button-row">
            <button className="meter-button" disabled={time <= 0} onClick={() => changeTime(time - 0.5)}>上一步</button>
            <button className="meter-button" disabled={time >= METER_DURATION} onClick={() => changeTime(time + 0.5)}>下一步</button>
            <button className="meter-button" onClick={swapLeads}>交换导线</button>
            {([0.5, 1, 2] as const).map((value) => <button key={value} className="meter-button" aria-pressed={speed === value} onClick={() => changeSpeed(value)}>{value === 0.5 ? "慢速" : value === 1 ? "正常" : "快速"}</button>)}
          </div>
          <section className="meter-explanation" aria-live="polite" aria-label="四步解释链">
            <header>
              <div><p className="meter-eyebrow">四步解释链</p><h2>从波前到指针</h2></div>
              <div className="meter-reasoning-controls">
                <span className="meter-stage">{stageCopy}</span>
                <button className="meter-button" aria-controls="meter-reasoning-chain" aria-expanded={showReasoning} onClick={() => setShowReasoning((current) => !current)}>{showReasoning ? "隐藏四步推理" : "显示四步推理"}</button>
              </div>
            </header>
            {showReasoning && <ol id="meter-reasoning-chain">
              <li><b>1. 兴奋到达位置</b><span>{snapshot.stage === "simultaneous" ? "A、B 等距，波前同时到达。" : stageCopy}</span></li>
              <li><b>2. A / B 电位</b><span>{transmembrane ? "A 是膜内电位；B 是膜外参考电位，始终保持 0 mV。" : "A、B 都是细胞外局部电位。"} 当前 V_A = {voltageA} mV，V_B = {voltageB} mV。</span></li>
              <li><b>3. 电势差计算</b><span>{displayedCalculation}</span></li>
              <li><b>4. 指针方向</b><span>{snapshot.differenceMv === 0 ? "差值为 0，指针回到中央。" : `差值为 ${signed(snapshot.differenceMv)} mV，指针向${snapshot.differenceMv > 0 ? "正" : "负"}方向偏转 ${Math.abs(snapshot.pointerAngle).toFixed(0)}°。`}</span></li>
            </ol>}
          </section>
        </AdvancedPanel>
      </section>
    </main>
  );
}
