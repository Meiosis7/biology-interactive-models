# Action Potential Visual Animation Polish Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to execute this plan task-by-task. Each task must follow `test-driven-development`; use `verification-before-completion` before any completion claim.

**Goal:** Redesign the action-potential scene into a clear, polished textbook animation whose ion-channel petals open horizontally, whose ions visibly pass through the pore, and whose local-current relay remains scientifically and visually legible on desktop and mobile.

**Architecture:** Keep the existing simulation, playback state, three-mode navigation, and single seven-segment fiber unchanged. Extract three small presentational components—`IonChannel`, `IonStream`, and `LocalCurrentFlow`—and let `ActionPotentialScene` compose them from the existing frame fields. CSS owns geometry, color, motion, pause state, and reduced-motion behavior; no new biological state is introduced.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest 4, Testing Library, Vinext/Next.js.

**Global Constraints:**

- Preserve exactly three modes: 静息电位、动作电位产生、动作电位传导.
- Preserve one shared fiber with exactly seven stable membrane segments and the existing simulation phase order.
- Do not add a voltage curve, `mV`, `-70`, recovery/repolarization/hyperpolarization, advanced controls, or any extra biological phase.
- Sodium and potassium channel petals must meet at the center when closed and move left/right when open. Opening rules must not use vertical separation.
- An open-state geometry check must show: left petal x decreases, right petal x increases, each petal vertical-center change is at most 2 px, and the center gap visibly increases.
- Sodium and potassium movement must use 2–3 separate labeled ion particles through the central pore, with a restrained stagger and trail.
- Pausing must retain the current visual position through `animation-play-state: paused`; it must not remove an animation or snap particles/current markers back to their origin.
- Reduced-motion mode shows representative static states, disables playback controls, keeps mode switching available, and contains no moving gate, particle, glow, or current animation.
- Maintain readable layouts at exact 1280×720 and 390×844 viewports, without horizontal overflow or overlapping labels.

---

## Task 1: Replace the vertical pseudo-element gate with a semantic left/right ion channel

**Files:**

- Create: `components/action-potential/IonChannel.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`

### Step 1: Write the failing channel-structure tests

Add focused assertions to `tests/action-potential/mode-components.test.tsx`:

```tsx
it("builds every ion channel from left and right petals around one pore", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.25)}
      playing
    />,
  );

  const channel = container.querySelector(
    '[data-segment-id="3"] [data-channel-species="sodium"]',
  );
  expect(channel).toHaveAttribute("data-open", "true");
  expect(channel?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
  expect(channel?.querySelector('[data-channel-petal="left"]')).toBeTruthy();
  expect(channel?.querySelector('[data-channel-petal="right"]')).toBeTruthy();
  expect(channel?.querySelector('[data-channel-pore]')).toBeTruthy();
  expect(channel?.querySelector('[data-channel-petal="top"]')).toBeNull();
  expect(channel?.querySelector('[data-channel-petal="bottom"]')).toBeNull();
});

it("uses the same horizontal-petal channel structure for potassium", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="resting"
      frame={getActionPotentialFrame("resting", 0.2)}
      playing
    />,
  );

  const potassium = container.querySelector(
    '[data-channel-species="potassium"]',
  );
  expect(potassium).toHaveAttribute("data-open", "true");
  expect(potassium?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
  expect(potassium?.querySelector('[data-channel-petal="left"]')).toBeTruthy();
  expect(potassium?.querySelector('[data-channel-petal="right"]')).toBeTruthy();
});
```

### Step 2: Run the focused test and confirm RED

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx
```

Expected: the two new tests fail because the current `<i>` channels have no left/right petal or pore children.

### Step 3: Add the smallest typed `IonChannel` component

Create `components/action-potential/IonChannel.tsx`:

```tsx
interface IonChannelProps {
  species: "sodium" | "potassium";
  open: boolean;
  label: string;
}

export function IonChannel({ species, open, label }: IonChannelProps) {
  return (
    <i
      className={`ap-ion-channel ap-ion-channel--${species}`}
      data-channel-species={species}
      data-open={open}
      aria-label={label}
    >
      <span
        className="ap-ion-channel__petal ap-ion-channel__petal--left"
        data-channel-petal="left"
        aria-hidden="true"
      />
      <span
        className="ap-ion-channel__pore"
        data-channel-pore
        aria-hidden="true"
      />
      <span
        className="ap-ion-channel__petal ap-ion-channel__petal--right"
        data-channel-petal="right"
        aria-hidden="true"
      />
    </i>
  );
}
```

Replace both `.ap-gated-channel` elements in `ActionPotentialScene.tsx` with `IonChannel`, preserving their existing species, open state, and accessible label.

### Step 4: Implement horizontal petal geometry and the light textbook channel style

Delete the old `.ap-gated-channel::before/::after` rules. Add explicit element rules in `action-potential.css`:

```css
.ap-ion-channel {
  --channel-color: #2597a6;
  --channel-dark: #147481;
  position: absolute;
  top: -15px;
  left: 50%;
  width: 30px;
  height: 34px;
  transform: translateX(-50%);
  z-index: 5;
}

