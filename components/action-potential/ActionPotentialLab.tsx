"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionPotentialKnowledgeCard } from "./ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "./ActionPotentialModeNav";
import { ActionPotentialScene } from "./ActionPotentialScene";
import { LabControls } from "./LabControls";
import { ACTION_POTENTIAL_MODES, MODE_DURATION_MS } from "./modeData";
import { getActionPotentialFrame } from "./simulation";
import type { ActionPotentialMode } from "./types";

export function ActionPotentialLab() {
  const [mode, setMode] = useState<ActionPotentialMode>("resting");
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const previousTime = useRef<number | null>(null);

  const content = ACTION_POTENTIAL_MODES.find((item) => item.id === mode)!;
  const staticProgress =
    mode === "generation" ? 0.38 : mode === "conduction" ? 0.55 : 0;
  const displayedProgress = reducedMotion ? staticProgress : progress;
  const frame = useMemo(
    () => getActionPotentialFrame(mode, displayedProgress),
    [mode, displayedProgress],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    let frameId = 0;
    const tick = (now: number) => {
      const before = previousTime.current ?? now;
      previousTime.current = now;
      setProgress(
        (current) => (current + (now - before) / MODE_DURATION_MS) % 1,
      );
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      previousTime.current = null;
    };
  }, [playing, reducedMotion]);

  const restart = () => {
    previousTime.current = null;
    setProgress(0);
    setPlaying(true);
  };

  const changeMode = (nextMode: ActionPotentialMode) => {
    setMode(nextMode);
    restart();
  };

  const effectivePlaying = playing && !reducedMotion;

  return (
    <main className="lab-shell" aria-labelledby="lab-title">
      <header className="lab-header">
        <p className="eyebrow">选择性必修 1 · 神经调节</p>
        <h1 id="lab-title">动作电位的形成和传导</h1>
        <p>切换三个模式，分别观察静息、产生和传导。</p>
      </header>
      <ActionPotentialModeNav mode={mode} onModeChange={changeMode} />
      <section className="ap-workspace">
        <ActionPotentialScene
          mode={mode}
          frame={frame}
          playing={effectivePlaying}
        />
        <ActionPotentialKnowledgeCard content={content} />
      </section>
      <LabControls
        playing={effectivePlaying}
        onTogglePlaying={() => setPlaying((current) => !current)}
        onReplay={restart}
      />
    </main>
  );
}
