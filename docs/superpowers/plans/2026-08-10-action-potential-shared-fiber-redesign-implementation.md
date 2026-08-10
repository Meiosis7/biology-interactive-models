# Action Potential Shared-Fiber Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the three action-potential modes around one persistent textbook-style nerve-fiber diagram, with generation ending at local excitation instead of returning to rest.

**Architecture:** `ActionPotentialLab` continues to own the selected mode, playback, normalized progress, and reduced-motion preference. A pure frame function describes which shared-fiber overlays are active; `ActionPotentialScene` always renders one fixed fiber geometry and changes only charges, ions, channels, stimulus, excited zones, arrows, and labels.

**Tech Stack:** React 19, TypeScript 5.9, CSS transforms and keyframes, Vitest 4, Testing Library, vinext.

## Global Constraints

- The only modes are `静息电位`, `动作电位产生`, and `动作电位传导`.
- All three modes must reuse one horizontal cylindrical nerve-fiber structure with unchanged position, size, and viewing angle.
- Generation shows `刺激 → Na⁺通道开放 → Na⁺内流 → 局部外负内正` and then holds; it must not show K⁺ efflux or recovery to rest.
- Do not render membrane-potential curves, coordinate axes, `mV`, `−70`, `-70`, or any voltage value.
- Do not render recording electrodes, stimulus-strength controls, timelines, speed controls, or advanced experiment controls.
- Keep only the three mode buttons, `播放/暂停`, and `重新播放`.
- Use a light textbook-diagram visual system with dark-gray copy, red key conclusions, and distinct Na⁺/K⁺ colors.
- Reduced-motion users receive a representative static frame while mode switching and knowledge cards remain usable.
- Every button has a minimum 44-pixel hit target, and the page has no horizontal overflow at 390 pixels.

---

## File Map

- Modify `components/action-potential/types.ts`: simplify phases and describe shared-fiber overlays.
- Modify `components/action-potential/simulation.ts`: make generation terminate at an excited frame and keep conduction bidirectional.
- Modify `components/action-potential/modeData.ts`: remove generation recovery/K⁺ copy.
- Modify `components/action-potential/ActionPotentialScene.tsx`: replace the dark membrane cross-section with one persistent cylindrical fiber.
- Modify `components/action-potential/ActionPotentialLab.tsx`: hold generation at its final frame instead of looping.
- Replace `components/action-potential/action-potential.css`: implement the light textbook visual system.
- Modify `tests/action-potential/simulation.test.ts`: lock the new frame contract.
- Modify `tests/action-potential/mode-components.test.tsx`: verify the same fiber node survives all mode changes.
- Modify `tests/action-potential/lab.test.tsx`: verify generation stops without recovery and controls still work.
- Modify `tests/site-metadata.test.ts`: lock the shared-fiber and light-layout CSS contracts.

---

### Task 1: Shared-fiber frame model and teaching data

**Files:**
- Modify: `components/action-potential/types.ts`
- Modify: `components/action-potential/simulation.ts`
- Modify: `components/action-potential/modeData.ts`
- Test: `tests/action-potential/simulation.test.ts`

**Interfaces:**
- Produces: `ActionPotentialMode`, `ActionPotentialPhase`, `ActionPotentialFrame`, `ModeContent`.
- Produces: `ACTION_POTENTIAL_MODES`, `MODE_DURATION_MS`, `normalizeProgress(progress)`, and `getActionPotentialFrame(mode, progress)`.
- Consumes: no React state or DOM APIs.

- [ ] **Step 1: Replace the frame tests with the new failing contract**

