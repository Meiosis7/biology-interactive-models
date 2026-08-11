# Action Potential Looped Causal Conduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make action-potential generation loop automatically, make conduction visibly advance through short local-current arcs → sodium influx → newly formed action potentials, render four vertically fixed charges per segment, and redraw the seven-segment fiber with open ends.

**Architecture:** Preserve the existing React lab, one shared seven-segment frame model, and CSS-driven animation components. Change playback policy so only conduction is one-shot; expand the conduction schedule with a third `neighbor-excited` phase per round; render charge polarity through four stable semantic slots; derive four one-segment SVG arcs from `localCurrentStep`; express the open fiber entirely through border geometry so segment/component identity remains stable.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest 4, Testing Library, Vinext/Next.js.

## Global Constraints

- Preserve exactly three modes: 静息电位、动作电位产生、动作电位传导.
- Preserve one shared fiber with exactly seven stable membrane-segment DOM nodes.
- Generation loops through `stimulus → sodium-channel-opening → sodium-in → excited` without displaying or naming recovery.
- Conduction remains one-shot and uses exactly three rounds of `local-current → neighbor-sodium-in → neighbor-excited`, followed by `conducted`.
- During `neighbor-sodium-in`, targets remain unexcited while their Na⁺ channels open and three Na⁺ particles enter each side.
- During `neighbor-excited`, the target pair becomes excited, Na⁺ particles disappear, and no local-current paths are shown.
- The next local-current phase appears only after the prior pair has become excited.
- The final conduction state has all seven segments excited and stops without recovery or looping.
- Every segment has exactly four vertically fixed charge slots: outside-top, inside-top, inside-bottom, outside-bottom.
- Resting charge order is `＋, −, −, ＋`; excited charge order is `−, ＋, ＋, −` from top to bottom.
- Every `local-current` frame contains exactly two intracellular outward short arcs and two extracellular inward short arcs, spanning only the active adjacent segment pairs.
- Local-current arcs are absent from `neighbor-sodium-in`, `neighbor-excited`, and `conducted` frames.
- The fiber has top and bottom membrane lines but no left/right border, round cap, or capsule outline at desktop or mobile widths.
- Do not add voltage curves, `mV`, `-70`, repolarization, hyperpolarization, recovery, electrodes, advanced controls, or step buttons.
- Retain horizontal channel opening, one-shot Na⁺ particle motion, continuous slower K⁺ outflow, pause retention, contrast, and reduced-motion behavior.

---

### Task 1: Loop generation while keeping conduction one-shot

**Files:**

- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Test: `tests/action-potential/lab.test.tsx`

**Interfaces:**

- Consumes: `ActionPotentialMode`, `MODE_DURATION_MS`, `getActionPotentialFrame(mode, progress)`.
- Produces: playback policy where `resting` and `generation` wrap progress with modulo 1, while `conduction` clamps to progress 1 and stops.

- [ ] **Step 1: Replace the generation-stop tests with failing loop tests**

In `tests/action-potential/lab.test.tsx`, replace the two generation terminal/restart tests with:

```tsx
it("loops generation from the excited hold back to stimulus", () => {
  render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));

  runNextFrame(0);
  runNextFrame(5999);
  expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
    "data-phase",
    "excited",
  );

  runNextFrame(6001);
  expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
    "data-phase",
    "stimulus",
  );
  expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
  expect(callbacks.size).toBe(1);
  expect(screen.getByLabelText("当前模式知识卡")).not.toHaveTextContent(
    /K⁺|恢复/,
  );
});

it("continues the next generation cycle after wrapping", () => {
  render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));

  runNextFrame(0);
  runNextFrame(6001);
  runNextFrame(7001);

  expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
    "data-phase",
    "sodium-channel-opening",
  );
  expect(callbacks.size).toBe(1);
});
```

