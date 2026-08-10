# Action Potential Reference-Logic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the incorrect moving-wavefront animation with a seven-segment model that shows stimulus, Na⁺ channel opening, Na⁺ influx, local current, and stepwise bidirectional recruitment without curves, voltage values, repolarization, or recovery.

**Architecture:** Keep `getActionPotentialFrame(mode, progress)` as the pure source of truth, but replace coordinate-based `excitedCenters` with seven explicit membrane-segment frames. `ActionPotentialScene` renders one persistent segmented fiber, while `ActionPotentialLab` owns playback and treats generation and conduction as one-shot modes.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vinext/Vite.

## Global Constraints

- Keep exactly three modes: `静息电位`, `动作电位产生`, `动作电位传导`.
- All modes reuse one horizontal shared-fiber scene and one persistent `data-testid="shared-fiber"` node.
- Use exactly seven membrane segments, indexed `0` through `6`; segment `3` is the stimulus segment.
- Do not render curves, axes, voltage values, `mV`, `-70`, or `−70`.
- Do not add generation-stage K⁺ efflux, repolarization, hyperpolarization, or recovery.
- During conduction, excited segments only accumulate; no excited segment returns to resting.
- Show intracellular local current in the same direction as conduction and extracellular current in the opposite direction.
- Keep only the three mode buttons, play/pause, and replay controls.
- Support desktop, 390px mobile, 44px minimum control targets, and `prefers-reduced-motion`.

---

## File Structure

- `components/action-potential/types.ts`: seven-segment frame contract.
- `components/action-potential/simulation.ts`: deterministic teaching frames.
- `components/action-potential/ActionPotentialScene.tsx`: shared fiber, gates, ions, charges, and current arrows.
- `components/action-potential/ActionPotentialLab.tsx`: progress, stopping, pause, mode reset, and replay.
- `components/action-potential/modeData.ts`: approved copy and duration.
- `components/action-potential/action-potential.css`: segmented membrane and responsive presentation.
- `tests/action-potential/simulation.test.ts`: sequence and monotonic recruitment tests.
- `tests/action-potential/mode-components.test.tsx`: semantic rendering and direction tests.
- `tests/action-potential/lab.test.tsx`: control and terminal-state tests.
- `.superpowers/sdd/action-potential-reference-verification.md`: final evidence.

### Task 1: Seven-segment frame model

**Files:**
- Modify: `components/action-potential/types.ts:3-22`
- Modify: `components/action-potential/simulation.ts:1-72`
- Modify: `tests/action-potential/simulation.test.ts:5-58`

**Interfaces:**
- Produces: `SEGMENT_COUNT`, `CENTER_SEGMENT`, `MembraneSegmentFrame`, `LocalCurrentStep`, and `ActionPotentialFrame`.
- Produces: `getActionPotentialFrame(mode: ActionPotentialMode, progress: number): ActionPotentialFrame`.
- Consumed by: Tasks 2 and 3.

- [ ] **Step 1: Write the failing state-sequence tests**

Replace the coordinate-front test with:

```ts
import type { ActionPotentialMode } from "../../components/action-potential/types";

const excitedIds = (mode: ActionPotentialMode, progress: number) =>
  getActionPotentialFrame(mode, progress).segments
    .filter((segment) => segment.polarity === "excited")
    .map((segment) => segment.id);

it("keeps all seven resting segments outside-positive", () => {
  const frame = getActionPotentialFrame("resting", 0.4);
  expect(frame.segments).toHaveLength(7);
  expect(frame.segments.every((segment) => segment.polarity === "resting")).toBe(true);
  expect(frame.segments.every((segment) => !segment.sodiumChannelOpen)).toBe(true);
  expect(frame.potassiumChannelOpen).toBe(true);
  expect(frame.potassiumOutflow).toBe(true);
});

it.each([
  [0.05, "stimulus", [], []],
  [0.25, "sodium-channel-opening", [], [3]],
  [0.55, "sodium-in", [], [3]],
  [0.9, "excited", [3], [3]],
] as const)("maps generation progress %s to %s", (progress, phase, excited, open) => {
  const frame = getActionPotentialFrame("generation", progress);
  expect(frame.phase).toBe(phase);
  expect(excitedIds("generation", progress)).toEqual(excited);
  expect(frame.segments.filter((item) => item.sodiumChannelOpen).map((item) => item.id)).toEqual(open);
  expect(frame.potassiumOutflow).toBe(false);
});

it.each([
  [0.05, "local-current", [3], 1, []],
  [0.16, "neighbor-sodium-in", [3], 1, [2, 4]],
  [0.28, "local-current", [2, 3, 4], 2, []],
  [0.40, "neighbor-sodium-in", [2, 3, 4], 2, [1, 5]],
  [0.52, "local-current", [1, 2, 3, 4, 5], 3, []],
  [0.64, "neighbor-sodium-in", [1, 2, 3, 4, 5], 3, [0, 6]],
  [0.90, "conducted", [0, 1, 2, 3, 4, 5, 6], null, []],
] as const)("maps conduction progress %s to %s", (progress, phase, excited, step, influx) => {
  const frame = getActionPotentialFrame("conduction", progress);
  expect(frame.phase).toBe(phase);
  expect(excitedIds("conduction", progress)).toEqual(excited);
  expect(frame.localCurrentStep).toBe(step);
  expect(frame.segments.filter((item) => item.sodiumInflux).map((item) => item.id)).toEqual(influx);
});

it("only accumulates excited segments during conduction", () => {
  const counts = [0, 0.25, 0.5, 0.75, 1].map((progress) => excitedIds("conduction", progress).length);
  expect(counts).toEqual([...counts].sort((a, b) => a - b));
  expect(excitedIds("conduction", 0)).toEqual([3]);
  expect(excitedIds("conduction", 1)).toEqual([0, 1, 2, 3, 4, 5, 6]);
});
```

