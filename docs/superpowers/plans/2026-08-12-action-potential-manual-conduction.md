# Action Potential Manual Conduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every Na⁺ stream with its visible membrane pore and replace automatic conduction playback with seven user-driven causal teaching steps.

**Architecture:** Keep resting and generation on the existing looping progress model. Add a discrete `ConductionStep` frame builder plus a short per-step transition progress owned by `ActionPotentialLab`; local-current and action-potential animations complete inside one macro step, then stop until the user clicks “下一步”. Move charge and sodium visuals into fixed 25%/75% lanes so particles can travel vertically through the pore without a horizontal bypass.

**Tech Stack:** React 19, TypeScript 5.9, CSS/SVG keyframes, Vitest 4, Testing Library, Vinext/Next.js, exact Codex in-app Browser.

## Global Constraints

- Preserve exactly three modes: 静息电位、动作电位产生、动作电位传导.
- Preserve one shared open-ended fiber with exactly seven stable membrane-segment DOM nodes.
- Do not add free/background Na⁺ or K⁺ ions in this change.
- Resting K⁺ outflow and generation looping remain automatic.
- In every segment, the charge column is exactly `left: 25%`; top/bottom sodium channels and streams are exactly `left: 75%`.
- Sodium particles stay vertically centered on the matching channel pore; remove every sodium bypass keyframe and `--ion-bypass-x` rule.
- Preserve four charge slots per segment and atomic polarity quartets: resting `＋,−,−,＋`, excited `−,＋,＋,−`.
- Conduction macro steps are exactly: central action potential → local current 1 → adjacent action potential 1 → local current 2 → adjacent action potential 2 → local current 3 → adjacent action potential 3 / summary.
- Only a user click on “下一步” may start the next macro step. Internal animation completion must never auto-start the following macro step.
- Each local-current step has exactly four short arcs. Each path draws tail-to-head for 520 ms with delays `0/60/120/180 ms`, then holds complete.
- Each action-potential step lasts 1400 ms: channels open during `0–300 ms`, bilateral sodium influx during `300–1150 ms`, atomic charge flip at `1150 ms`, stable hold until `1400 ms`.
- Conduction controls are “下一步” and “重新演示”; “下一步” is disabled while a step animates and after completion.
- Final copy is exactly `神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。`
- Reduced motion uses zero RAF/CSS motion and makes each click land directly on the completed static macro step.
- Do not add voltage curves, `mV`, `-70`, repolarization, hyperpolarization, recovery, electrodes, extra modes, or ambient ion distributions.
- At 1280×720 and 390×844: pore/particle horizontal-center deviation is at most 1 px; channels, particles, charges, current arcs, labels and controls do not intersect or overflow; `scrollWidth === clientWidth`.

---

### Task 1: Put charges and Na⁺ transport in fixed, aligned lanes

**Files:**

- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/visual-contracts.test.ts`
- Test: `tests/action-potential/mode-components.test.tsx`

**Interfaces:**

- Consumes: the existing `IonChannel` / `IonStream` top and bottom surface DOM.
- Produces: a stable `25%` charge lane and `75%` Na⁺ channel/stream lane with vertical-only particle travel.

- [ ] **Step 1: Replace the bypass contract with failing alignment tests**

In `visual-contracts.test.ts`, replace `routes sodium around charge columns while rejoining each membrane pore` with:

```ts
it("keeps charges and sodium transport in separate fixed lanes", () => {
  expect(ruleBody(".ap-segment-charge")).toMatch(/left:\s*25%\s*;/);
  expect(ruleBody(".ap-ion-channel")).toMatch(/left:\s*75%\s*;/);
  expect(ruleBody(".ap-ion-stream")).toMatch(/left:\s*75%\s*;/);
  expect(stylesheet).not.toMatch(/--ion-bypass-x/);
  expect(stylesheet).not.toMatch(/ap-sodium-bypass-(?:up|down)/);
});