Keep the conduction stop/restart tests unchanged.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- tests/action-potential/lab.test.tsx
```

Expected: both new generation-loop tests fail because generation currently clamps to 1, stops playback, and leaves no queued animation frame.

- [ ] **Step 3: Make only conduction one-shot**

In `ActionPotentialLab.tsx`, replace the playback-policy lines with:

```tsx
const isOneShotMode = mode === "conduction";
```

Keep the terminal guard, but make the normal progress branch explicit:

```tsx
if (isOneShotMode && next >= 1) {
  progressRef.current = 1;
  setProgress(1);
  setPlaying(false);
  return;
}

const nextProgress = isOneShotMode ? next : next % 1;
progressRef.current = nextProgress;
setProgress(nextProgress);
frameId = requestAnimationFrame(tick);
```

Do not change the existing `restart`, `changeMode`, reduced-motion, or pause state handling. The existing `togglePlaying` terminal restart branch now applies only to completed conduction.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
npm test -- tests/action-potential/lab.test.tsx
npm test
npm run lint
```

Expected: the focused file, full suite, and lint pass; generation keeps a queued frame after wrapping, while conduction still stops at 7/7.

- [ ] **Step 5: Commit Task 1**

```bash
git add components/action-potential/ActionPotentialLab.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: loop action potential generation"
```

---

### Task 2: Add an explicit newly-excited phase to every conduction round

**Files:**

- Modify: `components/action-potential/types.ts`
- Modify: `components/action-potential/simulation.ts`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Test: `tests/action-potential/simulation.test.ts`
- Test: `tests/action-potential/lab.test.tsx`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Consumes: `MODE_DURATION_MS = 6000`, `ActionPotentialFrame`, seven segment IDs `0…6`, sodium particle duration 650 ms plus two 100 ms staggers.
- Produces: `ActionPotentialPhase` member `"neighbor-excited"`; a ten-window conduction schedule with three 1800 ms teaching rounds plus 600 ms terminal hold.

- [ ] **Step 1: Write failing simulation tests for all three teaching beats**

Replace the conduction table in `tests/action-potential/simulation.test.ts` with:

```tsx
it.each([
  [0.05, "local-current", [3], 1, [], []],
  [0.16, "neighbor-sodium-in", [3], null, [2, 4], [2, 4]],
  [0.26, "neighbor-excited", [2, 3, 4], null, [], [2, 4]],
  [0.34, "local-current", [2, 3, 4], 2, [], []],
  [0.45, "neighbor-sodium-in", [2, 3, 4], null, [1, 5], [1, 5]],
  [0.56, "neighbor-excited", [1, 2, 3, 4, 5], null, [], [1, 5]],
  [0.64, "local-current", [1, 2, 3, 4, 5], 3, [], []],
  [0.75, "neighbor-sodium-in", [1, 2, 3, 4, 5], null, [0, 6], [0, 6]],
  [0.86, "neighbor-excited", [0, 1, 2, 3, 4, 5, 6], null, [], [0, 6]],
  [0.95, "conducted", [0, 1, 2, 3, 4, 5, 6], null, [], []],
] as const)(
  "maps conduction progress %s to %s",
  (progress, phase, excited, step, influx, open) => {
    const frame = getActionPotentialFrame("conduction", progress);
    expect(frame.phase).toBe(phase);
    expect(excitedIds("conduction", progress)).toEqual(excited);
    expect(frame.localCurrentStep).toBe(step);
    expect(
      frame.segments.filter((item) => item.sodiumInflux).map((item) => item.id),
    ).toEqual(influx);
    expect(
      frame.segments
        .filter((item) => item.sodiumChannelOpen)
        .map((item) => item.id),
    ).toEqual(open);
  },
);
```

Add a causal-transition test:

```tsx
it("forms each target action potential before starting the next local current", () => {
  const firstInflux = getActionPotentialFrame("conduction", 0.16);
  const firstExcited = getActionPotentialFrame("conduction", 0.26);
  const secondCurrent = getActionPotentialFrame("conduction", 0.34);

  expect(firstInflux.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([3]);
  expect(firstInflux.segments.filter((item) => item.sodiumInflux).map((item) => item.id)).toEqual([2, 4]);
  expect(firstExcited.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
  expect(firstExcited.segments.some((item) => item.sodiumInflux)).toBe(false);
  expect(firstExcited.localCurrentStep).toBeNull();
  expect(secondCurrent.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
  expect(secondCurrent.localCurrentStep).toBe(2);
});
```

