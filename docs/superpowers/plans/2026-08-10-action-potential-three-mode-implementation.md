# Action Potential Three-Mode Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current experiment-style action-potential page with three independently selectable animated modes: 静息电位、动作电位产生、动作电位传导.

**Architecture:** `ActionPotentialLab` owns mode, playback, and normalized progress. Pure mode data and a pure frame function drive a DOM/CSS scene plus a synchronized knowledge card; the page has no voltage values, no membrane-potential chart, and no advanced experiment controls.

**Tech Stack:** React 19, TypeScript 5.9, CSS animations/transforms, Vitest 4, Testing Library, vinext.

## Global Constraints

- The only modes are `静息电位`, `动作电位产生`, and `动作电位传导`.
- Do not render membrane-potential curves, coordinate axes, `−70 mV`, or any other voltage value.
- Do not render stimulus intensity, stimulus position, recording electrode, speed, timeline, previous-step, next-step, or advanced-mode controls.
- Mode changes reset progress to zero and start playback.
- The only playback controls are `播放/暂停` and `重新播放`.
- Reduced-motion users receive a static key frame while mode switching and knowledge cards remain usable.
- All buttons have a minimum 44-pixel hit target and the page has no horizontal overflow at 390 pixels.

---

## File Map

- Modify `components/action-potential/types.ts`: define the three-mode domain types.
- Create `components/action-potential/modeData.ts`: own all mode labels, explanations, and facts.
- Modify `components/action-potential/simulation.ts`: replace voltage simulation with a pure normalized frame function.
- Create `components/action-potential/ActionPotentialModeNav.tsx`: render the three mode buttons.
- Create `components/action-potential/ActionPotentialScene.tsx`: render membrane, ions, channels, and conduction visuals.
- Create `components/action-potential/ActionPotentialKnowledgeCard.tsx`: render synchronized teaching text.
- Modify `components/action-potential/LabControls.tsx`: reduce controls to play/pause and replay.
- Modify `components/action-potential/ActionPotentialLab.tsx`: own mode, progress, reduced motion, and animation lifecycle.
- Replace `components/action-potential/action-potential.css`: style the new three-mode page and animations.
- Delete `components/action-potential/AxonView.tsx`, `PotentialChart.tsx`, and `StageExplanation.tsx`: remove obsolete experiment-only views.
- Rewrite `tests/action-potential/simulation.test.ts` and `tests/action-potential/lab.test.tsx`.
- Modify `tests/models/touch-targets.test.ts` and `tests/site-metadata.test.ts` for the new layout contract.

---

### Task 1: Three-mode data and deterministic frames

**Files:**
- Modify: `components/action-potential/types.ts`
- Create: `components/action-potential/modeData.ts`
- Modify: `components/action-potential/simulation.ts`
- Test: `tests/action-potential/simulation.test.ts`

**Interfaces:**
- Produces: `ActionPotentialMode`, `ActionPotentialPhase`, `ActionPotentialFrame`, `ModeContent`.
- Produces: `ACTION_POTENTIAL_MODES`, `MODE_DURATION_MS`, and `getActionPotentialFrame(mode, progress)`.
- Consumes: no application state or React APIs.

- [ ] **Step 1: Replace the old simulation tests with failing three-mode tests**