- [ ] **Step 2: Run the state test and confirm RED**

Run `npm test -- tests/action-potential/simulation.test.ts`.

Expected: FAIL because `segments`, K⁺ flags, and `localCurrentStep` do not exist and conduction still uses `excitedCenters`.

- [ ] **Step 3: Define the frame contract**

Replace old phase and frame types in `types.ts` with:

```ts
export type ActionPotentialPhase =
  | "resting" | "stimulus" | "sodium-channel-opening" | "sodium-in"
  | "excited" | "local-current" | "neighbor-sodium-in" | "conducted";
export type SegmentPolarity = "resting" | "excited";
export type LocalCurrentStep = 1 | 2 | 3 | null;

export interface MembraneSegmentFrame {
  id: number;
  polarity: SegmentPolarity;
  sodiumChannelOpen: boolean;
  sodiumInflux: boolean;
  currentTarget: boolean;
}

export interface ActionPotentialFrame {
  phase: ActionPotentialPhase;
  segments: readonly MembraneSegmentFrame[];
  potassiumChannelOpen: boolean;
  potassiumOutflow: boolean;
  stimulusVisible: boolean;
  localCurrentStep: LocalCurrentStep;
  instruction: string;
}
```

Delete the old global polarity, open-channel, ion-motion, excited-center, and local-current-visible fields.

- [ ] **Step 4: Implement pure segment construction**

In `simulation.ts`, add:

```ts
export const SEGMENT_COUNT = 7;
export const CENTER_SEGMENT = 3;

function makeSegments(
  excited: readonly number[],
  sodiumOpen: readonly number[] = [],
  sodiumInflux: readonly number[] = [],
  currentTargets: readonly number[] = [],
) {
  return Array.from({ length: SEGMENT_COUNT }, (_, id) => ({
    id,
    polarity: excited.includes(id) ? "excited" as const : "resting" as const,
    sodiumChannelOpen: sodiumOpen.includes(id),
    sodiumInflux: sodiumInflux.includes(id),
    currentTarget: currentTargets.includes(id),
  }));
}
```

Use generation windows `<0.16` stimulus, `<0.36` central channel opening, `<0.72` central Na⁺ influx, then terminal central excitation.

Use these conduction windows:

```ts
const stages = [
  { until: 0.12, phase: "local-current", excited: [3], step: 1, targets: [2, 4], open: [], influx: [] },
  { until: 0.24, phase: "neighbor-sodium-in", excited: [3], step: 1, targets: [2, 4], open: [2, 4], influx: [2, 4] },
  { until: 0.36, phase: "local-current", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [], influx: [] },
  { until: 0.48, phase: "neighbor-sodium-in", excited: [2, 3, 4], step: 2, targets: [1, 5], open: [1, 5], influx: [1, 5] },
  { until: 0.60, phase: "local-current", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [], influx: [] },
  { until: 0.72, phase: "neighbor-sodium-in", excited: [1, 2, 3, 4, 5], step: 3, targets: [0, 6], open: [0, 6], influx: [0, 6] },
] as const;
```