- [ ] **Step 2: Write failing component and reduced-motion tests**

In `tests/action-potential/mode-components.test.tsx`, add:

```tsx
it("shows the new action-potential beat without ions or local-current paths", () => {
  const frame = getActionPotentialFrame("conduction", 0.26);
  const { container } = render(
    <ActionPotentialScene mode="conduction" frame={frame} playing />,
  );

  expect(frame.phase).toBe("neighbor-excited");
  expect(screen.getByText("两侧相邻膜段形成动作电位")).toBeInTheDocument();
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(3);
  expect(container.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(0);
  expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
});

it("labels the third newly-excited beat as fully excited", () => {
  render(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", 0.86)}
      playing
    />,
  );

  expect(screen.getByText("全部膜段已兴奋")).toBeInTheDocument();
  expect(screen.queryAllByText("未兴奋区")).toHaveLength(0);
});
```

Update the reduced-motion conduction assertions in `lab.test.tsx` to:

```tsx
expect(conductionScene).toHaveAttribute("data-phase", "neighbor-excited");
expect(
  Array.from(
    conductionScene.querySelectorAll('[data-segment-polarity="excited"]'),
  ).map((segment) => segment.getAttribute("data-segment-id")),
).toEqual(["2", "3", "4"]);
expect(
  conductionScene.querySelectorAll('[data-ion-particle="sodium"]'),
).toHaveLength(0);
expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
```

- [ ] **Step 3: Update the schedule-derived timing contract and confirm RED**

In `visual-contracts.test.ts`, replace the expected conduction window order with:

```tsx
expect(windows.map(({ phase }) => phase)).toEqual([
  "local-current",
  "neighbor-sodium-in",
  "neighbor-excited",
  "local-current",
  "neighbor-sodium-in",
  "neighbor-excited",
  "local-current",
  "neighbor-sodium-in",
  "neighbor-excited",
  "conducted",
]);
```

Add duration assertions derived from the real windows:

```tsx
const currentDurations = windows
  .filter(({ phase }) => phase === "local-current")
  .map(({ durationMs }) => durationMs);
const newlyExcitedDurations = windows
  .filter(({ phase }) => phase === "neighbor-excited")
  .map(({ durationMs }) => durationMs);

expect(currentDurations).toEqual([520, 520, 520]);
expect(newlyExcitedDurations).toEqual([360, 360, 360]);
expect(windows.at(-1)).toEqual({ phase: "conducted", durationMs: 600 });
```

Run:

```bash
npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
```

Expected: tests fail because `neighbor-excited` is not a valid phase, the current schedule contains only seven windows, current paths remain visible during influx, and reduced-motion still selects an influx frame.

- [ ] **Step 4: Add the new phase type and exact conduction schedule**

Add `"neighbor-excited"` to `ActionPotentialPhase` in `types.ts`:

```tsx
export type ActionPotentialPhase =
  | "resting"
  | "stimulus"
  | "sodium-channel-opening"
  | "sodium-in"
  | "excited"
  | "local-current"
  | "neighbor-sodium-in"
  | "neighbor-excited"
  | "conducted";
```

Replace `CONDUCTION_STAGES` in `simulation.ts` with:

```tsx
const CONDUCTION_STAGES = [
  { durationMs: 520, phase: "local-current", excited: [3], step: 1, targets: [2, 4], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [3], step: null, targets: [2, 4], open: [2, 4], influx: [2, 4] },
  { durationMs: 360, phase: "neighbor-excited", excited: [2, 3, 4], step: null, targets: [], open: [2, 4], influx: [] },
  { durationMs: 520, phase: "local-current", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [2, 3, 4], step: null, targets: [1, 5], open: [1, 5], influx: [1, 5] },
  { durationMs: 360, phase: "neighbor-excited", excited: [1, 2, 3, 4, 5], step: null, targets: [], open: [1, 5], influx: [] },
  { durationMs: 520, phase: "local-current", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [], influx: [] },
  { durationMs: 920, phase: "neighbor-sodium-in", excited: [1, 2, 3, 4, 5], step: null, targets: [0, 6], open: [0, 6], influx: [0, 6] },
  { durationMs: 360, phase: "neighbor-excited", excited: [0, 1, 2, 3, 4, 5, 6], step: null, targets: [], open: [0, 6], influx: [] },
] as const;
```