.ap-ion-channel__petal {
  position: absolute;
  top: 5px;
  width: 12px;
  height: 24px;
  border: 2px solid var(--channel-dark);
  background: linear-gradient(180deg, #f7ffff, var(--channel-color));
  box-shadow: 0 2px 6px color-mix(in srgb, var(--channel-color) 28%, transparent);
  transition: transform 300ms cubic-bezier(.2, .8, .2, 1);
  will-change: transform;
}

.ap-ion-channel__petal--left {
  left: 3px;
  border-radius: 9px 4px 4px 9px;
  transform-origin: right center;
  transform: translateX(1px) rotate(0deg);
}

.ap-ion-channel__petal--right {
  right: 3px;
  border-radius: 4px 9px 9px 4px;
  transform-origin: left center;
  transform: translateX(-1px) rotate(0deg);
}

.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--left {
  transform: translateX(-6px) rotate(-8deg);
}

.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--right {
  transform: translateX(6px) rotate(8deg);
}

.ap-ion-channel__pore {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 50%;
  width: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--channel-color) 26%, transparent);
  transform: translateX(-50%) scaleX(.3);
  opacity: 0;
  transition: transform 300ms ease, opacity 200ms ease;
}

.ap-ion-channel[data-open="true"] .ap-ion-channel__pore {
  transform: translateX(-50%) scaleX(1);
  opacity: .8;
}

.ap-ion-channel--potassium {
  --channel-color: #a68ade;
  --channel-dark: #7456b3;
}

```

Do not add any open-state `translateY` rule. Channel state transitions happen only when the simulation advances to a new frame; pausing leaves the current `data-open` state unchanged. Ion and current animations are the elements that require explicit pause retention.

### Step 5: Run focused tests and commit

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx
npm run lint
```

Expected: focused tests and lint pass.

Commit:

```bash
git add components/action-potential/IonChannel.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx
git commit -m "feat: open ion channels horizontally"
```

---

## Task 2: Replace single text pills with staggered pore-crossing ion streams

**Files:**

- Create: `components/action-potential/IonStream.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/lab.test.tsx`

### Step 1: Write failing ion-particle and pause-contract tests

Add to `mode-components.test.tsx`:

```tsx
it("renders three staggerable sodium particles through the active pore", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.55)}
      playing
    />,
  );

  const stream = screen.getByLabelText("Na⁺进入第4膜段");
  expect(stream).toHaveAttribute("data-ion-direction", "inward");
  expect(stream).toHaveAttribute("data-ion-species", "sodium");
  expect(stream.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(3);
  expect(container.querySelectorAll('[data-ion-particle="potassium"]')).toHaveLength(0);
});

it("renders three outward potassium particles only in resting mode", () => {
  render(
    <ActionPotentialScene
      mode="resting"
      frame={getActionPotentialFrame("resting", 0.2)}
      playing
    />,
  );

  const stream = screen.getByLabelText("K⁺外流");
  expect(stream).toHaveAttribute("data-ion-direction", "outward");
  expect(stream.querySelectorAll('[data-ion-particle="potassium"]')).toHaveLength(3);
});
```

Extend the existing pause test in `lab.test.tsx` so the scene retains `data-playing="false"` after pause and returns to `data-playing="true"` after replay. This DOM contract drives CSS `animation-play-state` without changing playback logic.

### Step 2: Run the focused tests and confirm RED

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
```

Expected: particle-count/data-direction assertions fail because the current UI renders one text pill.

### Step 3: Add a typed reusable `IonStream`

Create `components/action-potential/IonStream.tsx`:

```tsx
import type { CSSProperties } from "react";

interface IonStreamProps {
  species: "sodium" | "potassium";
  direction: "inward" | "outward";
  label: string;
}

const ION_LABELS = {
  sodium: "Na⁺",
  potassium: "K⁺",
} as const;