At `normalized >= 0.72`, return `conducted`, all seven segments excited, no current target, and instruction `兴奋已由刺激点传到两侧`.

- [ ] **Step 5: Run the state test and confirm GREEN**

Run `npm test -- tests/action-potential/simulation.test.ts`.

Expected: PASS for seven segments, the central generation sequence, three current/influx pairs, monotonic recruitment, and forbidden-voltage checks.

- [ ] **Step 6: Commit the state model**

```bash
git add components/action-potential/types.ts components/action-potential/simulation.ts tests/action-potential/simulation.test.ts
git commit -m "feat: model stepwise action potential recruitment"
```

### Task 2: Segmented shared-fiber scene

**Files:**
- Modify: `components/action-potential/ActionPotentialScene.tsx:1-157`
- Modify: `components/action-potential/action-potential.css`
- Modify: `tests/action-potential/mode-components.test.tsx:23-110`

**Interfaces:**
- Consumes: Task 1 frame fields.
- Produces: stable segment nodes `data-segment-id="0"` through `"6"`, channel nodes, ion flows, and two local-current direction groups.

- [ ] **Step 1: Write failing scene tests**

Add:

```tsx
it("renders seven semantic segments inside one shared fiber", () => {
  const { container } = render(
    <ActionPotentialScene mode="resting" frame={getActionPotentialFrame("resting", 0)} playing />,
  );
  expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
  expect(container.querySelectorAll("[data-segment-id]")).toHaveLength(7);
  expect(container.querySelectorAll('[data-segment-polarity="resting"]')).toHaveLength(7);
  expect(container.querySelectorAll('[data-channel-species="sodium"]')).toHaveLength(7);
});

it("opens and excites only the central segment during generation", () => {
  const { container, rerender } = render(
    <ActionPotentialScene mode="generation" frame={getActionPotentialFrame("generation", 0.25)} playing />,
  );
  expect(container.querySelectorAll('[data-channel-species="sodium"][data-open="true"]')).toHaveLength(1);
  expect(container.querySelector('[data-segment-id="3"] [data-channel-species="sodium"]')).toHaveAttribute("data-open", "true");
  rerender(<ActionPotentialScene mode="generation" frame={getActionPotentialFrame("generation", 0.9)} playing={false} />);
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(1);
  expect(container.querySelector('[data-segment-id="3"]')).toHaveAttribute("data-segment-polarity", "excited");
});

it("shows opposite extracellular and intracellular current directions", () => {
  render(<ActionPotentialScene mode="conduction" frame={getActionPotentialFrame("conduction", 0.05)} playing />);
  expect(screen.getByLabelText("膜内局部电流向两侧未兴奋区")).toHaveTextContent("←膜内局部电流→");
  expect(screen.getByLabelText("膜外局部电流返回兴奋区")).toHaveTextContent("→膜外回流←");
});
```

Update the shared-node identity assertion to query segment `3` instead of `excited-zone`.

- [ ] **Step 2: Run scene tests and confirm RED**

Run `npm test -- tests/action-potential/mode-components.test.tsx`.

Expected: FAIL because the current scene renders five global channels, moving excited overlays, and one current row.

- [ ] **Step 3: Render seven segments inside the persistent fiber**

Keep one `data-testid="shared-fiber"` node and render:

```tsx
{frame.segments.map((segment) => (
  <div
    key={segment.id}
    className={`ap-membrane-segment ap-membrane-segment--${segment.polarity}`}
    data-segment-id={segment.id}
    data-segment-polarity={segment.polarity}
    data-current-target={segment.currentTarget}
    aria-label={`第${segment.id + 1}膜段${segment.polarity === "excited" ? "外负内正" : "外正内负"}`}
  >
    <span className="ap-segment-charge ap-segment-charge--outside">{segment.polarity === "excited" ? "−" : "+"}</span>
    <i className="ap-gated-channel ap-gated-channel--na" data-channel-species="sodium" data-open={segment.sodiumChannelOpen} aria-label={`第${segment.id + 1}膜段Na⁺通道${segment.sodiumChannelOpen ? "开放" : "关闭"}`} />
    <span className="ap-segment-charge ap-segment-charge--inside">{segment.polarity === "excited" ? "+" : "−"}</span>
    {segment.sodiumInflux && <span className="ap-segment-na-flow" aria-label={`Na⁺进入第${segment.id + 1}膜段`}>Na⁺↓</span>}
  </div>
))}
```

