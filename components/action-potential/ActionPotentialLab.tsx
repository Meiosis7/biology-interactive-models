"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionPotentialKnowledgeCard } from "./ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "./ActionPotentialModeNav";
import { ActionPotentialScene } from "./ActionPotentialScene";
import { ConductionControls } from "./ConductionControls";
import { LabControls } from "./LabControls";
import { ACTION_POTENTIAL_MODES, MODE_DURATION_MS } from "./modeData";
import {
  CONDUCTION_ACTION_POTENTIAL_MS,
  CONDUCTION_LOCAL_CURRENT_MS,
  getActionPotentialFrame,
  getConductionStepFrame,
} from "./simulation";
import type { ActionPotentialMode, ConductionStep } from "./types";

export function ActionPotentialLab() {
  const [mode, setMode] = useState<ActionPotentialMode>("resting");
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationEpoch, setAnimationEpoch] = useState(0);
  const [conductionStep, setConductionStep] = useState<ConductionStep>(0);
  const [conductionProgress, setConductionProgress] = useState(1);
  const [conductionBusy, setConductionBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false);
  const previousTime = useRef<number | null>(null);
  const progressRef = useRef(0);
  const conductionProgressRef = useRef(1);

  const content = ACTION_POTENTIAL_MODES.find((item) => item.id === mode)!;
  const staticProgress = mode === "generation" ? 0.55 : 0;
  const displayedProgress = reducedMotion ? staticProgress : progress;
  const displayedConductionProgress = reducedMotion ? 1 : conductionProgress;
  const frame = useMemo(
    () =>
      mode === "conduction"
        ? getConductionStepFrame(conductionStep, displayedConductionProgress)
        : getActionPotentialFrame(mode, displayedProgress),
    [conductionStep, displayedConductionProgress, displayedProgress, mode],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(media.matches);
      setMotionPreferenceReady(true);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (
      !motionPreferenceReady ||
      !playing ||
      reducedMotion ||
      mode === "conduction"
    )
      return;
    let frameId = 0;
    const tick = (now: number) => {
      const before = previousTime.current ?? now;
      previousTime.current = now;
      const next = progressRef.current + (now - before) / MODE_DURATION_MS;
      const nextProgress = next % 1;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      previousTime.current = null;
    };
  }, [mode, motionPreferenceReady, playing, reducedMotion]);

  useEffect(() => {
    if (
      !motionPreferenceReady ||
      mode !== "conduction" ||
      !conductionBusy ||
      reducedMotion
    )
      return;

    let frameId = 0;
    let previousConductionTime: number | null = null;
    const duration =
      conductionStep % 2 === 1
        ? CONDUCTION_LOCAL_CURRENT_MS
        : CONDUCTION_ACTION_POTENTIAL_MS;
    const tick = (now: number) => {
      const before = previousConductionTime ?? now;
      previousConductionTime = now;
      const next =
        conductionProgressRef.current + (now - before) / duration;
      if (next >= 1) {
        conductionProgressRef.current = 1;
        setConductionProgress(1);
        setConductionBusy(false);
        return;
      }
      conductionProgressRef.current = next;
      setConductionProgress(next);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [conductionBusy, conductionStep, mode, motionPreferenceReady, reducedMotion]);

  const restart = () => {
    previousTime.current = null;
    progressRef.current = 0;
    setProgress(0);
    setAnimationEpoch((current) => current + 1);
    setPlaying(true);
  };

  const restartConduction = () => {
    conductionProgressRef.current = 1;
    setConductionProgress(1);
    setConductionStep(0);
    setConductionBusy(false);
    setAnimationEpoch((current) => current + 1);
  };

  const changeMode = (nextMode: ActionPotentialMode) => {
    setMode(nextMode);
    if (nextMode === "conduction") {
      restartConduction();
    } else {
      restart();
      restartConduction();
    }
  };

  const togglePlaying = () => {
    setPlaying((current) => !current);
  };

  const nextConductionStep = () => {
    if (conductionBusy || conductionStep >= 6) return;
    const nextStep = (conductionStep + 1) as ConductionStep;
    setConductionStep(nextStep);
    setAnimationEpoch((current) => current + 1);
    if (reducedMotion) {
      conductionProgressRef.current = 1;
      setConductionProgress(1);
      setConductionBusy(false);
      return;
    }
    conductionProgressRef.current = 0;
    setConductionProgress(0);
    setConductionBusy(true);
  };

  const effectivePlaying =
    mode === "conduction"
      ? conductionBusy && !reducedMotion
      : playing && !reducedMotion;
  const conductionComplete =
    conductionStep === 6 && displayedConductionProgress >= 1;

  return (
    <main className="lab-shell" aria-labelledby="lab-title">
      <header className="lab-header">
        <p className="eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="lab-title">动作电位的形成和传导</h1>
      </header>
      <ActionPotentialModeNav mode={mode} onModeChange={changeMode} />
      <section className="ap-workspace">
        <ActionPotentialScene
          mode={mode}
          frame={frame}
          playing={effectivePlaying}
          animationEpoch={animationEpoch}
        />
        <ActionPotentialKnowledgeCard content={content} />
      </section>
      {mode === "conduction" ? (
        <ConductionControls
          busy={conductionBusy}
          complete={conductionComplete}
          onNext={nextConductionStep}
          onReplay={restartConduction}
        />
      ) : (
        <LabControls
          playing={effectivePlaying}
          playbackDisabled={reducedMotion}
          onTogglePlaying={togglePlaying}
          onReplay={restart}
        />
      )}
    </main>
  );
}