```ts
import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential shared-fiber frames", () => {
  it("defines exactly the three requested modes", () => {
    expect(ACTION_POTENTIAL_MODES.map((item) => item.label)).toEqual([
      "静息电位",
      "动作电位产生",
      "动作电位传导",
    ]);
  });

  it("keeps resting outside-positive with an open potassium channel", () => {
    expect(getActionPotentialFrame("resting", 0.4)).toMatchObject({
      phase: "resting",
      polarity: "outside-positive",
      ionMotion: "potassium-out",
      openChannel: "potassium",
      stimulusVisible: false,
      excitedCenters: [],
    });
  });

  it.each([
    [0.05, "stimulus", "none", "outside-positive"],
    [0.35, "sodium-in", "sodium-in", "outside-positive"],
    [0.8, "excited", "none", "inside-positive"],
    [1, "excited", "none", "inside-positive"],
  ] as const)("maps generation progress %s to %s", (progress, phase, ionMotion, polarity) => {
    expect(getActionPotentialFrame("generation", progress)).toMatchObject({
      phase,
      ionMotion,
      polarity,
      stimulusVisible: true,
    });
  });

  it("never adds potassium recovery to generation", () => {
    const generation = ACTION_POTENTIAL_MODES.find((item) => item.id === "generation")!;
    expect(JSON.stringify(generation)).not.toMatch(/K⁺|恢复|静息状态/);
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      expect(getActionPotentialFrame("generation", progress).ionMotion).not.toBe("potassium-out");
    }
  });

  it("moves two conduction fronts away from the central stimulus", () => {
    const early = getActionPotentialFrame("conduction", 0.2).excitedCenters;
    const late = getActionPotentialFrame("conduction", 0.8).excitedCenters;
    expect(early).toHaveLength(2);
    expect(late[0]).toBeLessThan(early[0]);
    expect(late[1]).toBeGreaterThan(early[1]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 1))).not.toMatch(/voltage|mV/);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the old recovery model fails**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: FAIL because `openChannel`, `stimulusVisible`, `stimulus`, and `excited` do not exist and the generation teaching data still contains K⁺ recovery.

- [ ] **Step 3: Replace the frame types with the shared-fiber overlay contract**

```ts
export type ActionPotentialMode = "resting" | "generation" | "conduction";

export type ActionPotentialPhase =
  | "resting"
  | "stimulus"
  | "sodium-in"
  | "excited"
  | "conducting";

export type IonMotion = "potassium-out" | "sodium-in" | "none";
export type MembranePolarity = "outside-positive" | "inside-positive";
export type OpenChannel = "potassium" | "sodium" | "none";

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  ionMotion: IonMotion;
  polarity: MembranePolarity;
  openChannel: OpenChannel;
  stimulusVisible: boolean;
  excitedCenters: readonly number[];
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

- [ ] **Step 4: Replace generation teaching copy so it ends at local excitation**

Keep the resting and conduction entries unchanged. Replace only the generation entry in `ACTION_POTENTIAL_MODES`:

```ts
{
  id: "generation",
  label: "动作电位产生",
  title: "局部动作电位产生",
  summary: "刺激使局部Na⁺通道开放，Na⁺内流后，局部膜变为外负内正。",
  facts: [
    { label: "刺激后的变化", value: "Na⁺通道开放" },
    { label: "主要离子运动", value: "Na⁺内流" },
    { label: "结果", value: "局部形成外负内正的动作电位" },
  ],
},
```

