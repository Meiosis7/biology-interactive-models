# Action Potential Bilateral Membrane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the membrane-region labeling and render scientifically consistent top/bottom Na⁺ and K⁺ channel animations across all three action-potential modes.

**Architecture:** Keep the simulation frame model segment-based so top and bottom surfaces cannot drift out of sync. Add a `MembraneSurface` rendering interface to `IonChannel` and `IonStream`; `ActionPotentialScene` mirrors each segment's existing channel/influx state onto both surfaces. Use surface/direction CSS classes for screen-space motion, while preserving the shared seven-segment DOM, playback state machine, four charge slots, and four local-current arcs.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest 4, Testing Library, Vinext/Next.js, in-app Browser.

## Global Constraints

- Preserve exactly three modes: 静息电位、动作电位产生、动作电位传导.
- Preserve one shared open-ended fiber with exactly seven stable membrane-segment DOM nodes.
- The vertical regions are always 上侧膜外 → 上膜 → 膜内 → 下膜 → 下侧膜外.
- Render three stable region labels in vertical order: 膜外、膜内、膜外.
- Every segment has exactly four stable charge slots; resting is `＋,−,−,＋`, excited is `−,＋,＋,−` from top to bottom.
- `stimulus`, `sodium-channel-opening`, and `sodium-in` remain `＋,−,−,＋`; all four signs switch together only at `excited`.
- `neighbor-sodium-in` targets remain resting; all four signs switch together at `neighbor-excited`.
- Every segment has one top and one bottom Na⁺ channel; active segments open both synchronously.
- Top Na⁺ influx moves downward into the fiber; bottom Na⁺ influx moves upward into the fiber; each stream has three particles.
- Resting mode has one top and one bottom K⁺ channel; top K⁺ moves upward/outward and bottom K⁺ moves downward/outward.
- Keep channel opening horizontal; do not rotate petals into top/bottom gates.
- Keep exactly four local-current arcs per `local-current` frame; do not duplicate them for the lower membrane.
- Preserve generation looping, three-round conduction, pause/resume/replay, reduced-motion zero RAF, accessible names, and open fiber ends.
- Do not add curves, `mV`, `-70`, repolarization, hyperpolarization, recovery, electrodes, modes, or controls.
- At 1280×720 and 390×844, all channel/particle/charge/label bounds must be disjoint and `scrollWidth === clientWidth`.

---

### Task 1: Correct the spatial labels and lock the no-mixed-charge contract

**Files:**

- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Consumes: the existing four `data-charge-position` nodes and segment `polarity`.
- Produces: three label modifiers `outside-top`, `inside`, `outside-bottom`; explicit charge assertions for every generation/conduction transition.

- [ ] **Step 1: Add failing region-label and phase-charge tests**

Add to `mode-components.test.tsx`:

```tsx
it("labels top outside, fiber inside, and bottom outside in vertical order", () => {
  render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.55)}
      playing={false}
    />,
  );

  const labels = screen.getAllByTestId("membrane-compartment-label");
  expect(labels.map((label) => label.getAttribute("data-compartment"))).toEqual([
    "outside-top",
    "inside",
    "outside-bottom",
  ]);
  expect(labels.map((label) => label.textContent)).toEqual(["膜外", "膜内", "膜外"]);
});

it.each([
  [0, ["＋", "−", "−", "＋"]],
  [0.2, ["＋", "−", "−", "＋"]],
  [0.55, ["＋", "−", "−", "＋"]],
  [0.9, ["−", "＋", "＋", "−"]],
] as const)("keeps the generation charge quartet atomic at progress %s", (progress, expected) => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", progress)}
      playing={false}
    />,
  );
  const center = container.querySelector('[data-segment-id="3"]')!;
  expect(
    Array.from(center.querySelectorAll("[data-charge-position]"), (node) => node.textContent),
  ).toEqual(expected);
});

it("switches conduction targets only after sodium influx finishes", () => {
  const { container, rerender } = render(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", 0.16)}
      playing={false}
    />,
  );
  const signs = (id: number) =>
    Array.from(
      container.querySelector(`[data-segment-id="${id}"]`)!.querySelectorAll("[data-charge-position]"),
      (node) => node.textContent,
    );
  expect(signs(2)).toEqual(["＋", "−", "−", "＋"]);
  expect(signs(4)).toEqual(["＋", "−", "−", "＋"]);

  rerender(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", 0.26)}
      playing={false}
    />,
  );
  expect(signs(2)).toEqual(["−", "＋", "＋", "−"]);
  expect(signs(4)).toEqual(["−", "＋", "＋", "−"]);
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx
```