```ts
import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential three-mode frames", () => {
  it("defines exactly the three requested modes", () => {
    expect(ACTION_POTENTIAL_MODES.map((item) => item.label)).toEqual([
      "静息电位",
      "动作电位产生",
      "动作电位传导",
    ]);
  });

  it("keeps resting mode outside-positive with potassium moving out", () => {
    expect(getActionPotentialFrame("resting", 0.4)).toMatchObject({
      phase: "resting",
      polarity: "outside-positive",
      ionMotion: "potassium-out",
    });
  });

  it.each([
    [0.12, "sodium-in", "outside-positive"],
    [0.38, "polarity-reversed", "inside-positive"],
    [0.68, "potassium-out", "inside-positive"],
    [0.92, "recovered", "outside-positive"],
  ] as const)("maps generation progress %s to %s", (progress, phase, polarity) => {
    expect(getActionPotentialFrame("generation", progress)).toMatchObject({ phase, polarity });
  });

  it("moves two excited regions away from the stimulus point", () => {
    const early = getActionPotentialFrame("conduction", 0.2).excitedCenters;
    const late = getActionPotentialFrame("conduction", 0.8).excitedCenters;
    expect(late[0]).toBeLessThan(early[0]);
    expect(late[1]).toBeGreaterThan(early[1]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 0.5))).not.toMatch(/voltage|mV/);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the old API fails**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: FAIL because `modeData.ts`, `ActionPotentialMode`, and `getActionPotentialFrame` do not exist.

- [ ] **Step 3: Replace the domain types**

```ts
export type ActionPotentialMode = "resting" | "generation" | "conduction";

export type ActionPotentialPhase =
  | "resting"
  | "sodium-in"
  | "polarity-reversed"
  | "potassium-out"
  | "recovered"
  | "conducting";

export type IonMotion = "potassium-out" | "sodium-in" | "none";
export type MembranePolarity = "outside-positive" | "inside-positive";

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  ionMotion: IonMotion;
  polarity: MembranePolarity;
  excitedCenters: readonly [number, number];
  localCurrentVisible: boolean;
}

export interface ModeContent {
  id: ActionPotentialMode;
  label: string;
  title: string;
  summary: string;
  facts: readonly [
    { label: string; value: string },
    { label: string; value: string },
    { label: string; value: string },
  ];
}
```

- [ ] **Step 4: Add the exact teaching data without voltage values**

```ts
import type { ModeContent } from "./types";

export const MODE_DURATION_MS = 6000;

export const ACTION_POTENTIAL_MODES: readonly ModeContent[] = [
  {
    id: "resting",
    label: "静息电位",
    title: "静息电位：外正内负",
    summary: "神经纤维未兴奋时，K⁺外流使膜两侧形成外正内负的静息状态。",
    facts: [
      { label: "膜两侧电性", value: "外正内负" },
      { label: "主要离子运动", value: "K⁺外流" },
      { label: "结果", value: "形成并维持静息电位" },
    ],
  },
  {
    id: "generation",
    label: "动作电位产生",
    title: "动作电位在局部产生",
    summary: "Na⁺先内流，随后K⁺外流，使局部膜经历兴奋并恢复静息状态。",
    facts: [
      { label: "兴奋形成", value: "Na⁺内流" },
      { label: "恢复过程", value: "K⁺外流" },
      { label: "结果", value: "局部产生一次动作电位" },
    ],
  },
  {
    id: "conduction",
    label: "动作电位传导",
    title: "相邻部位依次兴奋",
    summary: "兴奋区与相邻未兴奋区之间形成局部电流；离体神经纤维的刺激点两侧都可发生传导。",
    facts: [
      { label: "传导基础", value: "相邻部位形成局部电流" },
      { label: "传导方式", value: "相邻部位依次兴奋" },
      { label: "结果", value: "动作电位沿神经纤维传导" },
    ],
  },
];
```

- [ ] **Step 5: Replace the old voltage simulation with normalized frame selection**

```ts
import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

