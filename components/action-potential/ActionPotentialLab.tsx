"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxonView } from "./AxonView";
import { PotentialChart } from "./PotentialChart";
import { LabControls } from "./LabControls";
import { StageExplanation } from "./StageExplanation";
import { DURATION, clamp, getSimulationSnapshot } from "./simulation";
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(() => getSimulationSnapshot(time, settings), [time, settings]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed, 0, DURATION);
        if (next >= DURATION) setPlaying(false);
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

  const changeSetting = (patch: Partial<ExperimentSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <p className="eyebrow">选择性必修 1 · 神经调节</p>
        <h1>动作电位的形成和传导</h1>
        <p>给予神经纤维适宜刺激，观察动作电位如何形成并传播。</p>
      </header>
      <section className="experiment-grid">
        <AxonView time={time} settings={settings} snapshot={snapshot} onElectrodeChange={(electrodePosition) => changeSetting({ electrodePosition })} />
        <PotentialChart time={time} settings={settings} snapshot={snapshot} />
        <StageExplanation stage={snapshot.stage} ionFlow={snapshot.ionFlow} />
      </section>
      <LabControls
        time={time}
        duration={DURATION}
        playing={playing}
        intensity={settings.intensity}
        stimulusPosition={settings.stimulusPosition}
        speed={speed}
        onStart={() => { setTime(0); setPlaying(true); }}
        onTimeChange={(next) => { setPlaying(false); setTime(clamp(next, 0, DURATION)); }}
        onIntensityChange={(intensity: StimulusIntensity) => changeSetting({ intensity })}
        onStimulusPositionChange={(stimulusPosition) => changeSetting({ stimulusPosition })}
        onSpeedChange={setSpeed}
        onTogglePlaying={() => { if (time >= DURATION) setTime(0); setPlaying((current) => !current); }}
        onStep={(delta) => { setPlaying(false); setTime((current) => clamp(current + delta, 0, DURATION)); }}
        onReset={() => { setPlaying(false); setTime(0); setSettings(DEFAULT_SETTINGS); }}
      />
    </main>
  );
}