Expected: the region-label test fails because only two labels exist and the lower external area is labelled `膜内`; the charge tests pass and establish the scientific baseline before visual changes.

- [ ] **Step 3: Render three semantic region labels**

Replace the two current labels in `ActionPotentialScene.tsx` with:

```tsx
{([
  ["outside-top", "膜外"],
  ["inside", "膜内"],
  ["outside-bottom", "膜外"],
] as const).map(([compartment, label]) => (
  <span
    key={compartment}
    className={`ap-compartment-label ap-compartment-label--${compartment}`}
    data-testid="membrane-compartment-label"
    data-compartment={compartment}
  >
    {label}
  </span>
))}
```

- [ ] **Step 4: Reserve clear vertical lanes for charges, labels, and channels**

Replace the label/charge/fiber sizing rules with:

```css
.ap-fiber { height: 108px; }
.ap-compartment-label--outside-top { top: calc(47% - 42px); }
.ap-compartment-label--inside { top: calc(47% + 48px); }
.ap-compartment-label--outside-bottom { top: calc(47% + 126px); }
.ap-segment-charge--outside-top { top: -34px; }
.ap-segment-charge--inside-top { top: 22px; }
.ap-segment-charge--inside-bottom { bottom: 22px; }
.ap-segment-charge--outside-bottom { bottom: -34px; }
```

In the existing `@media (max-width: 720px)` block, use:

```css
.ap-fiber { height: 96px; }
.ap-compartment-label--outside-top { top: calc(47% - 38px); }
.ap-compartment-label--inside { top: calc(47% + 42px); }
.ap-compartment-label--outside-bottom { top: calc(47% + 112px); }
```

Do not change the four charge slot names, segment polarity mapping, or open-end borders.

- [ ] **Step 5: Add CSS contracts and verify GREEN**

Add to `visual-contracts.test.ts`:

```tsx
it("reserves three compartment lanes around a taller bilateral fiber", () => {
  expect(ruleBody(".ap-fiber")).toMatch(/height:\s*108px\s*;/);
  expect(ruleBody(".ap-compartment-label--outside-top")).toMatch(/47% - 42px/);
  expect(ruleBody(".ap-compartment-label--inside")).toMatch(/47% \+ 48px/);
  expect(ruleBody(".ap-compartment-label--outside-bottom")).toMatch(/47% \+ 126px/);
  expect(ruleBody(".ap-segment-charge--outside-top")).toMatch(/top:\s*-34px\s*;/);
  expect(ruleBody(".ap-segment-charge--inside-top")).toMatch(/top:\s*22px\s*;/);
  expect(ruleBody(".ap-segment-charge--inside-bottom")).toMatch(/bottom:\s*22px\s*;/);
  expect(ruleBody(".ap-segment-charge--outside-bottom")).toMatch(/bottom:\s*-34px\s*;/);
});
```

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
npm run lint
```

Expected: all focused tests and lint pass; the lower external region is no longer labelled as internal.

- [ ] **Step 6: Commit Task 1**

```bash
git add components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "fix: clarify membrane compartments"
```

---

### Task 2: Add surface-aware channel and stream primitives with bilateral Na⁺

**Files:**

- Modify: `components/action-potential/IonChannel.tsx`
- Modify: `components/action-potential/IonStream.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/lab.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Produces: `export type MembraneSurface = "top" | "bottom"`; `IonChannel({ species, open, label, surface })`; `IonStream({ species, direction, label, surface })`.
- Consumes: unchanged segment-level `sodiumChannelOpen` and `sodiumInflux`; the same value is mirrored to both surfaces.