export function normalizeProgress(progress: number) {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

export function getActionPotentialFrame(
  mode: ActionPotentialMode,
  progress: number,
): ActionPotentialFrame {
  const p = normalizeProgress(progress);

  if (mode === "resting") {
    return {
      phase: "resting",
      ionMotion: "potassium-out",
      polarity: "outside-positive",
      excitedCenters: [0.5, 0.5],
      localCurrentVisible: false,
    };
  }

  if (mode === "conduction") {
    const distance = p * 0.38;
    return {
      phase: "conducting",
      ionMotion: "sodium-in",
      polarity: "inside-positive",
      excitedCenters: [0.5 - distance, 0.5 + distance],
      localCurrentVisible: true,
    };
  }

  if (p < 0.28) return { phase: "sodium-in", ionMotion: "sodium-in", polarity: "outside-positive", excitedCenters: [0.5, 0.5], localCurrentVisible: false };
  if (p < 0.5) return { phase: "polarity-reversed", ionMotion: "none", polarity: "inside-positive", excitedCenters: [0.5, 0.5], localCurrentVisible: false };
  if (p < 0.78) return { phase: "potassium-out", ionMotion: "potassium-out", polarity: "inside-positive", excitedCenters: [0.5, 0.5], localCurrentVisible: false };
  return { phase: "recovered", ionMotion: "none", polarity: "outside-positive", excitedCenters: [0.5, 0.5], localCurrentVisible: false };
}
```

- [ ] **Step 6: Run the focused test and commit**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: 5 tests PASS.

```bash
git add components/action-potential/types.ts components/action-potential/modeData.ts components/action-potential/simulation.ts tests/action-potential/simulation.test.ts
git commit -m "feat: define action potential three-mode model"
```

---

### Task 2: Mode navigation, scene, and knowledge card

**Files:**
- Create: `components/action-potential/ActionPotentialModeNav.tsx`
- Create: `components/action-potential/ActionPotentialScene.tsx`
- Create: `components/action-potential/ActionPotentialKnowledgeCard.tsx`
- Test: `tests/action-potential/mode-components.test.tsx`

**Interfaces:**
- Consumes: `ActionPotentialMode`, `ActionPotentialFrame`, and `ModeContent` from Task 1.
- Produces: `ActionPotentialModeNav({ mode, onModeChange })`.
- Produces: `ActionPotentialScene({ mode, frame, playing })`.
- Produces: `ActionPotentialKnowledgeCard({ content })`.

- [ ] **Step 1: Write failing component tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential mode components", () => {
  it("announces the selected mode and reports clicks", () => {
    const onModeChange = vi.fn();
    render(<ActionPotentialModeNav mode="resting" onModeChange={onModeChange} />);
    expect(screen.getByRole("button", { name: "静息电位" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "动作电位产生" }));
    expect(onModeChange).toHaveBeenCalledWith("generation");
  });

  it("renders local-current arrows only for conduction", () => {
    const { rerender } = render(<ActionPotentialScene mode="resting" frame={getActionPotentialFrame("resting", 0.2)} playing />);
    expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
    rerender(<ActionPotentialScene mode="conduction" frame={getActionPotentialFrame("conduction", 0.2)} playing />);
    expect(screen.getByLabelText("局部电流方向")).toBeInTheDocument();
    expect(screen.getByLabelText("刺激点")).toBeInTheDocument();
    expect(screen.getAllByTestId("excited-zone")).toHaveLength(2);
  });

  it("renders the exact three knowledge facts", () => {
    render(<ActionPotentialKnowledgeCard content={ACTION_POTENTIAL_MODES[1]} />);
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("Na⁺内流");
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("K⁺外流");
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the tests and verify missing components fail**

Run: `npm test -- tests/action-potential/mode-components.test.tsx`

Expected: FAIL with module-not-found errors for the three new components.

- [ ] **Step 3: Implement the mode navigation and knowledge card**

```tsx
// ActionPotentialModeNav.tsx
import { ACTION_POTENTIAL_MODES } from "./modeData";
import type { ActionPotentialMode } from "./types";

export function ActionPotentialModeNav({ mode, onModeChange }: { mode: ActionPotentialMode; onModeChange: (mode: ActionPotentialMode) => void }) {
  return (
    <nav className="ap-mode-nav" aria-label="动作电位三个模式">
      {ACTION_POTENTIAL_MODES.map((item, index) => (
        <button key={item.id} aria-pressed={mode === item.id} onClick={() => onModeChange(item.id)}>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.label}
        </button>
      ))}
    </nav>
  );
}

