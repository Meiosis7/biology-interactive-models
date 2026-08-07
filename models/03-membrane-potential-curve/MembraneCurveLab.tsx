"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CurveCanvas } from "./CurveCanvas";
import { MembraneView } from "./MembraneView";
import { QuizPanel } from "./QuizPanel";
import { checkCurveAnswer, getCurveSnapshot } from "./simulation";
import type { CurveAnswer, CurveAnswerCheck, CurveIntensity } from "./types";
import { AdvancedPanel, NeuralLearningGuide } from "../../components/neural-guidance/NeuralLearningGuide";

type LabMode = "explore" | "compare" | "quiz";
const DURATION = 6;
const GUIDED_POINTS = [
  { label: "静息", time: 0 },
  { label: "上升", time: 2.5 },
  { label: "下降", time: 4.5 },
  { label: "恢复", time: 5.5 },
] as const;
const QUIZ_QUESTIONS: ReadonlyArray<{
  intensity: CurveIntensity;
  time: number;
}> = [
  { intensity: "threshold", time: 0.5 },
  { intensity: "weak", time: 2.5 },
  { intensity: "threshold", time: 1.5 },
  { intensity: "threshold", time: 2.1 },
  { intensity: "threshold", time: 2.8 },
  { intensity: "threshold", time: 3 },
  { intensity: "threshold", time: 4.1 },
  { intensity: "threshold", time: 4.9 },
  { intensity: "threshold", time: 5.3 },
];

const STAGE_COPY = {
  resting: { title: "静息期", summary: "膜电位维持在约 −70 mV，膜内相对为负。", channel: "Na⁺、K⁺通道均未大量开放" },
  local: { title: "局部电位", summary: "弱刺激只造成有限电位改变，未达到阈值，不能引发完整动作电位。", channel: "未出现主要离子流" },
  threshold: { title: "阈电位", summary: "膜电位接近 −55 mV；达到阈值会触发快速的去极化。", channel: "Na⁺通道准备开放" },
  depolarization: { title: "去极化", summary: "Na⁺通道开放增加，Na⁺内流使膜电位快速上升。", channel: "Na⁺通道开放" },
  peak: { title: "反极化（峰值）", summary: "膜内相对为正，单个动作电位峰值约 +30 mV。", channel: "Na⁺内流不再是主要运动" },
  repolarization: { title: "复极化", summary: "K⁺通道开放增加，K⁺外流使膜电位下降。", channel: "K⁺通道开放" },
  recovery: { title: "恢复期", summary: "膜电位短暂低于静息水平后逐渐恢复。", channel: "K⁺通道仍较开放" },
} as const;

const ION_COPY = { none: "无主要离子跨膜流动", "sodium-in": "Na⁺ 内流", "potassium-out": "K⁺ 外流" } as const;

function clamp(value: number) {
  return Math.min(DURATION, Math.max(0, value));
}

function answerForNewQuestion(): CurveAnswer {
  return { stage: "resting", ionFlow: "none", insidePolarity: "negative" };
}