- [ ] **Step 1: Write failing bilateral Na⁺ tests**

Update the seven-channel expectation and add:

```tsx
it("renders stable top and bottom sodium channels for every segment", () => {
  const { container } = render(
    <ActionPotentialScene mode="resting" frame={getActionPotentialFrame("resting", 0)} playing />,
  );
  expect(container.querySelectorAll('[data-channel-species="sodium"]')).toHaveLength(14);
  for (let id = 0; id < 7; id += 1) {
    const segment = container.querySelector(`[data-segment-id="${id}"]`)!;
    expect(segment.querySelectorAll('[data-channel-species="sodium"][data-membrane-surface="top"]')).toHaveLength(1);
    expect(segment.querySelectorAll('[data-channel-species="sodium"][data-membrane-surface="bottom"]')).toHaveLength(1);
  }
});

it("opens both central sodium channels and sends six ions inward", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.55)}
      playing
    />,
  );
  const center = container.querySelector('[data-segment-id="3"]')!;
  expect(center.querySelectorAll('[data-channel-species="sodium"][data-open="true"]')).toHaveLength(2);
  expect(center.querySelectorAll('[data-ion-species="sodium"]')).toHaveLength(2);
  expect(center.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(6);
  expect(screen.getByLabelText("Na⁺经第4膜段上膜进入膜内")).toHaveAttribute("data-screen-direction", "down");
  expect(screen.getByLabelText("Na⁺经第4膜段下膜进入膜内")).toHaveAttribute("data-screen-direction", "up");
});

it("mirrors sodium influx on every conduction target", () => {
  const { container } = render(
    <ActionPotentialScene
      mode="conduction"
      frame={getActionPotentialFrame("conduction", 0.16)}
      playing
    />,
  );
  expect(container.querySelectorAll('[data-channel-species="sodium"][data-open="true"]')).toHaveLength(4);
  expect(container.querySelectorAll('[data-ion-species="sodium"]')).toHaveLength(4);
  expect(container.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(12);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
```

Expected: failures show the primitives have no `surface`, only seven Na⁺ channels exist, and each influx segment has only three particles.

- [ ] **Step 3: Add the surface interface to both primitives**

In `IonChannel.tsx`:

```tsx
export type MembraneSurface = "top" | "bottom";

interface IonChannelProps {
  species: "sodium" | "potassium";
  open: boolean;
  label: string;
  surface: MembraneSurface;
}

export function IonChannel({ species, open, label, surface }: IonChannelProps) {
  return (
    <i
      className={`ap-ion-channel ap-ion-channel--${species} ap-ion-channel--${surface}`}
      data-channel-species={species}
      data-membrane-surface={surface}
      data-open={open}
      role="img"
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

Replace `IonStream.tsx` with the following surface-aware component:

```tsx
import type { CSSProperties } from "react";
import type { MembraneSurface } from "./IonChannel";

interface IonStreamProps {
  species: "sodium" | "potassium";
  direction: "inward" | "outward";
  label: string;
  surface: MembraneSurface;
}

const ION_LABELS = { sodium: "Na⁺", potassium: "K⁺" } as const;