- [ ] **Step 5: Replace the normalized frame function**

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
  const normalized = normalizeProgress(progress);

  if (mode === "resting") {
    return {
      phase: "resting",
      ionMotion: "potassium-out",
      polarity: "outside-positive",
      openChannel: "potassium",
      stimulusVisible: false,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  if (mode === "conduction") {
    const distance = normalized * 0.38;
    return {
      phase: "conducting",
      ionMotion: "none",
      polarity: "inside-positive",
      openChannel: "none",
      stimulusVisible: true,
      excitedCenters: [0.5 - distance, 0.5 + distance],
      localCurrentVisible: true,
    };
  }

  if (normalized < 0.14) {
    return {
      phase: "stimulus",
      ionMotion: "none",
      polarity: "outside-positive",
      openChannel: "none",
      stimulusVisible: true,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  if (normalized < 0.66) {
    return {
      phase: "sodium-in",
      ionMotion: "sodium-in",
      polarity: "outside-positive",
      openChannel: "sodium",
      stimulusVisible: true,
      excitedCenters: [],
      localCurrentVisible: false,
    };
  }

  return {
    phase: "excited",
    ionMotion: "none",
    polarity: "inside-positive",
    openChannel: "sodium",
    stimulusVisible: true,
    excitedCenters: [0.5],
    localCurrentVisible: false,
  };
}
```

- [ ] **Step 6: Run the focused test and commit**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: all shared-fiber frame tests PASS.

```bash
git add components/action-potential/types.ts components/action-potential/simulation.ts components/action-potential/modeData.ts tests/action-potential/simulation.test.ts
git commit -m "feat: model shared-fiber action potential states"
```

---

### Task 2: One persistent nerve-fiber scene for all modes

**Files:**
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Test: `tests/action-potential/mode-components.test.tsx`

**Interfaces:**
- Consumes: `ActionPotentialScene({ mode, frame, playing })` and the Task 1 frame contract.
- Produces: one persistent element with `data-testid="shared-fiber"`, plus mode-specific overlay labels.

- [ ] **Step 1: Replace the scene tests with a failing persistent-node contract**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential shared-fiber components", () => {
  it("announces the selected mode and reports clicks", () => {
    const onModeChange = vi.fn();
    render(<ActionPotentialModeNav mode="resting" onModeChange={onModeChange} />);
    expect(screen.getByRole("button", { name: "静息电位" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "动作电位产生" }));
    expect(onModeChange).toHaveBeenCalledWith("generation");
  });

  it("preserves one shared fiber node while mode overlays change", () => {
    const { rerender } = render(
      <ActionPotentialScene mode="resting" frame={getActionPotentialFrame("resting", 0.2)} playing />,
    );
    const sharedFiber = screen.getByTestId("shared-fiber");
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    rerender(
      <ActionPotentialScene mode="generation" frame={getActionPotentialFrame("generation", 1)} playing={false} />,
    );
    expect(screen.getByTestId("shared-fiber")).toBe(sharedFiber);
    expect(screen.getByLabelText("兴奋区外负内正")).toBeInTheDocument();
    expect(screen.getByText("Na⁺内流")).toBeInTheDocument();
    expect(screen.queryByText("K⁺外流")).not.toBeInTheDocument();
    expect(screen.queryByText(/恢复/)).not.toBeInTheDocument();
  });

  it("renders two wavefronts and local-current arrows for conduction", () => {
    render(
      <ActionPotentialScene mode="conduction" frame={getActionPotentialFrame("conduction", 0.35)} playing />,
    );
    expect(screen.getByLabelText("刺激点")).toBeInTheDocument();
    expect(screen.getByLabelText("局部电流方向")).toHaveTextContent("局部电流");
    expect(screen.getAllByTestId("excited-zone")).toHaveLength(2);
    expect(screen.getAllByText("未兴奋区")).toHaveLength(2);
    expect(screen.getByText("双向传导")).toBeInTheDocument();
  });

  it("renders the exact generation knowledge facts without recovery", () => {
    render(<ActionPotentialKnowledgeCard content={ACTION_POTENTIAL_MODES[1]} />);
    const card = screen.getByLabelText("当前模式知识卡");
    expect(card).toHaveTextContent("Na⁺通道开放");
    expect(card).toHaveTextContent("Na⁺内流");
    expect(card).toHaveTextContent("外负内正");
    expect(card).not.toHaveTextContent(/K⁺|恢复/);
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/action-potential/mode-components.test.tsx`

Expected: FAIL because the existing scene has no `shared-fiber` test id, no fixed cylindrical layers, and generation still uses the old overlays.

- [ ] **Step 3: Replace the scene with one fixed fiber geometry**

```tsx
import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

const CHANNEL_POSITIONS = [16, 34, 50, 66, 84];
const MODE_LABELS: Record<ActionPotentialMode, string> = {
  resting: "静息电位",
  generation: "动作电位产生",
  conduction: "动作电位传导",
};

export function ActionPotentialScene({
  mode,
  frame,
  playing,
}: {
  mode: ActionPotentialMode;
  frame: ActionPotentialFrame;
  playing: boolean;
}) {
  const outsideSign = "+";
  const insideSign = "−";

  return (
    <section
      className={`ap-scene ap-scene--${mode}`}
      data-phase={frame.phase}
      data-playing={playing}
      data-ion-motion={frame.ionMotion}
      data-open-channel={frame.openChannel}
      aria-label={`${MODE_LABELS[mode]}动态示意`}
    >
      <div className="ap-diagram-heading">
        <span>{MODE_LABELS[mode]}</span>
        <b>{mode === "resting" ? "外正内负" : mode === "generation" ? "局部外负内正" : "双向传导"}</b>
      </div>

      <div className="ap-fiber-stage">
        <div className="ap-charge-row ap-charge-row--outside" aria-label={`膜外${outsideSign === "+" ? "正" : "负"}`}>
          <span>膜外</span>{[0, 1, 2, 3, 4, 5, 6].map((item) => <b key={item}>{outsideSign}</b>)}
        </div>

        <div className="ap-fiber" data-testid="shared-fiber">
          <div className="ap-fiber-cap" aria-hidden="true" />
          <div className="ap-fiber-lumen" aria-hidden="true" />
          {CHANNEL_POSITIONS.map((left, index) => (
            <i
              key={left}
              className={`ap-channel ${index % 2 ? "ap-channel--k" : "ap-channel--na"}`}
              data-open={frame.openChannel === (index % 2 ? "potassium" : "sodium")}
              style={{ left: `${left}%` }}
            />
          ))}
          {frame.stimulusVisible && <i className="ap-stimulus" aria-label="刺激点"><span>刺激</span></i>}
          {frame.excitedCenters.map((center, index) => (
            <i
              key={`${mode}-${index}`}
              data-testid="excited-zone"
              className="ap-excited-zone"
              aria-label="兴奋区外负内正"
              style={{ left: `${center * 100}%` }}
            >
              <span className="ap-excited-sign ap-excited-sign--outside">−</span>
              <span className="ap-excited-sign ap-excited-sign--inside">+</span>
            </i>
          ))}
        </div>

        <div className="ap-charge-row ap-charge-row--inside" aria-label={`膜内${insideSign === "+" ? "正" : "负"}`}>
          <span>膜内</span>{[0, 1, 2, 3, 4, 5, 6].map((item) => <b key={item}>{insideSign}</b>)}
        </div>

        {mode === "resting" && <div className="ap-ion-flow ap-ion-flow--k" aria-label="K⁺外流"><i>K⁺</i><span>↑</span><b>K⁺外流</b></div>}
        {mode === "generation" && frame.phase !== "stimulus" && <div className="ap-ion-flow ap-ion-flow--na" aria-label="Na⁺内流"><i>Na⁺</i><span>↓</span><b>Na⁺内流</b></div>}
        {frame.localCurrentVisible && <div className="ap-local-current" aria-label="局部电流方向"><span>←</span><b>局部电流</b><span>→</span></div>}
        {mode === "conduction" && <div className="ap-region-labels"><span>未兴奋区</span><b>兴奋区</b><span>未兴奋区</span></div>}
        {mode === "conduction" && <p className="ap-bidirectional">← 双向传导 →</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run focused component tests and commit**

Run: `npm test -- tests/action-potential/mode-components.test.tsx`

Expected: all shared-fiber component tests PASS.

```bash
git add components/action-potential/ActionPotentialScene.tsx tests/action-potential/mode-components.test.tsx
git commit -m "feat: render one shared nerve fiber for all modes"
```

---

### Task 3: Generation hold behavior and page interactions

**Files:**
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Test: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes: `getActionPotentialFrame(mode, progress)` and `MODE_DURATION_MS`.
- Produces: generation playback that stops at progress `1`; resting and conduction continue looping.

- [ ] **Step 1: Add failing tests for generation completion and forbidden recovery content**

Retain the current default-mode, mode-switching, replay, forbidden-UI, and reduced-motion tests. Add these tests and update the existing mode-switch test to expect the new generation copy:

```tsx
it("stops generation at the excited frame without returning to rest", () => {
  render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
  runNextFrame(0);
  runNextFrame(7000);
  const scene = screen.getByLabelText("动作电位产生动态示意");
  expect(scene).toHaveAttribute("data-phase", "excited");
  expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
  expect(screen.getByLabelText("当前模式知识卡")).not.toHaveTextContent(/K⁺|恢复/);
  expect(screen.queryByLabelText("K⁺外流")).not.toBeInTheDocument();
});

it("restarts a completed generation animation from the stimulus", () => {
  render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
  runNextFrame(0);
  runNextFrame(7000);
  fireEvent.click(screen.getByRole("button", { name: "播放" }));
  expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute("data-phase", "stimulus");
  expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
});
```

Move the existing inline `runNextFrame` helper to the top of the `describe` block so both new tests can use it:

```ts
const runNextFrame = (now: number) => {
  const [frameId, callback] = callbacks.entries().next().value!;
  callbacks.delete(frameId);
  act(() => callback(now));
};
```

- [ ] **Step 2: Run the focused lab tests and verify the loop fails**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: FAIL because the current `% 1` progress calculation returns generation to its first phase instead of holding at `excited`.

- [ ] **Step 3: Make generation stop at its final frame**

Replace the animation progress update inside `tick`:

```ts
setProgress((current) => {
  const next = current + (now - before) / MODE_DURATION_MS;
  if (mode === "generation") return Math.min(1, next);
  return next % 1;
});
```

Add `mode` to the animation effect dependency array:

```ts
}, [mode, playing, reducedMotion]);
```

Add a separate completion effect so the final frame remains visible and playback stops cleanly:

```ts
useEffect(() => {
  if (mode === "generation" && progress >= 1) setPlaying(false);
}, [mode, progress]);
```

Replace the toggle callback with a named function that restarts a completed generation:

```ts
const togglePlaying = () => {
  if (mode === "generation" && progress >= 1) {
    restart();
    return;
  }
  setPlaying((current) => !current);
};
```

Pass it to the controls:

```tsx
<LabControls
  playing={effectivePlaying}
  onTogglePlaying={togglePlaying}
  onReplay={restart}
/>
```

- [ ] **Step 4: Use the final excited frame for reduced motion**

Replace `staticProgress` with:

```ts
const staticProgress = mode === "generation" ? 1 : mode === "conduction" ? 0.55 : 0;
```

- [ ] **Step 5: Run focused lab tests and commit**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: all lab tests PASS, including both generation-completion tests.

```bash
git add components/action-potential/ActionPotentialLab.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: stop generation at local excitation"
```

---

### Task 4: Light textbook visual system and responsive contracts

**Files:**
- Replace: `components/action-potential/action-potential.css`
- Modify: `tests/site-metadata.test.ts`

**Interfaces:**
- Consumes every class name produced by `ActionPotentialLab`, `ActionPotentialModeNav`, `ActionPotentialScene`, `ActionPotentialKnowledgeCard`, and `LabControls`.
- Produces a two-column desktop layout and one-column mobile layout around the same fixed fiber diagram.

- [ ] **Step 1: Replace the old visual static test with a failing textbook-style contract**

```ts
it("uses one responsive textbook-style shared-fiber diagram", () => {
  const css = readFileSync("components/action-potential/action-potential.css", "utf8");
  expect(css).toMatch(/--ap-paper:\s*#f6f3eb/);
  expect(css).toMatch(/\.ap-fiber\s*\{[^}]*border-radius:\s*999px/s);
  expect(css).toMatch(/\.ap-workspace\s*\{[^}]*grid-template-columns:/s);
  expect(css).toMatch(/@media\s*\(max-width:\s*760px\)[\s\S]*\.ap-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s);
  expect(css).not.toMatch(/\.chart-card|canvas/);
});
```

- [ ] **Step 2: Run the static test and confirm the dark design fails**

Run: `npm test -- tests/site-metadata.test.ts tests/models/touch-targets.test.ts`

Expected: FAIL because the current stylesheet has no `--ap-paper` token and the membrane is not a cylindrical `.ap-fiber`.

- [ ] **Step 3: Replace the stylesheet with the light textbook visual system**

Use these exact tokens and structural rules; retain no dark-theme scene rules:

```css
:root {
  --ap-paper: #f6f3eb;
  --ap-paper-strong: #fffefa;
  --ap-ink: #262b30;
  --ap-muted: #667078;
  --ap-line: #aeb4b8;
  --ap-red: #dc2f2f;
  --ap-green: #3f8d2b;
  --ap-blue: #168aad;
  --ap-purple: #7657b9;
  --ap-border: rgba(38, 43, 48, 0.18);
}

.lab-shell {
  min-height: 100vh;
  overflow-x: hidden;
  padding: clamp(20px, 4vw, 56px);
  color: var(--ap-ink);
  background:
    linear-gradient(rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.58)),
    radial-gradient(circle at 20% 15%, rgba(63, 141, 43, 0.08), transparent 34%),
    var(--ap-paper);
}

.lab-shell button { min-height: 44px; }
.lab-header,.ap-mode-nav,.ap-workspace,.ap-controls { width:min(1180px,100%); margin-inline:auto; }
.lab-header { padding:10px 2px 26px; }
.eyebrow { margin:0; color:var(--ap-green); font-size:12px; font-weight:850; letter-spacing:.13em; }
.lab-header h1 { margin:8px 0 12px; font-size:clamp(34px,5vw,58px); line-height:1.08; }
.lab-header>p:last-child { margin:0; color:var(--ap-muted); line-height:1.7; }

.ap-mode-nav { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:18px; }
.ap-mode-nav button { display:flex; align-items:center; justify-content:center; gap:8px; padding:9px 12px; border:1px solid var(--ap-border); border-radius:10px; color:var(--ap-ink); background:rgba(255,255,255,.74); font:inherit; cursor:pointer; }
.ap-mode-nav button[aria-pressed="true"] { border-color:var(--ap-green); color:#fff; background:var(--ap-green); font-weight:850; box-shadow:0 8px 24px rgba(63,141,43,.18); }
.ap-mode-nav button:focus-visible,.ap-control:focus-visible { outline:3px solid rgba(22,138,173,.5); outline-offset:3px; }

.ap-workspace { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(280px,.78fr); gap:18px; }
.ap-scene,.ap-knowledge,.ap-controls { border:1px solid var(--ap-border); border-radius:16px; background:rgba(255,254,250,.93); box-shadow:0 16px 38px rgba(60,55,45,.11); }
.ap-scene { min-width:0; min-height:470px; padding:24px; overflow:hidden; }
.ap-diagram-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:2px solid rgba(63,141,43,.25); padding-bottom:12px; }
.ap-diagram-heading span { font-weight:850; }.ap-diagram-heading b { color:var(--ap-red); }
.ap-fiber-stage { position:relative; min-height:370px; padding-top:75px; }

.ap-fiber { position:absolute; left:8%; right:4%; top:47%; height:86px; border:3px solid #6e7478; border-radius:999px; background:linear-gradient(180deg,#eff1f2,#c9cdd0 45%,#aeb4b8 51%,#d9dcde); box-shadow:inset 0 8px 14px rgba(255,255,255,.72),0 8px 16px rgba(65,68,70,.18); }
.ap-fiber-cap { position:absolute; left:-3px; top:-3px; width:52px; height:86px; border:3px solid #666d72; border-radius:50%; background:radial-gradient(ellipse at 62% 48%,#f8f8f6 0 18%,#bfc4c7 56%,#8e9498 100%); }
.ap-fiber-lumen { position:absolute; inset:18px 18px 18px 35px; border-radius:999px; border:1px solid rgba(70,74,78,.25); background:rgba(255,255,255,.2); }
.ap-channel { position:absolute; z-index:4; top:-9px; width:13px; height:28px; border:2px solid currentColor; border-radius:5px; background:var(--ap-paper-strong); }
.ap-channel--na { color:var(--ap-blue); }.ap-channel--k { color:var(--ap-purple); }
.ap-channel[data-open="true"] { background:currentColor; box-shadow:0 0 0 4px rgba(22,138,173,.12); }

.ap-charge-row { position:absolute; left:8%; right:4%; display:flex; justify-content:space-around; color:var(--ap-red); font-size:20px; }
.ap-charge-row--outside { top:24%; }.ap-charge-row--inside { top:72%; }
.ap-charge-row span { position:absolute; left:-7%; color:var(--ap-muted); font-size:12px; font-weight:700; }
.ap-stimulus { position:absolute; z-index:6; left:50%; top:-42px; width:3px; height:126px; background:var(--ap-red); transform:translateX(-50%); }
.ap-stimulus span { position:absolute; left:50%; bottom:calc(100% + 5px); color:var(--ap-red); font-style:normal; font-size:12px; transform:translateX(-50%); }
.ap-excited-zone { position:absolute; z-index:3; top:-3px; bottom:-3px; width:20%; border-inline:2px solid rgba(220,47,47,.5); background:linear-gradient(90deg,transparent,rgba(220,47,47,.3),transparent); transform:translateX(-50%); transition:left 45ms linear; }
.ap-excited-sign { position:absolute; left:50%; z-index:5; color:var(--ap-red); font-style:normal; font-weight:900; transform:translateX(-50%); }.ap-excited-sign--outside { top:6px; }.ap-excited-sign--inside { bottom:6px; }

.ap-ion-flow { position:absolute; z-index:8; left:49%; top:29%; display:grid; place-items:center; color:var(--ap-red); transform:translateX(-50%); }
.ap-ion-flow i { display:grid; place-items:center; width:38px; height:38px; border-radius:50%; color:#fff; font-style:normal; font-size:11px; font-weight:850; }
.ap-ion-flow--na i { background:var(--ap-blue); }.ap-ion-flow--k i { background:var(--ap-purple); }
.ap-ion-flow span { font-size:27px; line-height:1; }.ap-ion-flow b { font-size:12px; white-space:nowrap; }
.ap-scene[data-playing="true"][data-ion-motion="sodium-in"] .ap-ion-flow--na { animation:ap-na-in 1.1s ease-in-out infinite; }
.ap-scene[data-playing="true"][data-ion-motion="potassium-out"] .ap-ion-flow--k { animation:ap-k-out 1.3s ease-in-out infinite; }
.ap-local-current { position:absolute; left:22%; right:14%; top:37%; display:flex; justify-content:space-between; color:var(--ap-red); font-size:20px; }
.ap-local-current b { font-size:12px; }.ap-region-labels { position:absolute; left:13%; right:8%; top:77%; display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; font-size:12px; }
.ap-region-labels b { color:var(--ap-red); }.ap-bidirectional { position:absolute; left:0; right:0; bottom:5px; margin:0; color:var(--ap-red); font-weight:850; text-align:center; }

.ap-knowledge { min-width:0; padding:24px; }.ap-kicker { margin:0; color:var(--ap-green); font-size:12px; font-weight:850; letter-spacing:.1em; }.ap-knowledge h2 { margin:8px 0 12px; font-size:clamp(24px,2.8vw,30px); }.ap-knowledge>p:not(.ap-kicker) { color:var(--ap-muted); line-height:1.68; }
.ap-knowledge dl { display:grid; gap:10px; margin:22px 0 0; }.ap-knowledge dl div { padding:12px; border-left:4px solid var(--ap-green); background:#f3f1e9; }.ap-knowledge dt { color:var(--ap-muted); font-size:12px; }.ap-knowledge dd { margin:5px 0 0; color:var(--ap-red); font-weight:850; line-height:1.45; }
.ap-controls { display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-top:18px; padding:16px; }.ap-controls p { margin:0 0 0 auto; color:var(--ap-muted); font-size:12px; }.ap-control { padding:9px 16px; border:1px solid var(--ap-border); border-radius:9px; color:var(--ap-ink); background:#fff; font:inherit; cursor:pointer; }.ap-control--primary { border-color:var(--ap-green); color:#fff; background:var(--ap-green); font-weight:850; }

@keyframes ap-na-in { from { transform:translate(-50%,-34px); } to { transform:translate(-50%,70px); } }
@keyframes ap-k-out { from { transform:translate(-50%,65px); } to { transform:translate(-50%,-38px); } }

@media (max-width:760px) {
  .lab-shell { padding:18px 12px 32px; }.lab-header h1 { font-size:clamp(32px,10vw,46px); }
  .ap-mode-nav { gap:6px; }.ap-mode-nav button { flex-direction:column; gap:1px; padding:5px 3px; font-size:12px; }
  .ap-workspace { grid-template-columns:1fr; }.ap-scene { min-height:410px; padding:16px 12px; }
  .ap-fiber-stage { min-height:330px; }.ap-fiber { left:9%; right:2%; height:72px; }.ap-fiber-cap { width:43px; height:72px; }
  .ap-charge-row { left:10%; right:2%; }.ap-charge-row span { left:-9%; }.ap-controls p { width:100%; margin-left:0; }
}

@media (prefers-reduced-motion:reduce) {
  .lab-shell *,.lab-shell *::before,.lab-shell *::after { animation-duration:.001ms!important; animation-iteration-count:1!important; transition-duration:.001ms!important; }
}
```

- [ ] **Step 4: Run the static, touch-target, and action-potential tests**

Run: `npm test -- tests/site-metadata.test.ts tests/models/touch-targets.test.ts tests/action-potential`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit the visual system**

```bash
git add components/action-potential/action-potential.css tests/site-metadata.test.ts
git commit -m "feat: apply textbook shared-fiber presentation"
```

---

### Task 5: Full verification and browser click audit

**Files:**
- No source changes expected.
- Add a regression test only if the browser audit exposes a repeatable defect.

**Interfaces:**
- Consumes the complete shared-fiber redesign.
- Produces a validated build and a reviewed local page.

- [ ] **Step 1: Run the complete automated verification**

Run each command separately:

```bash
npm test
npm run lint
npm run build
```

Expected: every test file passes, ESLint exits `0`, and vinext prints `Build complete` with `/models/action-potential` listed.

- [ ] **Step 2: Start a local server and audit the desktop click path**

Run: `npm run dev -- --port 3002`

Open `http://localhost:3002/models/action-potential` and verify in order:

1. `静息电位` is selected on first load.
2. The page shows exactly one cylindrical shared-fiber element.
3. Static mode shows `外正内负` and `K⁺外流`.
4. Click `动作电位产生`; the same fiber node remains, `Na⁺内流` appears, and the knowledge card contains no `K⁺` or `恢复`.
5. Let generation finish; the scene holds at `excited`, shows local `外负内正`, and the control changes to `播放`.
6. Click `播放`; generation restarts from the stimulus phase.
7. Click `动作电位传导`; two excited zones move outward from the central stimulus and local-current arrows appear.
8. Confirm the page contains no voltage value, curve, recording electrode, or advanced control.
9. Confirm the browser console has no errors.

- [ ] **Step 3: Audit the 390 × 844 mobile layout**

Set the browser viewport to `390 × 844`, reload, and verify:

1. All three mode buttons remain on one row and are readable.
2. The shared fiber fits fully within the scene card.
3. The scene and knowledge card stack in one column.
4. `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
5. Every visible button is at least 44 pixels high.

Reset the viewport override after the audit.

- [ ] **Step 4: Run fresh completion verification after the browser audit**

Run each command separately:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit `0`. If the audit required a code fix, first add a focused failing regression test, verify the failure, implement the fix, and then run this full verification.

- [ ] **Step 5: Commit only when the browser audit produced a fix**

```bash
git add components/action-potential tests/action-potential tests/site-metadata.test.ts
git commit -m "fix: polish shared-fiber action potential interactions"
```

Skip this commit when the worktree is clean.

---

## Completion Handoff

After Task 5 passes, use the finishing-development-branch workflow. The feature branch is `codex/action-potential-three-mode`, its base is `main`, and the isolated worktree is `.worktrees/action-potential-three-mode`. Do not merge, remove the worktree, publish, or deploy without the user's selected handoff option.