The nine teaching stages total 5400 ms, leaving the existing 6000 ms duration's final 600 ms for `conducted`.

- [ ] **Step 5: Render exact phase instructions and complete-state labels**

In the stage-return block in `simulation.ts`, replace the instruction expression with:

```tsx
instruction:
  stage.phase === "local-current"
    ? "形成局部电流，兴奋向两侧传递"
    : stage.phase === "neighbor-sodium-in"
      ? "局部电流使两侧 Na⁺通道开放，Na⁺内流"
      : "两侧相邻膜段形成动作电位",
```

Change the final instruction to:

```tsx
instruction: "全部膜段已形成动作电位",
```

In `ActionPotentialScene.tsx`, determine completion from frame data so the third `neighbor-excited` phase never displays nonexistent unexcited regions:

```tsx
const conductionComplete =
  mode === "conduction" &&
  frame.segments.every((segment) => segment.polarity === "excited");
```

In `ActionPotentialLab.tsx`, change the reduced-motion conduction progress from `0.42` to `0.26`:

```tsx
const staticProgress =
  mode === "generation" ? 0.55 : mode === "conduction" ? 0.26 : 0;
```

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
npm test
npm run lint
```

Expected: focused tests, full suite, and lint pass; schedule order is exactly nine teaching beats plus `conducted`.

- [ ] **Step 7: Commit Task 2**

```bash
git add components/action-potential/types.ts components/action-potential/simulation.ts components/action-potential/ActionPotentialScene.tsx components/action-potential/ActionPotentialLab.tsx tests/action-potential/simulation.test.ts tests/action-potential/lab.test.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "feat: stage action potential conduction causally"
```

---

### Task 3: Render four vertical charges and four adjacent short-current arcs

**Files:**

- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/LocalCurrentFlow.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Consumes: each segment's `polarity: "resting" | "excited"` and `frame.localCurrentStep: 1 | 2 | 3 | null`.
- Produces: four stable charge slots named `outside-top`, `inside-top`, `inside-bottom`, `outside-bottom`; `LocalCurrentFlow({ step })` with four SVG paths annotated by layer, direction, side, source segment, and target segment.

- [ ] **Step 1: Write failing tests for the four vertical charge slots**

Add to `tests/action-potential/mode-components.test.tsx`:

```tsx
it("renders four vertically ordered charges for every resting segment", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="resting"
      frame={getActionPotentialFrame("resting", 0)}
      playing
    />,
  );

  const segment = container.querySelector('[data-segment-id="3"]')!;
  const charges = Array.from(
    segment.querySelectorAll<HTMLElement>("[data-charge-position]"),
  );
  expect(charges.map((charge) => charge.dataset.chargePosition)).toEqual([
    "outside-top",
    "inside-top",
    "inside-bottom",
    "outside-bottom",
  ]);
  expect(charges.map((charge) => charge.textContent)).toEqual(["＋", "−", "−", "＋"]);
});