export function IonStream({ species, direction, label, surface }: IonStreamProps) {
  const screenDirection =
    (surface === "top" && direction === "inward") ||
    (surface === "bottom" && direction === "outward")
      ? "down"
      : "up";

  return (
    <span
      className={`ap-ion-stream ap-ion-stream--${species} ap-ion-stream--${direction} ap-ion-stream--${surface}`}
      data-ion-species={species}
      data-ion-direction={direction}
      data-membrane-surface={surface}
      data-screen-direction={screenDirection}
      role="img"
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

- [ ] **Step 4: Mirror Na⁺ channels and streams in the scene**

Inside every segment in `ActionPotentialScene.tsx`, replace the single Na⁺ channel/stream with:

```tsx
{(["top", "bottom"] as const).map((surface) => (
  <Fragment key={`sodium-${surface}`}>
    <IonChannel
      species="sodium"
      surface={surface}
      open={segment.sodiumChannelOpen}
      label={`第${segment.id + 1}膜段${surface === "top" ? "上膜" : "下膜"} Na⁺通道${segment.sodiumChannelOpen ? "开放" : "关闭"}`}
    />
    {segment.sodiumInflux && (
      <IonStream
        key={`sodium-stream-${surface}-${animationEpoch}`}
        species="sodium"
        surface={surface}
        direction="inward"
        label={`Na⁺经第${segment.id + 1}膜段${surface === "top" ? "上膜" : "下膜"}进入膜内`}
      />
    )}
  </Fragment>
))}
```

Import `Fragment` from React. Do not change segment keys or frame data.

- [ ] **Step 5: Add exact surface and direction CSS**

Replace implicit top positioning with:

```css
.ap-ion-channel--top { top: -15px; bottom: auto; }
.ap-ion-channel--bottom { top: auto; bottom: -15px; }
.ap-ion-stream--top { top: -18px; bottom: auto; }
.ap-ion-stream--bottom { top: auto; bottom: -18px; }

.ap-ion-stream--top.ap-ion-stream--inward,
.ap-ion-stream--bottom.ap-ion-stream--outward {
  --ion-start-y: -20px;
  --ion-end-y: 34px;
  --ion-static-y: 6px;
}

.ap-ion-stream--top.ap-ion-stream--outward,
.ap-ion-stream--bottom.ap-ion-stream--inward {
  --ion-start-y: 34px;
  --ion-end-y: -20px;
  --ion-static-y: -20px;
}
```

In reduced motion, replace the hard-coded `6px` with:

```css
transform: translate(calc(-50% + var(--ion-static-x)), var(--ion-static-y)) scale(.9);
```

- [ ] **Step 6: Update reduced-motion and timing contracts**

In `lab.test.tsx`, the reduced-motion generation frame must assert two open central Na⁺ channels, two streams, and six particles. In `visual-contracts.test.ts`, assert all four direction selectors contain the exact start/end values above and keep sodium's one-shot 650 ms + 100 ms stagger contract unchanged.

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
npm run lint
```

Expected: focused tests and lint pass; bilateral Na⁺ is derived from one segment state with no simulation duplication.

- [ ] **Step 7: Commit Task 2**

```bash
git add components/action-potential/IonChannel.tsx components/action-potential/IonStream.tsx components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "feat: mirror sodium channels across the fiber"
```

---

### Task 3: Add paired K⁺ channels and outward animation without collisions

**Files:**

- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/mode-components.test.tsx`
- Test: `tests/action-potential/lab.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**

- Consumes: Task 2's `surface` interface and unchanged `frame.potassiumChannelOpen` / `frame.potassiumOutflow`.
- Produces: one top and one bottom K⁺ channel/stream pair in resting mode, both keyed by `animationEpoch` only at the stream layer.

- [ ] **Step 1: Write failing paired-K⁺ tests**

Replace the single K⁺ assertions with:

```tsx
it("shows paired potassium channels and opposite outward screen directions only while resting", () => {
  const { container, rerender } = render(
    <ActionPotentialScene mode="resting" frame={getActionPotentialFrame("resting", 0.2)} playing />,
  );
  expect(container.querySelectorAll('[data-channel-species="potassium"]')).toHaveLength(2);
  expect(container.querySelectorAll('[data-ion-species="potassium"]')).toHaveLength(2);
  expect(container.querySelectorAll('[data-ion-particle="potassium"]')).toHaveLength(6);
  expect(screen.getByLabelText("K⁺经上膜向膜外流出")).toHaveAttribute("data-screen-direction", "up");
  expect(screen.getByLabelText("K⁺经下膜向膜外流出")).toHaveAttribute("data-screen-direction", "down");

  rerender(
    <ActionPotentialScene mode="generation" frame={getActionPotentialFrame("generation", 0.55)} playing />,
  );
  expect(container.querySelectorAll('[data-channel-species="potassium"]')).toHaveLength(0);
  expect(container.querySelectorAll('[data-ion-particle="potassium"]')).toHaveLength(0);
});
```

Add a replay assertion that both K⁺ streams remount while the shared fiber and segments remain identical.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
```

Expected: paired-K⁺ tests fail because only the bottom K⁺ channel/stream exists.

- [ ] **Step 3: Render the top and bottom K⁺ pair**

Keep the existing representative longitudinal location (`segment.id === 1`), but render both surfaces:

```tsx
{mode === "resting" && segment.id === 1 &&
  (["top", "bottom"] as const).map((surface) => (
    <Fragment key={`potassium-${surface}`}>
      <IonChannel
        species="potassium"
        surface={surface}
        open={frame.potassiumChannelOpen}
        label={`${surface === "top" ? "上膜" : "下膜"} K⁺通道${frame.potassiumChannelOpen ? "开放" : "关闭"}`}
      />
      {frame.potassiumOutflow && (
        <IonStream
          key={`potassium-stream-${surface}-${animationEpoch}`}
          species="potassium"
          surface={surface}
          direction="outward"
          label={`K⁺经${surface === "top" ? "上膜" : "下膜"}向膜外流出`}
        />
      )}
    </Fragment>
  ))}
```

- [ ] **Step 4: Place K⁺ at the boundary and add mobile scale variables**

Keep both K⁺ surfaces at a continuous segment boundary without overriding their surface top/bottom lanes:

```css
.ap-ion-channel--potassium,
.ap-ion-stream--potassium {
  left: 100%;
}

.ap-ion-channel {
  --channel-scale: 1;
  transform: translateX(-50%) scale(var(--channel-scale));
}
```

In `@media (max-width: 720px)`:

```css
.ap-ion-channel { --channel-scale: .86; }
.ap-ion-channel--potassium { --channel-scale: .52; }
.ap-ion-stream--potassium .ap-ion-particle {
  width: 16px;
  height: 16px;
  font-size: 6px;
}
```

Remove the old potassium-specific `top`, `bottom`, `--ion-start-y`, and `--ion-end-y`; surface/direction selectors now own those values.

- [ ] **Step 5: Add K⁺ CSS/direction contracts and verify GREEN**

Update `visual-contracts.test.ts` to assert potassium channel/stream use only `left:100%`, mobile K⁺ scale is `.52`, mobile particles are 16 px, and top/bottom outward selectors resolve to `34→-20` and `-20→34` respectively.

Run:

```bash
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
npm test
npm run lint
```

Expected: focused tests, the full suite, and lint pass; resting mode has two K⁺ channels/six particles, and generation/conduction have none.

- [ ] **Step 6: Commit Task 3**

```bash
git add components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "feat: mirror potassium outflow across the fiber"
```

---

### Task 4: Final automation and bilateral browser acceptance

**Files:**

- Modify: `.superpowers/sdd/action-potential-visual-polish-verification.md`

**Interfaces:**

- Consumes: final bilateral membrane implementation.
- Produces: exact automated and in-app Browser evidence for charge atomicity, mirrored channels, direction, pause/replay, collision-free responsive layout, and unchanged teaching flow.

- [ ] **Step 1: Run the complete automated chain exactly once**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0. If any command fails, use systematic debugging, write a focused RED regression, fix it, and rerun this complete chain once after focused GREEN.

- [ ] **Step 2: Verify the charge sequence and bilateral Na⁺ at 1280×720**

At `http://localhost:3002/models/action-potential`, record one generation cycle:

```text
stimulus: center ＋−−＋, both Na channels closed
sodium-channel-opening: center ＋−−＋, top+bottom Na channels open
sodium-in: center ＋−−＋, top 3 particles moving down + bottom 3 moving up
excited: center −＋＋−, no mixed intermediate quartet
```

Pause both during channel opening and during influx for at least 650 ms. Record unchanged top/bottom petal, pore, and particle transforms; resume must continue without a jump. Replay must remount both streams without remounting the shared fiber or seven segments.

- [ ] **Step 3: Verify conduction and resting symmetry**

During first conduction influx, confirm segments `[2,4]` each have two open Na⁺ channels and six particles, remain `＋−−＋`, then switch atomically to `−＋＋−` in `neighbor-excited`. Confirm the next local-current frame still has exactly four arcs.

In resting mode, confirm exactly two K⁺ channels and six particles: top stream moves upward, bottom stream moves downward. K⁺ remains absent in generation/conduction.

- [ ] **Step 4: Measure geometry at both viewports**

At 1280×720 and 390×844, sample the full particle animations across at least six observations. Compute pairwise intersections between:

- all 28 charge nodes and all Na⁺/K⁺ petals;
- all charge nodes and all visible Na⁺/K⁺ particles;
- Na⁺ and K⁺ petals;
- all region labels and fiber contents;
- channels/particles and the open left/right fiber ends.

Expected intersection area for every pair: `0 px²`. Confirm all 14 Na⁺ channels, all four charge slots per segment, both K⁺ channels, all three region labels, and seven segments are within viewport width; `clientWidth === scrollWidth`.

- [ ] **Step 5: Verify reduced motion, accessibility, and forbidden scope**

Use the dedicated reduced-motion test if the in-app Browser cannot emulate the media feature. Confirm zero RAF, two static open central Na⁺ channels, two static streams/six particles, disabled playback controls, and working mode switches.

Check accessible names include membrane surfaces for every active channel/stream. Check console warning/error count is 0. Scan all modes for `mV`, `-70`, `−70`, 曲线, 复极化, 超极化, 恢复; expected matches: 0.

- [ ] **Step 6: Append evidence and commit verification**

Append `Bilateral membrane follow-up` to `.superpowers/sdd/action-potential-visual-polish-verification.md`, including exact command counts, phase traces, element counts, transform freeze evidence, intersection measurements, viewport widths, limitations, and console/forbidden scans.

```bash
git add .superpowers/sdd/action-potential-visual-polish-verification.md
git commit -m "docs: verify bilateral membrane animation"
```

---

## Final Acceptance Checklist

- [ ] Region labels read 膜外、膜内、膜外 from top to bottom.
- [ ] Generation remains `＋−−＋` through influx and switches atomically to `−＋＋−` only at excited.
- [ ] Conduction targets remain resting through influx and switch atomically at neighbor-excited.
- [ ] Exactly 14 stable Na⁺ channels exist; active segments open both surfaces.
- [ ] Every active segment has top-down and bottom-up Na⁺ streams with three particles each.
- [ ] Resting has paired top-up and bottom-down K⁺ outflow; other modes have no K⁺.
- [ ] Channel petals remain horizontal on both surfaces.
- [ ] Pause/resume/replay and reduced-motion behavior cover both surfaces.
- [ ] Local-current frames still have exactly four approved arcs.
- [ ] Seven segments and open ends remain stable.
- [ ] Both viewports have zero channel/particle/charge/label intersections and no horizontal overflow.
- [ ] No forbidden voltage/recovery content or extra controls appear.
- [ ] Full tests, lint, build, diff-check, and console checks pass.