it("moves sodium on the same vertical axis as its pore", () => {
  const particleRule = ruleBody(".ap-ion-particle");
  expect(particleRule).toMatch(
    /transform:\s*translate\(-50%,\s*var\(--ion-start-y\)\) scale\(\.82\)/,
  );
  expect(particleRule).not.toMatch(/translate:\s*var\(--ion-bypass-x\)/);
  expect(ruleBody(".ap-ion-stream--sodium")).not.toMatch(/animation-name:/);
});
```

Keep the existing bilateral direction and three-particle component tests. Add to `mode-components.test.tsx`:

```tsx
it("keeps each sodium stream on the same surface and segment as its channel", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.55)}
      playing
    />,
  );
  const center = container.querySelector('[data-segment-id="3"]')!;
  for (const surface of ["top", "bottom"]) {
    expect(
      center.querySelector(
        `[data-channel-species="sodium"][data-membrane-surface="${surface}"]`,
      ),
    ).toBeTruthy();
    expect(
      center.querySelector(
        `[data-ion-species="sodium"][data-membrane-surface="${surface}"]`,
      ),
    ).toBeTruthy();
  }
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/mode-components.test.tsx
```

Expected: alignment contracts fail because charges/channels/streams still use `50%` and sodium bypass keyframes still exist.

- [ ] **Step 3: Implement fixed lanes and vertical-only sodium travel**

In `action-potential.css`:

```css
.ap-membrane-segment {
  position: relative;
  min-width: 0;
  border-left: 1px solid rgba(70, 74, 78, 0.23);
  background-color: #dff4f4;
  box-shadow: inset 0 8px 14px rgba(255, 255, 255, 0.48);
}

.ap-segment-charge {
  left: 25%;
}

.ap-ion-channel {
  left: 75%;
}

.ap-ion-stream {
  left: 75%;
}

.ap-ion-stream--potassium,
.ap-ion-channel--potassium {
  left: 100%;
}

.ap-ion-particle {
  transform: translate(-50%, var(--ion-start-y)) scale(.82);
  animation-name: ap-ion-cross;
  will-change: transform, opacity;
}
```

Delete:

- `--ion-bypass-x` from desktop/mobile segment rules;
- `.ap-membrane-segment:nth-child(n + 5)` bypass rules;
- sodium top/bottom `animation-name` overrides;
- `@keyframes ap-sodium-bypass-down` and `@keyframes ap-sodium-bypass-up`.

Update reduced-motion particle transform to use only vertical travel:

```css
@media (prefers-reduced-motion: reduce) {
  .ap-ion-particle {
    --ion-static-offset-y: 0px;
    transform: translate(-50%, calc(var(--ion-static-y) + var(--ion-static-offset-y))) scale(.9);
  }

  .ap-ion-particle:nth-of-type(1) { --ion-static-offset-y: -14px; }
  .ap-ion-particle:nth-of-type(3) { --ion-static-offset-y: 14px; }
}
```

- [ ] **Step 4: Verify GREEN and lint**

Run:

```bash
npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/mode-components.test.tsx
npm run lint
```

Expected: focused tests pass and lint exits 0.

- [ ] **Step 5: Commit Task 1**

```bash
git add components/action-potential/action-potential.css tests/action-potential/visual-contracts.test.ts tests/action-potential/mode-components.test.tsx
git commit -m "fix: align ions with membrane pores"
```

---

### Task 2: Replace conduction progress with discrete causal frames

**Files:**

- Modify: `components/action-potential/types.ts`
- Modify: `components/action-potential/simulation.ts`
- Test: `tests/action-potential/simulation.test.ts`
- Test: `tests/action-potential/mode-components.test.tsx`

**Interfaces:**

- Produces: `ConductionStep`, `CONDUCTION_LOCAL_CURRENT_MS`, `CONDUCTION_ACTION_POTENTIAL_MS`, and `getConductionStepFrame(step, progress)`.
- Consumes later: Task 3 uses those exports to drive manual controls and the per-step RAF.

- [ ] **Step 1: Add failing discrete-frame tests**

In `simulation.test.ts`, replace the old conduction-progress table with:

```ts
import {
  CONDUCTION_ACTION_POTENTIAL_MS,
  CONDUCTION_LOCAL_CURRENT_MS,
  getActionPotentialFrame,
  getConductionStepFrame,
} from "../../components/action-potential/simulation";

it("defines exact manual conduction durations", () => {
  expect(CONDUCTION_LOCAL_CURRENT_MS).toBe(700);
  expect(CONDUCTION_ACTION_POTENTIAL_MS).toBe(1400);
});