it("reverses all four charge signs without moving their slots when excited", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.9)}
      playing={false}
    />,
  );

  const segment = container.querySelector('[data-segment-id="3"]')!;
  const charges = Array.from(
    segment.querySelectorAll<HTMLElement>("[data-charge-position]"),
  );
  expect(charges.map((charge) => charge.dataset.chargePosition)).toEqual([
    "outside-top",
    "inside-top",
    "inside-bottom",
    "outside-bottom",
  ]);
  expect(charges.map((charge) => charge.textContent)).toEqual(["−", "＋", "＋", "−"]);
});
```

- [ ] **Step 2: Write failing tests for exact short-arc count, direction, and round pairs**

Replace the existing opposite-current-path test with:

```tsx
it.each([
  [0.05, "1", [["3", "2"], ["3", "4"]]],
  [0.34, "2", [["2", "1"], ["4", "5"]]],
  [0.64, "3", [["1", "0"], ["5", "6"]]],
] as const)("renders four adjacent short arcs for conduction round %s", (progress, step, pairs) => {
  const { container } = render(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", progress)}
      playing
    />,
  );

  const system = screen.getByLabelText("局部电流方向");
  expect(system).toHaveAttribute("data-current-step", step);
  const inside = Array.from(system.querySelectorAll('[data-current-layer="inside"]'));
  const outside = Array.from(system.querySelectorAll('[data-current-layer="outside"]'));
  expect(inside).toHaveLength(2);
  expect(outside).toHaveLength(2);
  expect(inside.every((path) => path.getAttribute("data-current-direction") === "outward")).toBe(true);
  expect(outside.every((path) => path.getAttribute("data-current-direction") === "inward")).toBe(true);
  expect(inside.map((path) => [path.getAttribute("data-source-segment"), path.getAttribute("data-target-segment")])).toEqual(pairs);
  expect(outside.map((path) => [path.getAttribute("data-target-segment"), path.getAttribute("data-source-segment")])).toEqual(pairs);
  expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);
});

it.each([0.16, 0.26, 0.45, 0.56, 0.75, 0.86, 0.95])(
  "hides current arcs outside local-current at progress %s",
  (progress) => {
    const { container } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", progress)}
        playing
      />,
    );
    expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(0);
  },
);
```

- [ ] **Step 3: Run the focused component tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx
```

Expected: charge tests fail because each segment has only two charge nodes; arc tests fail because the old current component draws full-width tracks and receives no round step.

- [ ] **Step 4: Render the four stable charge slots**

In `ActionPotentialScene.tsx`, replace the two charge spans with:

```tsx
{(["outside-top", "inside-top", "inside-bottom", "outside-bottom"] as const).map(
  (position) => {
    const outside = position.startsWith("outside");
    const positive =
      segment.polarity === "resting" ? outside : !outside;
    return (
      <span
        key={position}
        className={`ap-segment-charge ap-segment-charge--${position}`}
        data-charge-position={position}
        aria-hidden="true"
      >
        {positive ? "＋" : "−"}
      </span>
    );
  },
)}
```

Keep the segment's accessible label (`外正内负` / `外负内正`) unchanged.

- [ ] **Step 5: Replace the full-width current component with exact one-segment arcs**

Replace `LocalCurrentFlow.tsx` with a component whose complete mapping is:

```tsx
const ROUND_PAIRS = {
  1: [{ side: "left", source: 3, target: 2 }, { side: "right", source: 3, target: 4 }],
  2: [{ side: "left", source: 2, target: 1 }, { side: "right", source: 4, target: 5 }],
  3: [{ side: "left", source: 1, target: 0 }, { side: "right", source: 5, target: 6 }],
} as const;

interface LocalCurrentFlowProps {
  step: 1 | 2 | 3;
}

const centerX = (segment: number) => 50 + segment * 100;

export function LocalCurrentFlow({ step }: LocalCurrentFlowProps) {
  const pairs = ROUND_PAIRS[step];
  return (
    <svg
      className="ap-current-arcs"
      viewBox="0 0 700 160"
      preserveAspectRatio="none"
      aria-label="局部电流方向"
    >
      {pairs.flatMap(({ side, source, target }) => {
        const sourceX = centerX(source);
        const targetX = centerX(target);
        const midpoint = (sourceX + targetX) / 2;
        return [
          <path
            key={`inside-${side}`}
            className="ap-current-arc ap-current-arc--inside"
            d={`M ${sourceX} 93 Q ${midpoint} 111 ${targetX} 93`}
            markerEnd="url(#ap-current-arrow-inside)"
            data-current-arc={`${step}-inside-${side}`}
            data-current-layer="inside"
            data-current-direction="outward"
            data-current-side={side}
            data-source-segment={source}
            data-target-segment={target}
          />,
          <path
            key={`outside-${side}`}
            className="ap-current-arc ap-current-arc--outside"
            d={`M ${targetX} 22 Q ${midpoint} 4 ${sourceX} 22`}
            markerEnd="url(#ap-current-arrow-outside)"
            data-current-arc={`${step}-outside-${side}`}
            data-current-layer="outside"
            data-current-direction="inward"
            data-current-side={side}
            data-source-segment={target}
            data-target-segment={source}
          />,
        ];
      })}
    </svg>
  );
}
```