// ActionPotentialKnowledgeCard.tsx
import type { ModeContent } from "./types";

export function ActionPotentialKnowledgeCard({ content }: { content: ModeContent }) {
  return (
    <aside className="ap-knowledge" aria-label="当前模式知识卡">
      <p className="ap-kicker">当前模式</p>
      <h2>{content.title}</h2>
      <p>{content.summary}</p>
      <dl>{content.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    </aside>
  );
}
```

- [ ] **Step 4: Implement the shared DOM/CSS scene**

```tsx
import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

const IONS = [12, 28, 44, 60, 76, 90];

export function ActionPotentialScene({ mode, frame, playing }: { mode: ActionPotentialMode; frame: ActionPotentialFrame; playing: boolean }) {
  const outsideSign = mode === "conduction" || frame.polarity === "outside-positive" ? "+" : "−";
  const insideSign = mode === "conduction" || frame.polarity === "outside-positive" ? "−" : "+";
  return (
    <section className={`ap-scene ap-scene--${mode}`} data-phase={frame.phase} data-playing={playing} data-polarity={frame.polarity} aria-label={`${mode === "resting" ? "静息电位" : mode === "generation" ? "动作电位产生" : "动作电位传导"}动态示意`}>
      <div className="ap-polarity ap-polarity--outside"><span>膜外</span><b>{outsideSign}</b><b>{outsideSign}</b><b>{outsideSign}</b></div>
      <div className="ap-membrane">
        {IONS.map((left, index) => <i key={`channel-${left}`} className={`ap-channel ${index % 2 ? "ap-channel--k" : "ap-channel--na"}`} style={{ left: `${left}%` }} />)}
        {mode === "conduction" && <i className="ap-stimulus-point" aria-label="刺激点" />}
        {mode === "conduction" && frame.excitedCenters.map((center, index) => <i key={index} data-testid="excited-zone" aria-label="兴奋区外负内正" className="ap-excited-zone" style={{ left: `${center * 100}%` }}><span>−</span><span>+</span></i>)}
      </div>
      <div className="ap-polarity ap-polarity--inside"><span>膜内</span><b>{insideSign}</b><b>{insideSign}</b><b>{insideSign}</b></div>
      <div className="ap-ion-layer" aria-hidden="true">
        {IONS.slice(0, 4).map((left) => <i key={`na-${left}`} className="ap-ion ap-ion--na" style={{ left: `${left}%` }}>Na⁺</i>)}
        {IONS.slice(2).map((left) => <i key={`k-${left}`} className="ap-ion ap-ion--k" style={{ left: `${left}%` }}>K⁺</i>)}
      </div>
      {frame.localCurrentVisible && <div className="ap-local-current" aria-label="局部电流方向"><span>←</span><b>局部电流</b><span>→</span></div>}
      <p className="ap-scene-caption">{mode === "resting" ? "K⁺外流，形成外正内负" : mode === "generation" ? "Na⁺先内流，随后K⁺外流" : "相邻部位依次兴奋"}</p>
    </section>
  );
}
```

- [ ] **Step 5: Run focused component tests and commit**

Run: `npm test -- tests/action-potential/mode-components.test.tsx`

Expected: 3 tests PASS.

```bash
git add components/action-potential/ActionPotentialModeNav.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/ActionPotentialKnowledgeCard.tsx tests/action-potential/mode-components.test.tsx
git commit -m "feat: add action potential mode views"
```

---

### Task 3: Lab state, playback, and reduced-motion behavior

**Files:**
- Modify: `components/action-potential/LabControls.tsx`
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Test: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes all Task 1 and Task 2 exports.
- Produces the page-level `ActionPotentialLab` used by `app/models/action-potential/page.tsx`.

- [ ] **Step 1: Replace the old lab tests with the new interaction contract**

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";

describe("ActionPotentialLab", () => {
  let callbacks = new Map<number, FrameRequestCallback>();
  let id = 0;

  beforeEach(() => {
    callbacks = new Map();
    id = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { id += 1; callbacks.set(id, callback); return id; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((frameId: number) => callbacks.delete(frameId)));
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("starts in resting mode with exactly three mode buttons", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByRole("button", { name: /静息电位/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("动作电位三个模式").querySelectorAll("button")).toHaveLength(3);
  });

  it("switches the scene and knowledge card for every mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    expect(screen.getByLabelText("动作电位产生动态示意")).toBeInTheDocument();
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("Na⁺内流");
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    expect(screen.getByLabelText("局部电流方向")).toBeInTheDocument();
  });

  it("resets generation progress when the user returns to that mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    const runNextFrame = (now: number) => {
      const [frameId, callback] = callbacks.entries().next().value!;
      callbacks.delete(frameId);
      act(() => callback(now));
    };
    runNextFrame(0);
    runNextFrame(3000);
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute("data-phase", "potassium-out");
    fireEvent.click(screen.getByRole("button", { name: /静息电位/ }));
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute("data-phase", "sodium-in");
  });

  it("pauses and replays the current mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(callbacks.size).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "重新播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
  });

  it("removes all voltage and advanced experiment UI", () => {
    render(<ActionPotentialLab />);
    expect(document.body).not.toHaveTextContent(/mV|−70|-70/);
    expect(screen.queryByText(/膜电位曲线/)).not.toBeInTheDocument();
    for (const name of ["打开进阶模式", "弱刺激", "教学时间", "记录电极位置", "上一步", "下一步"]) {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
  });

  it("does not schedule animation frames for reduced motion", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    render(<ActionPotentialLab />);
    expect(callbacks.size).toBe(0);
    expect(screen.getByLabelText("静息电位动态示意")).toHaveAttribute("data-playing", "false");
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    expect(screen.getAllByTestId("excited-zone")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the focused lab test and confirm the old UI fails**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: FAIL because the old page still renders advanced controls, a voltage chart, and no mode navigation.

- [ ] **Step 3: Reduce `LabControls` to two actions**

```tsx
export function LabControls({ playing, onTogglePlaying, onReplay }: { playing: boolean; onTogglePlaying: () => void; onReplay: () => void }) {
  return (
    <section className="ap-controls" aria-label="动画控制">
      <button className="ap-control ap-control--primary" onClick={onTogglePlaying}>{playing ? "暂停" : "播放"}</button>
      <button className="ap-control" onClick={onReplay}>重新播放</button>
      <p>离子、通道和传导方向均为教学示意。</p>
    </section>
  );
}
```

- [ ] **Step 4: Replace `ActionPotentialLab` with three-mode state**

```tsx
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
  const staticProgress = mode === "generation" ? 0.38 : mode === "conduction" ? 0.55 : 0;
  const displayedProgress = reducedMotion ? staticProgress : progress;
  const frame = useMemo(() => getActionPotentialFrame(mode, displayedProgress), [mode, displayedProgress]);

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
      setProgress((current) => (current + (now - before) / MODE_DURATION_MS) % 1);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); previousTime.current = null; };
  }, [playing, reducedMotion]);

  const restart = () => { setProgress(0); setPlaying(true); };
  const changeMode = (nextMode: ActionPotentialMode) => { setMode(nextMode); restart(); };

  return (
    <main className="lab-shell" aria-labelledby="lab-title">
      <header className="lab-header"><p className="eyebrow">选择性必修 1 · 神经调节</p><h1 id="lab-title">动作电位的形成和传导</h1><p>切换三个模式，分别观察静息、产生和传导。</p></header>
      <ActionPotentialModeNav mode={mode} onModeChange={changeMode} />
      <section className="ap-workspace"><ActionPotentialScene mode={mode} frame={frame} playing={playing && !reducedMotion} /><ActionPotentialKnowledgeCard content={content} /></section>
      <LabControls playing={playing && !reducedMotion} onTogglePlaying={() => setPlaying((current) => !current)} onReplay={restart} />
    </main>
  );
}
```

- [ ] **Step 5: Run focused lab tests and commit**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: 6 tests PASS.

```bash
git add components/action-potential/LabControls.tsx components/action-potential/ActionPotentialLab.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: rebuild action potential lab as three modes"
```

---

### Task 4: Visual system, obsolete-file removal, and responsive contracts

**Files:**
- Modify: `components/action-potential/action-potential.css`
- Delete: `components/action-potential/AxonView.tsx`
- Delete: `components/action-potential/PotentialChart.tsx`
- Delete: `components/action-potential/StageExplanation.tsx`
- Modify: `tests/models/touch-targets.test.ts`
- Modify: `tests/site-metadata.test.ts`

**Interfaces:**
- Consumes the class names from Tasks 2 and 3.
- Produces a two-column desktop workspace and a one-column mobile workspace.

- [ ] **Step 1: Add failing static layout contracts**

Add the action-potential stylesheet to `scopedLabStyles`:

```ts
const scopedLabStyles = [
  ["components/action-potential/action-potential.css", ".lab-shell"],
  ["models/03-membrane-potential-curve/membrane-curve.css", ".membrane-shell"],
  ["models/04-meter-deflection/meter-deflection.css", ".meter-shell"],
  ["models/05-humoral-immunity/humoral-immunity.css", ".humoral-shell"],
  ["models/06-cellular-immunity/cellular-immunity.css", ".cellular-shell"],
] as const;
```

Replace the old chart-canvas assertion in `tests/site-metadata.test.ts`:

```ts
it("keeps the action-potential workspace responsive without chart rules", () => {
  const css = readFileSync("components/action-potential/action-potential.css", "utf8");
  expect(css).toMatch(/\.ap-workspace\s*\{[^}]*grid-template-columns:/s);
  expect(css).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*\.ap-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s);
  expect(css).not.toMatch(/\.chart-card|canvas/);
});
```

- [ ] **Step 2: Run the static tests and confirm failure**

Run: `npm test -- tests/models/touch-targets.test.ts tests/site-metadata.test.ts`

Expected: FAIL because the old stylesheet still contains chart styles and lacks the new workspace contract.

- [ ] **Step 3: Replace the stylesheet with the three-mode visual system**

The replacement stylesheet must include these exact structural rules and no `.chart-card` or `canvas` selectors:

```css
:root { --ap-bg:#07111f; --ap-panel:#0d1c2d; --ap-text:#eff8ff; --ap-muted:#9bb3c9; --ap-na:#38d9ff; --ap-k:#aa7cff; --ap-active:#ffd166; --ap-border:rgba(169,204,230,.2); }
.lab-shell { min-height:100vh; padding:clamp(20px,4vw,56px); color:var(--ap-text); background:radial-gradient(circle at 50% 0%,#123250 0,var(--ap-bg) 52%); }
.lab-shell button { min-height:44px; }
.lab-header,.ap-mode-nav,.ap-workspace,.ap-controls { width:min(1180px,100%); margin-inline:auto; }
.lab-header { padding:10px 2px 26px; }
.lab-header h1 { margin:8px 0 12px; font-size:clamp(34px,5vw,58px); }
.lab-header p:last-child { color:var(--ap-muted); }
.ap-mode-nav { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:18px; }
.ap-mode-nav button { display:flex; justify-content:center; align-items:center; gap:9px; border:1px solid var(--ap-border); border-radius:13px; color:var(--ap-text); background:#10263b; }
.ap-mode-nav button[aria-pressed="true"] { border-color:var(--ap-active); color:#091520; background:var(--ap-active); font-weight:850; }
.ap-mode-nav span { font-size:11px; opacity:.75; }
.ap-workspace { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(280px,.8fr); gap:18px; }
.ap-scene,.ap-knowledge,.ap-controls { border:1px solid var(--ap-border); border-radius:22px; background:rgba(13,28,45,.94); box-shadow:0 18px 50px rgba(0,0,0,.22); }
.ap-scene { position:relative; min-height:470px; overflow:hidden; padding:42px 28px; }
.ap-membrane { position:absolute; left:7%; right:7%; top:48%; height:82px; border-block:4px solid #58758e; background:#142b43; }
.ap-polarity { position:absolute; left:8%; right:8%; display:flex; gap:13%; justify-content:center; color:var(--ap-active); }
.ap-polarity--outside { top:18%; }.ap-polarity--inside { bottom:17%; }
.ap-polarity span { position:absolute; left:0; color:var(--ap-muted); }
.ap-channel { position:absolute; top:-10px; width:14px; height:28px; border:2px solid currentColor; border-radius:6px; }
.ap-channel--na { color:var(--ap-na); }.ap-channel--k { color:var(--ap-k); }
.ap-ion { position:absolute; display:grid; place-items:center; width:34px; height:34px; border-radius:50%; font-style:normal; font-size:11px; font-weight:850; }
.ap-ion--na { top:27%; color:#04141d; background:var(--ap-na); }.ap-ion--k { bottom:24%; color:#160d28; background:var(--ap-k); }
.ap-scene[data-playing="true"][data-phase="sodium-in"] .ap-ion--na { animation:ap-na-in 1.1s ease-in-out infinite; }
.ap-scene[data-playing="true"][data-phase="potassium-out"] .ap-ion--k,.ap-scene--resting[data-playing="true"] .ap-ion--k { animation:ap-k-out 1.4s ease-in-out infinite; }
.ap-stimulus-point { position:absolute; z-index:2; left:50%; top:-18px; width:4px; height:116px; border-radius:4px; background:var(--ap-active); transform:translateX(-50%); }
.ap-excited-zone { position:absolute; top:-4px; bottom:-4px; width:20%; transform:translateX(-50%); background:linear-gradient(90deg,transparent,rgba(255,209,102,.9),transparent); }
.ap-excited-zone span { position:absolute; left:50%; color:#07111f; font-style:normal; font-weight:900; transform:translateX(-50%); }.ap-excited-zone span:first-child { top:5px; }.ap-excited-zone span:last-child { bottom:5px; }
.ap-local-current { position:absolute; left:18%; right:18%; top:34%; display:flex; justify-content:space-between; color:var(--ap-active); }
.ap-scene-caption { position:absolute; left:28px; bottom:24px; margin:0; color:var(--ap-active); font-weight:750; }
.ap-knowledge { padding:24px; }.ap-kicker { color:var(--ap-na); font-size:12px; letter-spacing:.12em; }.ap-knowledge h2 { font-size:28px; }.ap-knowledge>p:not(.ap-kicker) { color:var(--ap-muted); line-height:1.65; }
.ap-knowledge dl { display:grid; gap:10px; }.ap-knowledge dl div { padding:12px; border:1px solid var(--ap-border); border-radius:12px; }.ap-knowledge dt { color:var(--ap-muted); font-size:12px; }.ap-knowledge dd { margin:5px 0 0; color:var(--ap-active); font-weight:800; }
.ap-controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:18px; padding:16px; }.ap-controls p { margin:0 0 0 auto; color:var(--ap-muted); font-size:12px; }
.ap-control { padding:9px 16px; border:1px solid var(--ap-border); border-radius:11px; color:var(--ap-text); background:#143149; }.ap-control--primary { color:#07111f; background:var(--ap-na); font-weight:850; }
@keyframes ap-na-in { from { transform:translateY(-52px); } to { transform:translateY(84px); } }
@keyframes ap-k-out { from { transform:translateY(48px); } to { transform:translateY(-88px); } }
@media (max-width:760px) { .lab-shell { padding:18px 12px 32px; }.ap-mode-nav { gap:6px; }.ap-mode-nav button { flex-direction:column; gap:2px; padding:6px 3px; font-size:12px; }.ap-workspace { grid-template-columns:1fr; }.ap-scene { min-height:390px; padding-inline:14px; }.ap-controls p { width:100%; margin-left:0; }.ap-polarity { gap:11%; } }
@media (prefers-reduced-motion:reduce) { .lab-shell *, .lab-shell *::before, .lab-shell *::after { animation-duration:.001ms!important; animation-iteration-count:1!important; transition-duration:.001ms!important; } }
```

- [ ] **Step 4: Delete the obsolete experiment-only components**

Delete these files after `rg` confirms they have no remaining imports:

```bash
rg -n "AxonView|PotentialChart|StageExplanation" app components tests
```

Expected before deletion: only the three file declarations themselves. Remove them with `apply_patch` file deletions.

- [ ] **Step 5: Run static tests, focused action tests, and commit**

Run: `npm test -- tests/models/touch-targets.test.ts tests/site-metadata.test.ts tests/action-potential`

Expected: all selected tests PASS.

```bash
git add components/action-potential tests/models/touch-targets.test.ts tests/site-metadata.test.ts
git commit -m "feat: finish action potential three-mode presentation"
```

---

### Task 5: Full verification and interactive click audit

**Files:**
- No source changes expected.
- Add a regression test only if the browser audit exposes a repeatable defect.

**Interfaces:**
- Consumes the complete three-mode page.
- Produces a validated production build ready for Sites packaging.

- [ ] **Step 1: Run the complete automated verification**

```bash
npm test
npm run lint
npm run build
```

Expected: every test file passes, ESLint exits 0, and vinext reports `Build complete` with `/models/action-potential` listed.

- [ ] **Step 2: Start a local server and audit the desktop click path**

Run: `npm run dev -- --port 3001`

In the in-app browser, verify in order:

1. `静息电位` is selected on first load.
2. Click `动作电位产生`; the scene caption becomes `Na⁺先内流，随后K⁺外流` and the knowledge card shows both ions.
3. Click `暂停`; ion movement freezes and the button changes to `播放`.
4. Click `重新播放`; playback restarts and the button changes to `暂停`.
5. Click `动作电位传导`; local-current arrows appear and the excited zone moves.
6. Confirm the page contains no `mV`, no voltage chart, and no advanced controls.
7. Confirm the browser console has no errors.

- [ ] **Step 3: Audit the 390 × 844 mobile layout**

Set the browser viewport to `390 × 844`, reload `/models/action-potential`, and verify:

1. All three mode buttons remain visible and readable.
2. The scene and knowledge card stack in one column.
3. No horizontal overflow exists (`document.documentElement.scrollWidth === document.documentElement.clientWidth`).
4. Every visible button is at least 44 pixels high.

- [ ] **Step 4: Re-run verification after any audit fix**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0. If no browser defect was found, this is a fresh completion check rather than a code-change step.

- [ ] **Step 5: Commit only if the audit produced a fix**

```bash
git add components/action-potential tests/action-potential tests/models/touch-targets.test.ts tests/site-metadata.test.ts
git commit -m "fix: polish action potential mode interactions"
```

Skip this commit when the worktree is clean.

---

## Deployment Handoff

After Task 5 passes, follow the existing Sites workflow because `.openai/hosting.json` is present: push the exact validated commit, rebuild in the main project directory, package that exact `dist`, save a new version, obtain approval if the resolved access level requires it, deploy, poll until `succeeded`, and open the deployed URL. Verify that the saved archive contains `NeuralLearningGuide` only for the other neural pages and contains the new action-potential mode assets for this page.