export function IonStream({ species, direction, label }: IonStreamProps) {
  return (
    <span
      className={`ap-ion-stream ap-ion-stream--${species} ap-ion-stream--${direction}`}
      data-ion-species={species}
      data-ion-direction={direction}
      aria-label={label}
    >
      {[0, 1, 2].map((index) => (
        <i
          key={index}
          className="ap-ion-particle"
          data-ion-particle={species}
          style={{ "--ion-index": index } as CSSProperties}
          aria-hidden="true"
        >
          {ION_LABELS[species]}
        </i>
      ))}
    </span>
  );
}
```

Use `IonStream` in `ActionPotentialScene.tsx` for the existing `segment.sodiumInflux` and `frame.potassiumOutflow` conditions. Keep the existing accessible labels verbatim.

### Step 4: Add staggered, pore-centered motion with pause retention

Replace `.ap-segment-na-flow`/`.ap-segment-k-flow` pill rules with:

```css
.ap-ion-stream {
  --ion-color: #168fa0;
  --ion-start-y: -20px;
  --ion-end-y: 34px;
  position: absolute;
  top: -18px;
  left: 50%;
  width: 1px;
  height: 58px;
  z-index: 7;
  pointer-events: none;
}

.ap-ion-stream--potassium {
  --ion-color: #7958b8;
  --ion-start-y: 34px;
  --ion-end-y: -20px;
}

.ap-ion-particle {
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: 1px solid color-mix(in srgb, var(--ion-color) 75%, white);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, white 0 12%, color-mix(in srgb, var(--ion-color) 45%, white) 26%, var(--ion-color) 100%);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--ion-color) 30%, transparent);
  color: white;
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
  transform: translate(-50%, var(--ion-start-y)) scale(.82);
  opacity: 0;
  animation: ap-ion-cross 780ms cubic-bezier(.3, .1, .25, 1) infinite;
  animation-delay: calc(var(--ion-index) * 190ms);
  animation-play-state: paused;
  will-change: transform, opacity;
}

.ap-scene[data-playing="true"] .ap-ion-particle {
  animation-play-state: running;
}

@keyframes ap-ion-cross {
  0% { transform: translate(-50%, var(--ion-start-y)) scale(.78); opacity: 0; }
  18% { opacity: 1; }
  74% { opacity: 1; }
  100% { transform: translate(-50%, var(--ion-end-y)) scale(1); opacity: 0; }
}
```

Add a subtle vertical trail using `.ap-ion-stream::before`, centered on the same pore. Keep the stream inside the segment and beneath the phase caption/controls.

### Step 5: Run focused tests and commit

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
npm run lint
```

Expected: focused tests and lint pass.

Commit:

```bash
git add components/action-potential/IonStream.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: animate ions through channel pores"
```

---

## Task 3: Turn local-current arrows into animated textbook flow paths and polish the scene

**Files:**

- Create: `components/action-potential/LocalCurrentFlow.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/models/touch-targets.test.ts`

### Step 1: Write failing semantic flow-path tests

Replace the old text-arrow dependency in `mode-components.test.tsx` with structural direction checks:

```tsx
it("renders opposite animated paths for intracellular and extracellular current", () => {
  render(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", 0.05)}
      playing
    />,
  );

  const inside = screen.getByLabelText("膜内局部电流向两侧未兴奋区");
  const outside = screen.getByLabelText("膜外局部电流返回兴奋区");
  expect(inside).toHaveAttribute("data-current-direction", "outward");
  expect(outside).toHaveAttribute("data-current-direction", "inward");
  expect(inside.querySelectorAll('[data-current-branch]')).toHaveLength(2);
  expect(outside.querySelectorAll('[data-current-branch]')).toHaveLength(2);
  expect(inside).toHaveTextContent("膜内局部电流");
  expect(outside).toHaveTextContent("膜外回流");
});
```

Keep or add a touch-target regression assertion that all five controls remain at least 44×44 CSS px. This task must not add a new control.

### Step 2: Run focused tests and confirm RED

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
```

Expected: current-direction/branch tests fail because current rows are static arrow text.

### Step 3: Add the reusable local-current SVG component

Create `components/action-potential/LocalCurrentFlow.tsx`:

```tsx
interface LocalCurrentFlowProps {
  layer: "inside" | "outside";
}