it.each([
  [0, 1, "excited", [3], null],
  [1, 0, "local-current", [3], 1],
  [2, 1, "neighbor-excited", [2, 3, 4], null],
  [3, 0, "local-current", [2, 3, 4], 2],
  [4, 1, "neighbor-excited", [1, 2, 3, 4, 5], null],
  [5, 0, "local-current", [1, 2, 3, 4, 5], 3],
  [6, 1, "conducted", [0, 1, 2, 3, 4, 5, 6], null],
] as const)("maps manual step %s to %s", (step, progress, phase, excited, current) => {
  const frame = getConductionStepFrame(step, progress);
  expect(frame.phase).toBe(phase);
  expect(frame.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual(excited);
  expect(frame.localCurrentStep).toBe(current);
});

it("opens channels, sends sodium, then flips all target charges", () => {
  const opening = getConductionStepFrame(2, 0.1);
  const influx = getConductionStepFrame(2, 0.5);
  const flipped = getConductionStepFrame(2, 1150 / 1400);

  expect(opening.phase).toBe("sodium-channel-opening");
  expect(opening.segments.filter((item) => item.sodiumChannelOpen).map((item) => item.id)).toEqual([2, 4]);
  expect(influx.phase).toBe("neighbor-sodium-in");
  expect(influx.segments.filter((item) => item.sodiumInflux).map((item) => item.id)).toEqual([2, 4]);
  expect(influx.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([3]);
  expect(flipped.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/simulation.test.ts
```

Expected: compile/test failure because discrete conduction exports do not exist.

- [ ] **Step 3: Add the discrete type and frame builder**

In `types.ts`:

```ts
export type ConductionStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;
```

In `simulation.ts`, remove `CONDUCTION_STAGES` and `CONDUCTION_STAGE_ENDS_MS`, then add:

```ts
import type {
  ActionPotentialFrame,
  ActionPotentialMode,
  ConductionStep,
} from "./types";

export const CONDUCTION_LOCAL_CURRENT_MS = 700;
export const CONDUCTION_ACTION_POTENTIAL_MS = 1400;
const CHANNEL_OPEN_END_MS = 300;
const SODIUM_IN_END_MS = 1150;

const CONDUCTION_ROUNDS = [
  { actionStep: 2, currentStep: 1, before: [3], after: [2, 3, 4], targets: [2, 4] },
  { actionStep: 4, currentStep: 2, before: [2, 3, 4], after: [1, 2, 3, 4, 5], targets: [1, 5] },
  { actionStep: 6, currentStep: 3, before: [1, 2, 3, 4, 5], after: [0, 1, 2, 3, 4, 5, 6], targets: [0, 6] },
] as const;

export function getConductionStepFrame(
  step: ConductionStep,
  progress: number,
): ActionPotentialFrame {
  if (step === 0) {
    return {
      phase: "excited",
      segments: makeSegments([CENTER_SEGMENT]),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "中央膜段已经形成动作电位",
    };
  }

  if (step % 2 === 1) {
    const round = CONDUCTION_ROUNDS[(step - 1) / 2];
    return {
      phase: "local-current",
      segments: makeSegments(round.before, [], [], round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: round.currentStep,
      instruction: `第${round.currentStep}轮局部电流形成`,
    };
  }

  const round = CONDUCTION_ROUNDS[step / 2 - 1];
  const normalized = normalizeProgress(progress);
  const elapsed = normalized * CONDUCTION_ACTION_POTENTIAL_MS;
  const complete = normalized >= 1;
  const finalRound = step === 6;

  if (elapsed < CHANNEL_OPEN_END_MS) {
    return {
      phase: "sodium-channel-opening",
      segments: makeSegments(round.before, round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "局部电流使相邻膜段 Na⁺通道开放",
    };
  }

  if (elapsed < SODIUM_IN_END_MS) {
    return {
      phase: "neighbor-sodium-in",
      segments: makeSegments(round.before, round.targets, round.targets),
      potassiumChannelOpen: false,
      potassiumOutflow: false,
      stimulusVisible: true,
      localCurrentStep: null,
      instruction: "Na⁺从上下通道进入相邻膜段",
    };
  }

  return {
    phase: finalRound && complete ? "conducted" : "neighbor-excited",
    segments: makeSegments(round.after, round.targets),
    potassiumChannelOpen: false,
    potassiumOutflow: false,
    stimulusVisible: true,
    localCurrentStep: null,
    instruction:
      finalRound && complete
        ? "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。"
        : "相邻膜段形成动作电位",
  };
}
```

For compatibility, make `getActionPotentialFrame("conduction", progress)` return `getConductionStepFrame(0, 1)` and migrate every conduction-specific fixture to `getConductionStepFrame` in Tasks 2–4. The lab must never use `progress` to advance conduction.

Use these exact fixture replacements in `mode-components.test.tsx` and `simulation.test.ts`:

```text
old conduction 0.05  → getConductionStepFrame(1, 0)
old conduction 0.16  → getConductionStepFrame(2, 0.5)
old conduction 0.26  → getConductionStepFrame(2, 1)
old conduction 0.34  → getConductionStepFrame(3, 0)
old conduction 0.45  → getConductionStepFrame(4, 0.5)
old conduction 0.56  → getConductionStepFrame(4, 1)
old conduction 0.64  → getConductionStepFrame(5, 0)
old conduction 0.75  → getConductionStepFrame(6, 0.5)
old conduction 0.86  → getConductionStepFrame(6, 1150 / 1400)
old conduction 0.95 or 1 → getConductionStepFrame(6, 1)
```

- [ ] **Step 4: Verify GREEN and migrate component fixtures**

Run:

```bash
npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx
npm run lint
```

Expected: focused tests pass and lint exits 0.

- [ ] **Step 5: Commit Task 2**

```bash
git add components/action-potential/types.ts components/action-potential/simulation.ts tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx
git commit -m "feat: model manual conduction steps"
```

---

### Task 3: Add “下一步” controls and per-step playback

**Files:**

- Create: `components/action-potential/ConductionControls.tsx`
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/lab.test.tsx`

**Interfaces:**

- Consumes: Task 2 `ConductionStep`, duration constants and `getConductionStepFrame`.
- Produces: manual `下一步` / `重新演示` controls; one RAF only while the current macro step animates.

- [ ] **Step 1: Write failing manual-control tests**

Replace automatic conduction tests in `lab.test.tsx` with:

```tsx
it("waits for next-step clicks between conduction macro steps", () => {
  const { container } = render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));

  expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute("data-phase", "excited");
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(1);
  expect(callbacks.size).toBe(0);

  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute("data-phase", "local-current");
  expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
  runNextFrame(0);
  runNextFrame(700);
  expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
  expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);

  runNextFrame(5000);
  expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute("data-phase", "local-current");
});

it("plays one adjacent action potential and stops", () => {
  const { container } = render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  runNextFrame(0);
  runNextFrame(700);
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));

  runNextFrame(0);
  runNextFrame(300);
  expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute("data-phase", "neighbor-sodium-in");
  expect(container.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(12);
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(1);

  runNextFrame(1150);
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(3);
  runNextFrame(1400);
  expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
  expect(callbacks.size).toBe(0);
});

it("uses zero RAF and immediate completed steps for reduced motion", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  const { container } = render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
  fireEvent.click(screen.getByRole("button", { name: "下一步" }));
  expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);
  expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused lab tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/lab.test.tsx
```

Expected: tests fail because conduction still starts an automatic one-shot timeline and no “下一步” button exists.

- [ ] **Step 3: Create focused conduction controls**

Create `ConductionControls.tsx`:

```tsx
interface ConductionControlsProps {
  step: number;
  busy: boolean;
  complete: boolean;
  onNext: () => void;
  onReplay: () => void;
}

export function ConductionControls({
  step,
  busy,
  complete,
  onNext,
  onReplay,
}: ConductionControlsProps) {
  return (
    <section className="ap-controls" aria-label="传导步骤控制">
      <button
        type="button"
        className="ap-control ap-control--primary"
        disabled={busy || complete}
        onClick={onNext}
      >
        下一步
      </button>
      <button type="button" className="ap-control" onClick={onReplay}>
        重新演示
      </button>
      <p aria-live="polite">
        {busy ? "本步动画播放中" : complete ? "传导演示完成" : `当前第${step + 1}步，共7步`}
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Implement the manual step driver in `ActionPotentialLab`**

Add state and refs:

```tsx
const [conductionStep, setConductionStep] = useState<ConductionStep>(0);
const [conductionProgress, setConductionProgress] = useState(1);
const [conductionBusy, setConductionBusy] = useState(false);
const conductionProgressRef = useRef(1);
```

Build the frame explicitly:

```tsx
const displayedConductionProgress = reducedMotion ? 1 : conductionProgress;
const frame = useMemo(
  () =>
    mode === "conduction"
      ? getConductionStepFrame(conductionStep, displayedConductionProgress)
      : getActionPotentialFrame(mode, reducedMotion && mode === "generation" ? 0.55 : progress),
  [mode, progress, reducedMotion, conductionStep, displayedConductionProgress],
);
```

Restrict the existing automatic RAF effect to `mode !== "conduction"`. Add a second effect:

```tsx
useEffect(() => {
  if (
    !motionPreferenceReady ||
    mode !== "conduction" ||
    !conductionBusy ||
    reducedMotion
  ) return;

  let frameId = 0;
  let previous: number | null = null;
  const duration =
    conductionStep % 2 === 1
      ? CONDUCTION_LOCAL_CURRENT_MS
      : CONDUCTION_ACTION_POTENTIAL_MS;

  const tick = (now: number) => {
    const before = previous ?? now;
    previous = now;
    const next = conductionProgressRef.current + (now - before) / duration;
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
```

Add handlers:

```tsx
const restartConduction = () => {
  setConductionStep(0);
  conductionProgressRef.current = 1;
  setConductionProgress(1);
  setConductionBusy(false);
  setAnimationEpoch((current) => current + 1);
};

const nextConductionStep = () => {
  if (conductionBusy || conductionStep >= 6) return;
  const next = (conductionStep + 1) as ConductionStep;
  setConductionStep(next);
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
```

Reset conduction state in `changeMode`. Use `effectivePlaying = mode === "conduction" ? conductionBusy && !reducedMotion : playing && !reducedMotion`. Render:

```tsx
{mode === "conduction" ? (
  <ConductionControls
    step={conductionStep}
    busy={conductionBusy}
    complete={conductionStep === 6 && conductionProgress >= 1}
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
```

- [ ] **Step 5: Verify GREEN and responsive control sizing**

Run:

```bash
npm test -- tests/action-potential/lab.test.tsx
npm run lint
```

Expected: manual conduction tests pass; existing resting/generation loop tests pass; lint exits 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add components/action-potential/ConductionControls.tsx components/action-potential/ActionPotentialLab.tsx components/action-potential/action-potential.css tests/action-potential/lab.test.tsx
git commit -m "feat: step through action potential conduction"
```

---

### Task 4: Draw local current tail-to-head and add the final teaching conclusion

**Files:**

- Modify: `components/action-potential/LocalCurrentFlow.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `components/action-potential/modeData.ts`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`
- Test: `tests/action-potential/lab.test.tsx`

**Interfaces:**

- `LocalCurrentFlow({ step, drawing })` consumes Task 3 scene play state.
- `ActionPotentialScene` uses `frame.phase === "conducted"` for the summary; all-excited settle frames do not show the summary early.

- [ ] **Step 1: Write failing current-draw and summary tests**

Add to `mode-components.test.tsx`:

```tsx
it("draws four current paths tail-to-head and reveals arrows when complete", () => {
  const frame = getConductionStepFrame(1, 0);
  const { container, rerender } = render(
    <ActionPotentialScene mode="conduction" frame={frame} playing />,
  );
  const drawing = Array.from(container.querySelectorAll("[data-current-arc]"));
  expect(drawing).toHaveLength(4);
  expect(drawing.map((path) => path.getAttribute("pathLength"))).toEqual(["1", "1", "1", "1"]);
  expect(drawing.every((path) => path.getAttribute("marker-end") === null)).toBe(true);

  rerender(<ActionPotentialScene mode="conduction" frame={frame} playing={false} />);
  expect(
    Array.from(container.querySelectorAll("[data-current-arc]")).every(
      (path) => path.getAttribute("marker-end") !== null,
    ),
  ).toBe(true);
});

it("shows the exact final bidirectional teaching conclusion", () => {
  render(
    <ActionPotentialScene
      mode="conduction"
      frame={getConductionStepFrame(6, 1)}
      playing={false}
    />,
  );
  expect(
    screen.getByText("神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。"),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
});
```

Add to `visual-contracts.test.ts`:

```ts
it("draws local-current paths once from tail to head and holds", () => {
  const arc = ruleBody(".ap-current-arc");
  expect(arc).toMatch(/stroke-dasharray:\s*1\s*;/);
  expect(arc).toMatch(/stroke-dashoffset:\s*1\s*;/);
  expect(arc).toMatch(/animation:\s*ap-current-draw 520ms ease-out both\s*;/);
  expect(arc).toMatch(/animation-delay:\s*calc\(var\(--arc-index\) \* 60ms\)\s*;/);
  expect(arc).not.toMatch(/infinite/);
  expect(stylesheet).toMatch(/@keyframes ap-current-draw[\s\S]*?to\s*\{\s*stroke-dashoffset:\s*0/);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts tests/action-potential/lab.test.tsx
```

Expected: current paths lack `pathLength`, use infinite dashed motion, expose markers immediately, and no exact final conclusion exists.

- [ ] **Step 3: Make current paths draw once and hold**

Change `LocalCurrentFlow`:

```tsx
import type { CSSProperties } from "react";

interface LocalCurrentFlowProps {
  step: 1 | 2 | 3;
  drawing: boolean;
}

export function LocalCurrentFlow({ step, drawing }: LocalCurrentFlowProps) {
  const pairs = ROUND_PAIRS[step];

  return (
    <svg
      className="ap-current-arcs"
      viewBox="0 0 700 160"
      preserveAspectRatio="none"
      role="img"
      aria-labelledby={`ap-current-title-${step}`}
      aria-describedby={`ap-current-description-${step}`}
      data-current-step={step}
    >
      <title id={`ap-current-title-${step}`}>局部电流方向</title>
      <desc id={`ap-current-description-${step}`}>
        膜内局部电流向两侧未兴奋区；膜外局部电流返回兴奋区
      </desc>
      <defs>
        <marker id="ap-current-arrow-inside" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path className="ap-current-arrow--inside" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker id="ap-current-arrow-outside" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path className="ap-current-arrow--outside" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      {pairs.flatMap(({ side, source, target }, pairIndex) => {
        const sourceX = centerX(source);
        const targetX = centerX(target);
        const midpoint = (sourceX + targetX) / 2;
        const outsideEndX = sourceX + (side === "left" ? -OUTSIDE_ARROW_CLEARANCE : OUTSIDE_ARROW_CLEARANCE);
        const outsideMidpoint = (targetX + outsideEndX) / 2;
        return [
          <path
            key={`inside-${side}`}
            className="ap-current-arc ap-current-arc--inside"
            d={`M ${sourceX} 93 Q ${midpoint} 111 ${targetX} 93`}
            pathLength={1}
            markerEnd={drawing ? undefined : "url(#ap-current-arrow-inside)"}
            data-current-arc={`${step}-inside-${side}`}
            data-current-layer="inside"
            data-current-direction="outward"
            data-current-side={side}
            data-source-segment={source}
            data-target-segment={target}
            data-current-drawing={drawing}
            style={{ "--arc-index": pairIndex * 2 } as CSSProperties}
          />,
          <path
            key={`outside-${side}`}
            className="ap-current-arc ap-current-arc--outside"
            d={`M ${targetX} 22 Q ${outsideMidpoint} 4 ${outsideEndX} 22`}
            pathLength={1}
            markerEnd={drawing ? undefined : "url(#ap-current-arrow-outside)"}
            data-current-arc={`${step}-outside-${side}`}
            data-current-layer="outside"
            data-current-direction="inward"
            data-current-side={side}
            data-source-segment={target}
            data-target-segment={source}
            data-current-drawing={drawing}
            style={{ "--arc-index": pairIndex * 2 + 1 } as CSSProperties}
          />,
        ];
      })}
    </svg>
  );
}
```

Implement both inside and outside paths with their matching marker IDs; calculate `arcIndex = pairIndex * 2 + layerIndex`, producing `0,1,2,3`.

Pass scene play state from `ActionPotentialScene`:

```tsx
<LocalCurrentFlow
  key={`local-current-${animationEpoch}`}
  step={frame.localCurrentStep}
  drawing={playing}
/>
```

Replace current CSS:

```css
.ap-current-arc {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  vector-effect: non-scaling-stroke;
  animation: ap-current-draw 520ms ease-out both;
  animation-delay: calc(var(--arc-index) * 60ms);
  animation-play-state: paused;
}

.ap-scene[data-playing="true"] .ap-current-arc {
  animation-play-state: running;
}

.ap-current-arc[data-current-drawing="false"] {
  animation: none;
  stroke-dashoffset: 0;
}

@keyframes ap-current-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}
```

In reduced motion, set `animation: none !important; stroke-dashoffset: 0`.

- [ ] **Step 4: Render the final summary separately from physical current arcs**

In `ActionPotentialScene`, define completion only by phase:

```tsx
const conductionComplete = mode === "conduction" && frame.phase === "conducted";
```

Replace the permanent conduction sentence with:

```tsx
{mode === "conduction" && conductionComplete ? (
  <div className="ap-conduction-summary" role="status">
    <span aria-hidden="true">←</span>
    <b>神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。</b>
    <span aria-hidden="true">→</span>
  </div>
) : mode === "conduction" ? (
  <p className="ap-bidirectional">每次点击“下一步”，观察局部电流与动作电位依次形成</p>
) : null}
```

Add responsive `.ap-conduction-summary` styling that keeps the exact copy readable at 390 px. Update conduction `modeData.ts` result to the same exact conclusion.

- [ ] **Step 5: Verify GREEN and final-step controls**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts tests/action-potential/lab.test.tsx
npm run lint
```

Expected: focused tests pass; final step has no current paths, exact summary is present, and “下一步” is disabled.

- [ ] **Step 6: Commit Task 4**

```bash
git add components/action-potential/LocalCurrentFlow.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css components/action-potential/modeData.ts tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts tests/action-potential/lab.test.tsx
git commit -m "feat: reveal local current step by step"
```

---

### Task 5: Complete automation and exact browser acceptance

**Files:**

- Append: `.superpowers/sdd/action-potential-visual-polish-verification.md`
- Evidence: `.superpowers/sdd/evidence/manual-conduction-*.jpg`

**Interfaces:**

- Consumes: finished Tasks 1–4.
- Produces: fresh automated and exact in-app Browser evidence for delivery.

- [ ] **Step 1: Run the complete automated chain once**

Run in order:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0 with no warnings/errors attributable to the change.

- [ ] **Step 2: Verify generation at 1280×720**

Using only the exact Codex in-app Browser at `http://localhost:3002/models/action-potential`:

- observe a full generation loop;
- in both upper and lower influx, measure every visible Na⁺ particle center against the corresponding channel pore center; horizontal deviation must be `≤1 px`;
- verify the channel opens horizontally, charges flip atomically only after influx, and the loop restarts;
- pause/replay once and confirm nodes/animation resume behavior.

- [ ] **Step 3: Verify all seven manual conduction states at 1280×720**

Record after each click:

```text
1/7 central AP: excited [3], 0 current arcs
2/7 local current 1: exactly 4 tail-to-head arcs, then hold
3/7 AP 1: influx [2,4], then excited [2,3,4], stop
4/7 local current 2: exactly 4 arcs, then hold
5/7 AP 2: influx [1,5], then excited [1,2,3,4,5], stop
6/7 local current 3: exactly 4 arcs, then hold
7/7 AP 3/summary: excited [0…6], 0 current arcs, exact conclusion
```

During every busy interval “下一步” is disabled. After every non-final interval it is enabled and the state remains unchanged for at least 800 ms without a click. “重新演示” returns to state 1/7.

- [ ] **Step 4: Repeat geometry and interaction at 390×844**

Verify:

- `innerWidth = clientWidth = scrollWidth = 390`;
- all seven segments, 28 charges, 14 Na⁺ channels, particles, current arcs, three compartment labels, two manual controls and summary stay within width;
- no charge/channel/particle/current/label pair intersects;
- pore/particle horizontal-center deviation is `≤1 px` for top/bottom generation and each conduction influx round;
- both controls are at least 44×44 px.

- [ ] **Step 5: Verify reduced motion and prohibited scope**

Use the automated reduced-motion tests as evidence if the exact Browser cannot emulate the media feature. Confirm zero RAF and direct completed static steps after each click. Scan all modes for:

```text
mV, -70, −70, 曲线, 复极化, 超极化, 恢复, 游离离子
```

Expected: 0 matches. Page console warnings/errors: 0.

- [ ] **Step 6: Append the verification report and commit only if tracked files changed**

Append a `Manual conduction and pore-alignment follow-up` section to `.superpowers/sdd/action-potential-visual-polish-verification.md` containing the exact HEAD, command results, seven-step trace, geometry numbers, screenshots, accessibility/reduced-motion evidence and limitations.

If a real defect is found, return to TDD: write one failing focused test, implement the minimal fix, rerun the covering checks, then repeat affected Browser states. Do not modify product code merely to manufacture evidence.

Commit tracked verification/test changes:

```bash
git add .superpowers/sdd/action-potential-visual-polish-verification.md tests/action-potential
git commit -m "docs: verify manual action potential conduction"
```