Render one representative K⁺ gate and K⁺ flow only in resting mode. Keep the stimulus fixed above segment `3`.

- [ ] **Step 4: Render both current rows**

When `localCurrentStep !== null`, render:

```tsx
<div className="ap-local-current-system" data-current-step={frame.localCurrentStep}>
  <div className="ap-current-row ap-current-row--outside" aria-label="膜外局部电流返回兴奋区"><span>→</span><b>膜外回流</b><span>←</span></div>
  <div className="ap-current-row ap-current-row--inside" aria-label="膜内局部电流向两侧未兴奋区"><span>←</span><b>膜内局部电流</b><span>→</span></div>
</div>
```

Size the arrow group from `data-current-step`: step 1 reaches segments `2/4`, step 2 reaches `1/5`, and step 3 reaches `0/6`.

- [ ] **Step 5: Replace moving-zone CSS**

Delete `.ap-excited-zone` motion rules. Make `.ap-fiber` a seven-column grid; use equal-width `.ap-membrane-segment` nodes and subtle separators. Draw Na⁺ gates with joined halves when closed and separated halves when open. Use `data-segment-polarity="excited"` for local red highlight and charge reversal. Place outside current above the membrane and inside current below/inside it. Animate ion flow only when the scene has `data-playing="true"`.

- [ ] **Step 6: Run state and scene tests**

Run `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx`.

Expected: PASS with seven semantic segments, local generation, and opposite current directions.

- [ ] **Step 7: Commit the scene**

```bash
git add components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx
git commit -m "feat: render segmented action potential relay"
```

### Task 3: One-shot playback for generation and conduction

**Files:**
- Modify: `components/action-potential/ActionPotentialLab.tsx:20-82`
- Modify: `tests/action-potential/lab.test.tsx:52-153`

**Interfaces:**
- Consumes: terminal frames at progress `1` from Task 1.
- Produces: generation and conduction stop at progress `1`; resting remains the only looping mode.

- [ ] **Step 1: Add failing conduction terminal tests**

Add:

```tsx
it("stops conduction with all seven segments excited", () => {
  const { container } = render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
  runNextFrame(0);
  runNextFrame(7000);
  expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute("data-phase", "conducted");
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(7);
  expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
  expect(callbacks.size).toBe(0);
});

it("restarts completed conduction from the central excited segment", () => {
  const { container } = render(<ActionPotentialLab />);
  fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
  runNextFrame(0);
  runNextFrame(7000);
  fireEvent.click(screen.getByRole("button", { name: "播放" }));
  expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(1);
  expect(container.querySelector('[data-segment-id="3"]')).toHaveAttribute("data-segment-polarity", "excited");
  expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
});
```

Update reduced-motion conduction to expect the representative relay frame with segments `2`, `3`, and `4` excited and disabled playback controls.

- [ ] **Step 2: Run lab tests and confirm RED**

Run `npm test -- tests/action-potential/lab.test.tsx`.

Expected: FAIL because current conduction uses modulo looping and never stops.

- [ ] **Step 3: Make only resting loop**

In `ActionPotentialLab.tsx`, define:

```ts
const isOneShotMode = mode === "generation" || mode === "conduction";
```

Use this animation-loop branch:

```ts
if (isOneShotMode && next >= 1) {
  progressRef.current = 1;
  setProgress(1);
  setPlaying(false);
  return;
}
const nextProgress = mode === "resting" ? next % 1 : next;
```

Use this toggle branch:

```ts
if (isOneShotMode && progress >= 1) {
  restart();
  return;
}
```

Set reduced-motion static progress to `1` for generation and `0.3` for conduction.

- [ ] **Step 4: Run all action-potential tests**

Run `npm test -- tests/action-potential`.

Expected: PASS; resting loops, generation stops centrally excited, conduction stops fully excited, and both one-shot modes replay from the start.

- [ ] **Step 5: Commit playback behavior**

```bash
git add components/action-potential/ActionPotentialLab.tsx tests/action-potential/lab.test.tsx
git commit -m "fix: stop conduction after complete recruitment"
```

### Task 4: Teaching copy and responsive presentation

