"use client";

import type { CurveAnswer, CurveAnswerCheck, CurveSnapshot, CurveStage, InsidePolarity, IonFlow } from "./types";

const STAGES: Array<[CurveStage, string]> = [
  ["resting", "静息期"], ["local", "局部电位"], ["threshold", "阈电位"], ["depolarization", "去极化"], ["peak", "反极化"], ["repolarization", "复极化"], ["recovery", "恢复期"],
];
const IONS: Array<[IonFlow, string]> = [["none", "无主要离子流"], ["sodium-in", "Na⁺ 内流"], ["potassium-out", "K⁺ 外流"]];
const POLARITIES: Array<[InsidePolarity, string]> = [["negative", "膜内相对负"], ["positive", "膜内相对正"]];

export interface QuizPanelProps {
  snapshot: CurveSnapshot;
  answer: CurveAnswer;
  feedback: CurveAnswerCheck | null;
  correctCount: number;
  onChange: (patch: Partial<CurveAnswer>) => void;
  onSubmit: () => void;
  onNext: () => void;
}

function ChoiceGroup<T extends string>({ label, choices, selected, onSelect }: { label: string; choices: Array<[T, string]>; selected: T; onSelect: (value: T) => void }) {
  return <fieldset className="quiz-choice-group" aria-label={label}><legend>{label}</legend><div>{choices.map(([value, copy]) => <button type="button" key={value} aria-pressed={selected === value} onClick={() => onSelect(value)}>{copy}</button>)}</div></fieldset>;
}

export function QuizPanel({ snapshot, answer, feedback, correctCount, onChange, onSubmit, onNext }: QuizPanelProps) {
  return (
    <section className="membrane-quiz-panel" aria-live="polite">
      <p className="membrane-kicker">辨析模式 · 已答对 {correctCount} 题</p>
      <h2>判断游标所在位置</h2>
      <p>观察当前游标（{snapshot.mv.toFixed(0)} mV），选择阶段、主要离子运动和膜内外相对电性。</p>
      <ChoiceGroup label="阶段选择" choices={STAGES} selected={answer.stage} onSelect={(stage) => onChange({ stage })} />
      <ChoiceGroup label="主要离子运动" choices={IONS} selected={answer.ionFlow} onSelect={(ionFlow) => onChange({ ionFlow })} />
      <ChoiceGroup label="膜内相对电性" choices={POLARITIES} selected={answer.insidePolarity} onSelect={(insidePolarity) => onChange({ insidePolarity })} />
      <div className="quiz-actions"><button className="membrane-button primary" type="button" onClick={onSubmit}>提交判断</button><button className="membrane-button" type="button" onClick={onNext}>下一题位置</button></div>
      {feedback && <p className={`quiz-feedback ${feedback.correct ? "correct" : "incorrect"}`}>{feedback.correct ? "判断正确。" : "再想一想。"}{feedback.explanation}</p>}
    </section>
  );
}