export function LocalCurrentFlow({ layer }: LocalCurrentFlowProps) {
  const outward = layer === "inside";
  const label = outward
    ? "膜内局部电流向两侧未兴奋区"
    : "膜外局部电流返回兴奋区";

  return (
    <div
      className={`ap-current-flow ap-current-flow--${layer}`}
      data-current-direction={outward ? "outward" : "inward"}
      aria-label={label}
    >
      <svg viewBox="0 0 400 42" preserveAspectRatio="none" aria-hidden="true">
        <path className="ap-current-track" d="M200 22 C150 22 100 22 28 22" />
        <path className="ap-current-track" d="M200 22 C250 22 300 22 372 22" />
        <circle className="ap-current-dot ap-current-dot--left" r="4" data-current-branch="left" />
        <circle className="ap-current-dot ap-current-dot--right" r="4" data-current-branch="right" />
      </svg>
      <b>{outward ? "膜内局部电流" : "膜外回流"}</b>
    </div>
  );
}
```

If SVG `animateMotion` would ignore the React pause contract, do not use it. Prefer CSS motion paths or animated stroke dashes/dots whose `animation-play-state` can be controlled by `.ap-scene[data-playing]`. Keep two `data-current-branch` elements per layer for the test contract.

Replace the two `.ap-current-row` elements in `ActionPotentialScene.tsx` with `LocalCurrentFlow layer="outside"` and `LocalCurrentFlow layer="inside"` inside the existing `data-current-step` wrapper.

### Step 4: Implement current motion and the approved visual palette

Update `action-potential.css`:

- Use a warm white scene/card background (`#fffdf8` / `#fffaf2`) with a faint mint-blue teaching-grid accent and restrained shadows.
- Give resting segments a pale cyan fill, excited segments a pale coral fill, and current targets a pale blue halo.
- Keep charge symbols high-contrast and visually subordinate to the ion/channel animation.
- Style intracellular paths teal-blue with dots moving from center toward both sides.
- Style extracellular paths muted blue-purple with dots moving from both sides back toward center.
- Set current animations to `animation-play-state: paused` by default and `running` only under `.ap-scene[data-playing="true"]`.
- Use `data-current-step` to widen the current system across one, two, then three neighboring segment pairs without changing frame data.
- Retain the existing labels, teaching caption, one shared fiber, and all seven segment nodes.
- Add a soft 300 ms color/box-shadow transition when a segment becomes excited, and a short target halo pulse before recruitment.
- Keep the full conduction sequence visually around six seconds by styling within the existing phase timing; do not modify `simulation.ts` or `ActionPotentialLab.tsx` timing unless a failing acceptance test proves it necessary.

Use keyed CSS animations rather than timers:

```css
.ap-current-dot,
.ap-current-track {
  animation-play-state: paused;
}

.ap-scene[data-playing="true"] .ap-current-dot,
.ap-scene[data-playing="true"] .ap-current-track {
  animation-play-state: running;
}

.ap-membrane-segment[data-current-target="true"] {
  animation: ap-target-glow 700ms ease-in-out infinite alternate;
  animation-play-state: paused;
}

.ap-scene[data-playing="true"]
  .ap-membrane-segment[data-current-target="true"] {
  animation-play-state: running;
}
```

### Step 5: Add responsive and reduced-motion CSS

At the existing mobile breakpoint:

- Scale channel bodies/petals and ion balls modestly, but keep the pore aligned with the segment center.
- Keep all seven segments inside the viewport; do not hide any channel or charge.
- Place current labels above/below their paths without overlapping the membrane charges.

In `@media (prefers-reduced-motion: reduce)`:

```css
.ap-ion-channel__petal,
.ap-ion-channel__pore,
.ap-ion-particle,
.ap-current-dot,
.ap-current-track,
.ap-membrane-segment {
  animation: none !important;
  transition: none !important;
}

.ap-ion-particle {
  opacity: 1;
  transform: translate(-50%, 6px) scale(.9);
}
```

Offset the three static reduced-motion ion particles horizontally by their index so they remain readable instead of stacking exactly on top of one another.

### Step 6: Run focused tests and commit

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/models/touch-targets.test.ts
npm run lint
```

Expected: all focused tests and lint pass.

Commit:

```bash
git add components/action-potential/LocalCurrentFlow.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
git commit -m "feat: polish action potential relay animation"
```

---

## Task 4: Verify animation geometry, pause behavior, responsiveness, and scope

**Files:**

- Modify if a real defect is found: `components/action-potential/IonChannel.tsx`
- Modify if a real defect is found: `components/action-potential/IonStream.tsx`
- Modify if a real defect is found: `components/action-potential/LocalCurrentFlow.tsx`
- Modify if a real defect is found: `components/action-potential/action-potential.css`
- Modify if a regression test is needed: `tests/action-potential/mode-components.test.tsx`
- Modify if a regression test is needed: `tests/action-potential/lab.test.tsx`
- Create: `.superpowers/sdd/action-potential-visual-polish-verification.md`

### Step 1: Run the complete automated verification chain exactly once

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all tests pass, lint/build exit 0, and `git diff --check` produces no output.

Do not claim completion if any command fails. Diagnose the failure with `systematic-debugging`, add a failing regression test for the defect, make the minimum correction, and rerun the relevant focused test before rerunning this complete chain.

### Step 2: Start the local page and verify exact desktop geometry

Open `http://localhost:3002/models/action-potential` at exactly 1280×720. Verify all three modes and record the following in the report:

- One shared fiber, exactly seven visible membrane segments, no overflow.
- Closed channel: left/right petals meet around one central pore.
- Open sodium channel: left petal x is smaller than closed x; right petal x is larger than closed x; both vertical-center changes are ≤2 px; horizontal gap increases.
- Open potassium channel follows the same left/right rule.
- Generation sequence is still stimulus → one central sodium channel opens → three Na⁺ particles cross that pore → only the center segment becomes excited → stops.
- Conduction still recruits `[2,4]`, then `[1,5]`, then `[0,6]`; current dots flow away from the excited area inside and return toward it outside.
- Final conduction state shows seven excited segments and stops without recovery.
- There are exactly five controls: three mode buttons, play/pause, replay.
- No forbidden text appears: `mV`, `-70`, `−70`, 曲线, 复极化, 超极化, 恢复.

Capture direct-viewport screenshots of a sodium-open generation frame and a local-current conduction frame.

### Step 3: Verify pause retention and replay reset in the browser

During an ion-crossing frame:

1. Record the bounding rectangle/transform of one ion particle and one current marker.
2. Click 暂停.
3. Wait at least 700 ms.
4. Confirm both positions/transforms are unchanged and the scene has `data-playing="false"`.
5. Click 播放 and confirm movement resumes from the retained position.
6. Click 重新播放 and confirm the mode returns to its first frame and later creates a fresh particle/current animation sequence.

If pause snaps to the origin, treat it as a blocking defect. The correction must keep the animation assigned and switch only `animation-play-state`.

### Step 4: Verify the exact mobile viewport

At exactly 390×844 verify:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth === 390`.
- All seven segments, channel petals, charges, ion labels, region labels, and current labels are within the document width.
- No visible label overlaps a membrane charge, channel, ion ball, or control.
- Each control is at least 44×44 CSS px.
- Channel geometry still opens left/right and the central pore remains aligned with its membrane segment.

Capture one direct-viewport screenshot showing the complete fiber and controls.

### Step 5: Verify reduced-motion behavior from the dedicated test

Use the existing `lab.test.tsx` reduced-motion case as automated evidence for `matchMedia(...).matches === true`, zero queued animation frames, representative static frames, disabled play/replay, and working mode buttons. Confirm the CSS media query removes gate, particle, current, halo, and segment motion.

If the browser controller cannot emulate reduced motion, state that limitation in the report; do not change macOS accessibility preferences and do not claim a browser observation that was not made.

### Step 6: Write the evidence report and commit any final verified fix

Record command outputs, viewport measurements, closed/open petal rectangles, pause snapshots, forbidden-text scan, screenshots, and any limitations in `.superpowers/sdd/action-potential-visual-polish-verification.md`.

If verification required no code change, do not create an empty commit. If it exposed and you fixed a defect, run the relevant RED/GREEN test and the complete chain again, then commit only that fix:

```bash
git add components/action-potential/IonChannel.tsx components/action-potential/IonStream.tsx components/action-potential/LocalCurrentFlow.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
git commit -m "fix: refine action potential animation polish"
```

---

## Final Acceptance Checklist

- [ ] Channel markup has only left/right petals and one pore for both Na⁺ and K⁺.
- [ ] Browser geometry proves horizontal opening with ≤2 px vertical drift.
- [ ] Three labeled ions pass through the open pore with staggered motion.
- [ ] Intracellular current flows outward; extracellular current returns inward.
- [ ] Pausing freezes particles/current in place; playing resumes; replay restarts.
- [ ] Warm, light textbook styling is consistent and scientifically legible.
- [ ] Three modes, seven segments, phase logic, and terminal states remain unchanged.
- [ ] No curve, voltage value, recovery phase, or extra control appears.
- [ ] Reduced-motion users get static representative frames and usable mode switching.
- [ ] Exact 1280×720 and 390×844 checks pass with no overflow/overlap.
- [ ] Full test, lint, build, and diff-check verification passes.