export function MembraneCurveLab() {
  const [mode, setMode] = useState<LabMode>("explore");
  const [intensity, setIntensity] = useState<CurveIntensity>("threshold");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [advanced, setAdvanced] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showThreshold, setShowThreshold] = useState(true);
  const [showIonHint, setShowIonHint] = useState(true);
  const [answer, setAnswer] = useState<CurveAnswer>(answerForNewQuestion);
  const [feedback, setFeedback] = useState<CurveAnswerCheck | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [hasScoredCurrent, setHasScoredCurrent] = useState(false);
  const quizIndex = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(() => getCurveSnapshot(time, intensity), [intensity, time]);
  const copy = STAGE_COPY[snapshot.stage];
  const guideStep = time === 0 ? 0 : time < 4 ? 1 : 2;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed);
        if (next >= DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); lastFrame.current = null; };
  }, [playing, speed]);

  const changeTime = (nextTime: number) => {
    setPlaying(false);
    setTime(clamp(nextTime));
    setFeedback(null);
    setHasScoredCurrent(false);
  };
  const changeMode = (nextMode: LabMode) => {
    setPlaying(false);
    setMode(nextMode);
    setFeedback(null);
    setHasScoredCurrent(false);
    if (nextMode === "quiz") {
      quizIndex.current = 0;
      setTime(QUIZ_QUESTIONS[0].time);
      setIntensity(QUIZ_QUESTIONS[0].intensity);
      setAnswer(answerForNewQuestion());
    }
  };
  const submitQuiz = () => {
    const result = checkCurveAnswer(snapshot, answer);
    setFeedback(result);
    if (result.correct && !hasScoredCurrent) {
      setCorrectCount((count) => count + 1);
      setHasScoredCurrent(true);
    }
  };
  const nextQuiz = () => {
    quizIndex.current = (quizIndex.current + 1) % QUIZ_QUESTIONS.length;
    const question = QUIZ_QUESTIONS[quizIndex.current];
    setTime(question.time);
    setIntensity(question.intensity);
    setAnswer(answerForNewQuestion());
    setFeedback(null);
    setHasScoredCurrent(false);
  };

  return (
    <main className="membrane-shell" aria-labelledby="membrane-title">
      <header className="membrane-header">
        <p className="membrane-eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="membrane-title">膜电位变化曲线实验台</h1>
        <p>不用先背七个阶段，先看曲线的上升、下降和恢复。</p>
      </header>

      <NeuralLearningGuide
        goal="先看曲线怎么变，再把变化和离子运动对应起来"
        steps={["点击一个观察点", "看曲线上升或下降", "记住 Na⁺ 入、K⁺ 出"]}
        currentStep={guideStep}
        takeaway="上升主要对应 Na⁺ 内流，下降主要对应 K⁺ 外流。"
      />

      <nav className="membrane-guided-points" aria-label="基础观察点">
        {GUIDED_POINTS.map((point) => (
          <button
            key={point.label}
            className="membrane-button"
            aria-pressed={time === point.time}
            onClick={() => changeTime(point.time)}
          >
            观察{point.label}
          </button>
        ))}
        <output aria-label="当前教学时间">当前 {time.toFixed(1)} 时间单位</output>
      </nav>

      <p className="membrane-sr-only" aria-label={`阶段播报：${copy.title}`} aria-live="polite" aria-atomic="true">
        当前阶段：{copy.title}
      </p>

      <section className="membrane-grid">
        <CurveCanvas time={time} intensity={intensity} snapshot={snapshot} compare={mode === "compare"} showLabels={showLabels} showThreshold={showThreshold} />
        <MembraneView snapshot={snapshot} playing={playing} showIonHint={showIonHint} />
        <section className="membrane-explanation" aria-label="当前阶段解释">
          <p className="membrane-kicker">当前阶段</p>
          <h2>{copy.title}</h2>
          <dl><div><dt>主要离子运动</dt><dd>{ION_COPY[snapshot.ionFlow]}</dd></div><div><dt>通道状态</dt><dd>{copy.channel}</dd></div><div><dt>膜电位与电性</dt><dd>{snapshot.mv.toFixed(0)} mV；膜内相对{snapshot.insidePolarity === "positive" ? "正" : "负"}</dd></div></dl>
          <p>{copy.summary}</p>
        </section>
      </section>

      {mode === "compare" && <section className="membrane-compare-note"><h2>全或无：阈刺激与强刺激的峰值相同</h2><p>刺激增强不会提高单个动作电位的峰值；本模型只比较单次动作电位，不模拟频率编码。</p></section>}
      {mode === "quiz" && <QuizPanel snapshot={snapshot} intensity={intensity} answer={answer} feedback={feedback} correctCount={correctCount} onChange={(patch) => { setAnswer((current) => ({ ...current, ...patch })); setFeedback(null); }} onSubmit={submitQuiz} onNext={nextQuiz} />}

      <section className="membrane-controls" aria-label="实验控制台">
        <div className="membrane-button-row membrane-transport">
          <button className="membrane-button primary" onClick={() => { setTime(0); setPlaying(true); }}>开始刺激</button>
          <button className="membrane-button" onClick={() => { if (time >= DURATION) setTime(0); setPlaying((current) => !current); }}>{playing ? "暂停" : "播放"}</button>
          <button className="membrane-button" onClick={() => { setPlaying(false); setTime(0); setIntensity("threshold"); setMode("explore"); setSpeed(1); setFeedback(null); setAnswer(answerForNewQuestion()); setAdvanced(false); }}>重置</button>
        </div>
        <AdvancedPanel id="membrane-advanced" expanded={advanced} onExpandedChange={setAdvanced}>
          <nav className="membrane-mode-switch" aria-label="实验模式">
            <button className="membrane-button" aria-pressed={mode === "explore"} onClick={() => changeMode("explore")}>探究模式</button>
            <button className="membrane-button" aria-pressed={mode === "compare"} onClick={() => changeMode("compare")}>对比模式</button>
            <button className="membrane-button" aria-pressed={mode === "quiz"} onClick={() => changeMode("quiz")}>辨析模式</button>
          </nav>
          {mode === "explore" && <fieldset><legend>刺激强度</legend><div className="membrane-button-row">{([ ["weak", "弱刺激"], ["threshold", "阈刺激"], ["strong", "强刺激"] ] as Array<[CurveIntensity, string]>).map(([value, label]) => <button key={value} className="membrane-button" aria-pressed={intensity === value} onClick={() => { setIntensity(value); changeTime(0); }}>{label}</button>)}</div></fieldset>}
          <div className="membrane-toggle-row"><label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> 显示阶段标签</label><label><input type="checkbox" checked={showThreshold} onChange={(event) => setShowThreshold(event.target.checked)} /> 显示阈电位线</label><label><input type="checkbox" checked={showIonHint} onChange={(event) => setShowIonHint(event.target.checked)} /> 显示离子提示</label></div>
          <label className="membrane-timeline"><span>曲线游标</span><input aria-label="曲线游标" aria-valuetext={`${time.toFixed(1)} 教学时间单位`} type="range" min="0" max={DURATION} step="0.1" value={time} onChange={(event) => changeTime(Number(event.target.value))} /><output>{time.toFixed(1)} 时间单位</output></label>
          <div className="membrane-button-row">
            <button className="membrane-button" disabled={time <= 0} onClick={() => changeTime(time - 0.5)}>上一步</button>
            <button className="membrane-button" disabled={time >= DURATION} onClick={() => changeTime(time + 0.5)}>下一步</button>
            <button className="membrane-button" aria-pressed={speed === 0.5} onClick={() => setSpeed(0.5)}>慢速</button>
            <button className="membrane-button" aria-pressed={speed === 1} onClick={() => setSpeed(1)}>正常</button>
          </div>
        </AdvancedPanel>
      </section>
    </main>
  );
}
