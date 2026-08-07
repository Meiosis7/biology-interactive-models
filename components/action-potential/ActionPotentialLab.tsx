"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxonView } from "./AxonView";
import { PotentialChart } from "./PotentialChart";
import { LabControls } from "./LabControls";
import { StageExplanation } from "./StageExplanation";
import { NeuralLearningGuide } from "../neural-guidance/NeuralLearningGuide";
import {
  clamp,
  getExperimentDuration,
  getSimulationSnapshot,
} from "./simulation";
import type { ExperimentSettings, StimulusIntensity } from "./types";

const DEFAULT_SETTINGS: ExperimentSettings = {
  intensity: "threshold",
  stimulusPosition: 0.5,
  electrodePosition: 0.72,
};

export function ActionPotentialLab() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [advanced, setAdvanced] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const lastFrame = useRef<number | null>(null);
  const duration = useMemo(() => getExperimentDuration(settings), [settings]);
  const snapshot = useMemo(() => getSimulationSnapshot(time, settings), [time, settings]);
  const guideStep = time === 0 ? 0 : time < snapshot.arrivalTime ? 1 : 2;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed, 0, duration);
        if (next >= duration) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastFrame.current = null;
    };
  }, [duration, playing, speed]);

  const changeSetting = (patch: Partial<ExperimentSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="lab-shell" aria-labelledby="lab-title">
      <header className="lab-header">
        <p className="eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="lab-title">动作电位的形成和传导</h1>
        <p>先点击开始，再跟着三个提示看兴奋怎样形成和传播。</p>
      </header>
      <NeuralLearningGuide
        goal="刺激达到一定强度后，兴奋会沿神经纤维传播"
        steps={["点击开始刺激", "看黄色兴奋区向两侧移动", "看记录点电位先升后降"]}
        currentStep={guideStep}
        takeaway="动作电位在局部形成，并沿神经纤维双向传播。"
      />
      <section className="experiment-grid">
        <AxonView
          time={time}
          settings={settings}
          snapshot={snapshot}
          playing={playing}
          onElectrodeChange={(electrodePosition) => changeSetting({ electrodePosition })}
        />
        <PotentialChart
          time={time}
          duration={duration}
          settings={settings}
          snapshot={snapshot}
        />
        <StageExplanation stage={snapshot.stage} ionFlow={snapshot.ionFlow} />
      </section>
      <LabControls
        time={time}
        duration={duration}
        playing={playing}
        intensity={settings.intensity}
        stimulusPosition={settings.stimulusPosition}
        speed={speed}
        advanced={advanced}
        onStart={() => { setTime(0); setPlaying(true); }}
        onTimeChange={(next) => { setPlaying(false); setTime(clamp(next, 0, duration)); }}
        onIntensityChange={(intensity: StimulusIntensity) => changeSetting({ intensity })}
        onStimulusPositionChange={(stimulusPosition) => changeSetting({ stimulusPosition })}
        onSpeedChange={setSpeed}
        onAdvancedChange={setAdvanced}
        onTogglePlaying={() => { if (time >= duration) setTime(0); setPlaying((current) => !current); }}
        onStep={(delta) => { setPlaying(false); setTime((current) => clamp(current + delta, 0, duration)); }}
        onReset={() => { setPlaying(false); setTime(0); setSettings(DEFAULT_SETTINGS); setAdvanced(false); }}
      />
    </main>
  );
}