**Files:**
- Modify: `components/action-potential/modeData.ts:3-43`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/models/touch-targets.test.ts`
- Modify: `tests/site-metadata.test.ts`

**Interfaces:**
- Consumes: `frame.instruction` and semantic segments.
- Produces: approved copy, mobile-safe layout, and no forbidden legacy content.

- [ ] **Step 1: Add failing copy and forbidden-content tests**

Add:

```ts
expect(ACTION_POTENTIAL_MODES[0].summary).toContain("K⁺外流");
expect(ACTION_POTENTIAL_MODES[1].summary).toContain("局部Na⁺通道开放");
expect(ACTION_POTENTIAL_MODES[2].summary).toContain("相邻Na⁺通道依次开放");
expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/曲线|mV|−70|-70|复极化|超极化|恢复/);
```

Render conduction and assert `兴奋由刺激点向两侧逐段传导` is present, while `兴奋区移动` and `动作电位整体平移` are absent.

- [ ] **Step 2: Run copy and layout tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/site-metadata.test.ts tests/models/touch-targets.test.ts
```

Expected: FAIL where old copy lacks the explicit Na⁺ relay wording or selectors no longer match the segmented scene.

- [ ] **Step 3: Apply the approved teaching copy**

Use these exact summaries in `modeData.ts`:

```ts
"K⁺外流，膜两侧保持外正内负。"
"刺激使局部Na⁺通道开放，Na⁺内流，局部变为外负内正。"
"兴奋区形成局部电流，使相邻Na⁺通道依次开放，兴奋由刺激点向两侧逐段传导。"
```

Keep each mode’s three facts aligned to cause, channel/ion change, and result. Display `frame.instruction` as the active scene caption so copy follows the current phase.

- [ ] **Step 4: Complete responsive CSS**

At desktop width, keep the two-column workspace with the scene dominant. At `max-width: 720px`:

- place scene and knowledge card in one column;
- keep the three mode buttons in one row;
- fit all seven segments without horizontal scrolling;
- reduce gate and ion labels without hiding segments;
- stack current labels without overlapping charge signs;
- keep controls and mode buttons at `min-height: 44px`;
- use `clamp()` for caption and label sizes;
- disable transitions and keyframes under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Run focused verification**

Run:

```bash
npm test -- tests/action-potential tests/site-metadata.test.ts tests/models/touch-targets.test.ts
npm run lint
git diff --check
```

Expected: all focused tests pass, ESLint exits `0`, and `git diff --check` has no output.

- [ ] **Step 6: Commit copy and layout**

```bash
git add components/action-potential/modeData.ts components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts tests/site-metadata.test.ts
git commit -m "feat: clarify action potential relay teaching"
```

### Task 5: Final automated and browser verification

**Files:**
- Create: `.superpowers/sdd/action-potential-reference-verification.md`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: reproducible evidence and a merge-readiness conclusion.

- [ ] **Step 1: Run the complete automated verification chain**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
git status --short
```

Expected: all tests pass, lint exits `0`, the build includes `/models/action-potential`, whitespace check is empty, and tracked status is clean.

- [ ] **Step 2: Start browser inspection**

Run `npm run dev -- --port 3002` and open `http://localhost:3002/models/action-potential` in the browser selected for that URL.

- [ ] **Step 3: Verify desktop click paths**

1. Resting: seven resting segments, closed Na⁺ gates, open K⁺ gate, and K⁺ outflow.
2. Generation: stimulus → central Na⁺ gate opens → Na⁺ enters → only segment `3` excites → stop.
3. Conduction: three repetitions of local current → adjacent gates open → new segment pair excites.
4. Terminal conduction: all seven segments remain excited and playback stops without jumping back.
5. Pause during Na⁺ influx; verify the frame holds. Replay; verify reset.

- [ ] **Step 4: Verify current directions**

For every `local-current` frame:

- intracellular arrows point away from the excited region toward the next resting pair;
- extracellular arrows point back toward the excited region;
- highlighted targets remain resting until the following `neighbor-sodium-in` frame.

- [ ] **Step 5: Verify exactly 390×844**

Confirm document scroll width equals `390`; heading, buttons, seven-segment fiber, caption, knowledge card, and controls are not clipped; labels do not overlap; each interactive button is at least 44px high.

- [ ] **Step 6: Check console and record evidence**

Confirm zero console errors. Write `.superpowers/sdd/action-potential-reference-verification.md` with commit hash, test count, lint/build results, desktop observations, current-direction observations, mobile measurements, console error count, and any non-blocking concern.

- [ ] **Step 7: Commit verification if tracked**

If `.superpowers/sdd` is tracked:

```bash
git add .superpowers/sdd/action-potential-reference-verification.md
git commit -m "test: verify reference-based action potential model"
```

If the directory is ignored, leave the report as local evidence and include its absolute path in the handoff.