Add one `<defs>` block inside the SVG with `ap-current-arrow-inside` and `ap-current-arrow-outside` markers using `orient="auto"`. In `ActionPotentialScene.tsx`, replace both old layer calls with:

```tsx
<LocalCurrentFlow step={frame.localCurrentStep} />
```

- [ ] **Step 6: Position charge rows and short arcs with CSS**

Replace the old outside/inside charge rules with:

```css
.ap-segment-charge--outside-top { top: -29px; }
.ap-segment-charge--inside-top { top: 10px; }
.ap-segment-charge--inside-bottom { bottom: 10px; }
.ap-segment-charge--outside-bottom { bottom: -29px; }
```

Replace `.ap-current-flow`, `.ap-current-track`, and `.ap-current-dot` layout with:

```css
.ap-local-current-system {
  position: absolute;
  inset: -38px 0 -22px;
  z-index: 6;
  pointer-events: none;
}

.ap-current-arcs {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ap-current-arc {
  fill: none;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: 6 6;
  vector-effect: non-scaling-stroke;
  animation: ap-current-dash 720ms linear infinite;
  animation-play-state: paused;
}

.ap-current-arc--inside { stroke: var(--ap-blue); }
.ap-current-arc--outside { stroke: var(--ap-purple); }
.ap-scene[data-playing="true"] .ap-current-arc { animation-play-state: running; }
```

Remove the step-dependent left/right width rules; `step` now selects paths, not a growing full-width container. Preserve `prefers-reduced-motion` by adding `.ap-current-arc` to the existing animation-disabled selector.

- [ ] **Step 7: Add CSS contracts and run GREEN verification**

Add to `tests/action-potential/visual-contracts.test.ts`:

```tsx
it("keeps four charge rows fixed around the two membrane lines", () => {
  expect(ruleBody(".ap-segment-charge--outside-top")).toMatch(/top:\s*-29px\s*;/);
  expect(ruleBody(".ap-segment-charge--inside-top")).toMatch(/top:\s*10px\s*;/);
  expect(ruleBody(".ap-segment-charge--inside-bottom")).toMatch(/bottom:\s*10px\s*;/);
  expect(ruleBody(".ap-segment-charge--outside-bottom")).toMatch(/bottom:\s*-29px\s*;/);
});

it("draws short current arcs without step-dependent full-width lanes", () => {
  expect(ruleBody(".ap-local-current-system")).toMatch(/inset:\s*-38px 0 -22px\s*;/);
  expect(ruleBody(".ap-current-arc")).toMatch(/stroke-dasharray:\s*6 6\s*;/);
  expect(stylesheet).not.toMatch(/\.ap-local-current-system\[data-current-step=/);
});
```

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
npm test
npm run lint
```

Expected: focused tests, full suite, and lint pass; every segment has four slots and every local-current frame has exactly four one-segment arcs.

- [ ] **Step 8: Commit Task 3**

```bash
git add components/action-potential/ActionPotentialScene.tsx components/action-potential/LocalCurrentFlow.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "feat: clarify charges and local current arcs"
```

---

### Task 4: Redraw the fiber with open ends

**Files:**

- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Consumes: existing `.ap-fiber`, `.ap-membrane-segment:first-child`, and `.ap-membrane-segment:last-child` selectors.
- Produces: the same seven-column fiber box with 3 px top/bottom membrane lines and 0 px left/right borders/radii.

- [ ] **Step 1: Write the failing open-end CSS contract**

Add to `visual-contracts.test.ts`:

```tsx
it("draws the shared fiber with open flat ends", () => {
  const fiberRule = ruleBody(".ap-fiber");
  const firstSegmentRule = ruleBody(".ap-membrane-segment:first-child");
  const lastSegmentRule = ruleBody(".ap-membrane-segment:last-child");

  expect(fiberRule).toMatch(/border-top:\s*3px solid #6e7478\s*;/);
  expect(fiberRule).toMatch(/border-bottom:\s*3px solid #6e7478\s*;/);
  expect(fiberRule).toMatch(/border-left:\s*0\s*;/);
  expect(fiberRule).toMatch(/border-right:\s*0\s*;/);
  expect(fiberRule).toMatch(/border-radius:\s*0\s*;/);
  expect(fiberRule).not.toMatch(/border:\s*3px solid/);
  expect(firstSegmentRule).toMatch(/border-radius:\s*0\s*;/);
  expect(lastSegmentRule).toMatch(/border-radius:\s*0\s*;/);
});
```

- [ ] **Step 2: Run the contract and confirm RED**

Run:

```bash
npm test -- tests/action-potential/visual-contracts.test.ts
```

Expected: the open-end test fails because `.ap-fiber` currently uses a full 3 px border and `999px` radius, and the endpoint segments retain capsule radii.

- [ ] **Step 3: Replace the capsule border with two membrane lines**

In `action-potential.css`, change the fiber border block to:

```css
.ap-fiber {
  position: absolute;
  left: 8%;
  right: 4%;
  top: 47%;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  height: 96px;
  border-top: 3px solid #6e7478;
  border-right: 0;
  border-bottom: 3px solid #6e7478;
  border-left: 0;
  border-radius: 0;
  background: #dff4f4;
  box-shadow:
    inset 0 8px 14px rgba(255, 255, 255, 0.76),
    0 7px 15px rgba(65, 91, 91, 0.14);
}
```

Change the endpoint segment rules to:

```css
.ap-membrane-segment:first-child {
  border-left: 0;
  border-radius: 0;
}

.ap-membrane-segment:last-child {
  border-radius: 0;
}
```

Do not add pseudo-element end caps, clipping masks, side strokes, or rounded mobile overrides.

- [ ] **Step 4: Run focused, responsive-contract, and full verification**

Run:

```bash
npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
npm test
npm run lint
```

Expected: all tests and lint pass; segment count/node identity and control sizes remain unchanged.

- [ ] **Step 5: Commit Task 4**

```bash
git add components/action-potential/action-potential.css tests/action-potential/visual-contracts.test.ts
git commit -m "feat: open the action potential fiber ends"
```

---

### Task 5: Perform final automated and browser acceptance

**Files:**

- Modify: `.superpowers/sdd/action-potential-visual-polish-verification.md`

**Interfaces:**

- Consumes: final branch implementation and the existing tracked verification report.
- Produces: durable automation and in-app Browser evidence for looping generation, three-beat conduction, and open-ended fiber geometry.

- [ ] **Step 1: Run the complete automated chain exactly once**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0; no warnings or whitespace errors remain.

If a command fails, use `systematic-debugging`, add a focused RED regression test, make the minimum fix, run its GREEN test, and then rerun this complete chain once.

- [ ] **Step 2: Verify two generation cycles at 1280×720**

Use the in-app Browser at `http://localhost:3002/models/action-potential` with an exact 1280×720 viewport.

Record a continuous phase trace for at least 12.2 seconds. It must contain:

```text
stimulus → sodium-channel-opening → sodium-in → excited
→ stimulus → sodium-channel-opening → sodium-in → excited
```

Verify the first excited frame wraps directly to stimulus without any recovery text/state, playback remains running, and a fresh three-particle Na⁺ stream mounts in the second cycle. Pause during the second cycle for at least 700 ms, confirm particle/channel positions do not change, then resume. Replay must return immediately to stimulus.

- [ ] **Step 3: Verify the three-beat conduction chain**

Replay conduction once and record all phase/segment transitions:

```text
local-current / excited [3] / targets [2,4]
neighbor-sodium-in / excited [3] / influx [2,4]
neighbor-excited / excited [2,3,4] / no particles or current
local-current / excited [2,3,4] / targets [1,5]
neighbor-sodium-in / excited [2,3,4] / influx [1,5]
neighbor-excited / excited [1,2,3,4,5] / no particles or current
local-current / excited [1,2,3,4,5] / targets [0,6]
neighbor-sodium-in / excited [1,2,3,4,5] / influx [0,6]
neighbor-excited / excited [0,1,2,3,4,5,6] / no particles or current
conducted / excited [0,1,2,3,4,5,6] / stopped
```

Confirm the caption text changes between the three beats, the next local-current paths appear only after the prior target pair is coral/excited, and no ion/current motion remains at the terminal state.

For every `local-current` phase, record exactly four arcs: two inside/outward and two outside/inward. Confirm their adjacent pairs progress as `2↔3 + 3↔4`, then `1↔2 + 4↔5`, then `0↔1 + 5↔6`; confirm all four arcs disappear during influx and newly-excited phases.

- [ ] **Step 4: Verify open fiber ends at desktop and mobile sizes**

At 1280×720 and 390×844, record computed geometry for `.ap-fiber`:

```text
borderTopWidth = 3px
borderBottomWidth = 3px
borderLeftWidth = 0px
borderRightWidth = 0px
borderTopLeftRadius = 0px
borderTopRightRadius = 0px
```

Also verify first/last membrane-segment corner radii are 0 px, all seven segments remain visible, `scrollWidth === clientWidth`, and no charge/channel/ion/current/region label overlaps the open ends. On one resting and one excited segment, measure the four charge centers and confirm a strictly increasing vertical order with fixed horizontal center; visible signs must be `＋,−,−,＋` and `−,＋,＋,−` respectively. Capture direct-viewport screenshots that visibly show both open ends and the four charge rows at:

```text
.superpowers/sdd/action-potential-open-fiber-desktop-1280x720.png
.superpowers/sdd/action-potential-open-fiber-mobile-390x844.png
```

- [ ] **Step 5: Verify reduced motion and forbidden scope**

Use the dedicated reduced-motion test as evidence when the in-app Browser cannot emulate media preferences. Confirm:

- zero requested animation frames;
- disabled Play and Replay;
- generation representative frame is `sodium-in` with three static Na⁺ particles;
- conduction representative frame is `neighbor-excited` with excited `[2,3,4]`, no Na⁺ particles, and no local-current paths;
- mode switching remains usable.

Scan all three modes for forbidden content: `mV`, `-70`, `−70`, 曲线, 复极化, 超极化, 恢复. Expected matches: none.

- [ ] **Step 6: Append evidence and commit the report**

Append a section named `Looped generation, causal conduction, and open-fiber follow-up` to `.superpowers/sdd/action-potential-visual-polish-verification.md`. Include exact command results, phase traces, computed borders, viewport widths, overlap counts, screenshot paths, and reduced-motion limitations.

Run:

```bash
git add .superpowers/sdd/action-potential-visual-polish-verification.md
git commit -m "docs: verify looped action potential flow"
```

---

## Final Acceptance Checklist

- [ ] Generation loops through two observed cycles without recovery or stopping.
- [ ] Generation pause/resume/replay behavior remains correct.
- [ ] Conduction shows three distinct beats in each of three rounds.
- [ ] Newly targeted segments become excited before the next current appears.
- [ ] Third newly-excited beat and terminal frame both show all seven segments excited.
- [ ] Conduction stops and restarts correctly.
- [ ] Every membrane segment has four vertically fixed charge positions; resting reads `＋,−,−,＋` and excited reads `−,＋,＋,−` from top to bottom.
- [ ] Every local-current phase has exactly two inside/outward and two outside/inward short arcs, spanning only its two active adjacent pairs.
- [ ] Short current arcs disappear before sodium influx and remain absent while the new action potentials are shown.
- [ ] Fiber top/bottom lines remain, while both ends have no border/cap/radius.
- [ ] Open-end geometry passes at 1280×720 and 390×844 with all seven segments visible.
- [ ] Reduced-motion representative frames and strict zero-RAF behavior pass.
- [ ] No voltage curve, value, recovery process, or extra control appears.
- [ ] Full tests, lint, build, and diff-check pass.
