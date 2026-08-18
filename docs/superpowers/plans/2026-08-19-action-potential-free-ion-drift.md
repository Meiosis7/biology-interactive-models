# Action Potential Free-Ion Drift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 26 free Na⁺/K⁺ particles drift slowly and independently within their verified safe lanes, with correct pause, conduction, mobile, and reduced-motion behavior.

**Architecture:** Extend the deterministic free-ion data with one of six deterministic motion profiles per ion. CSS animates only `transform` around the existing safe `left`/`top` coordinates; normal play state controls resting/generation, while conduction keeps drifting between manual steps. Reduced motion removes the drift and returns every ion to its safe base transform.

**Tech Stack:** React, TypeScript, CSS keyframes, Vitest, Testing Library, vinext, in-app Browser verification.

## Global Constraints

- Preserve exactly 26 ions and all region/species counts.
- Preserve the collision-safe base coordinates and stable nodes across all three modes.
- Use six deterministic motion profiles with 7–11 second durations and different negative delays.
- Desktop displacement must never exceed 3px on either axis; mobile displacement must never exceed 2px.
- Resting/generation drift runs only while `data-playing="true"`; pressing pause freezes and resume continues from the same visual position.
- Conduction drift remains running while waiting for “下一步”.
- `prefers-reduced-motion: reduce` disables drift and restores `translate(-50%, -50%)`.
- Do not overlap charges, channels, stimulus, moving ions, current arcs, scene bounds, or controls at 1280×720 and 390×844 throughout sampled drift cycles.
- Preserve generation loop, manual conduction, channel-axis alignment, open ends, copy, timing, sizes, dependencies, and mobile first-screen controls.

---

## File Structure

- Modify `components/action-potential/IonDistribution.tsx`: deterministic motion profiles and per-ion CSS variables.
- Modify `components/action-potential/action-potential.css`: drift keyframes, play-state selectors, mobile offsets, and reduced-motion override.
- Modify `tests/action-potential/ion-distribution.test.tsx`: profile completeness, duration, delay, and displacement bounds.
- Modify `tests/action-potential/visual-contracts.test.ts`: CSS animation, pause/conduction, mobile, and reduced-motion contracts.

### Task 1: Deterministic motion profiles

**Files:**
- Modify: `components/action-potential/IonDistribution.tsx`
- Modify: `tests/action-potential/ion-distribution.test.tsx`

**Interfaces:**
- Preserves: `IonDistribution(): JSX.Element` and all existing region/species/position attributes.
- Produces per ion: `data-motion-profile`, `--free-ion-drift-x`, `--free-ion-drift-y`, `--free-ion-mobile-drift-x`, `--free-ion-mobile-drift-y`, `--free-ion-drift-duration`, and `--free-ion-drift-delay`.

- [ ] **Step 1: Write the failing motion-profile test**

Add to `tests/action-potential/ion-distribution.test.tsx`:

```tsx
it("assigns bounded deterministic drift profiles to every free ion", () => {
  const { container, rerender } = render(<IonDistribution />);
  const readMotion = () =>
    Array.from(
      container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
    ).map((ion) => ({
      profile: ion.dataset.motionProfile,
      desktopX: ion.style.getPropertyValue("--free-ion-drift-x"),
      desktopY: ion.style.getPropertyValue("--free-ion-drift-y"),
      mobileX: ion.style.getPropertyValue("--free-ion-mobile-drift-x"),
      mobileY: ion.style.getPropertyValue("--free-ion-mobile-drift-y"),
      duration: ion.style.getPropertyValue("--free-ion-drift-duration"),
      delay: ion.style.getPropertyValue("--free-ion-drift-delay"),
    }));

  const before = readMotion();
  expect(before).toHaveLength(26);
  expect(new Set(before.map((motion) => motion.profile)).size).toBe(6);
  for (const motion of before) {
    expect(Math.abs(Number.parseFloat(motion.desktopX))).toBeLessThanOrEqual(3);
    expect(Math.abs(Number.parseFloat(motion.desktopY))).toBeLessThanOrEqual(3);
    expect(Math.abs(Number.parseFloat(motion.mobileX))).toBeLessThanOrEqual(2);
    expect(Math.abs(Number.parseFloat(motion.mobileY))).toBeLessThanOrEqual(2);
    expect(Number.parseFloat(motion.duration)).toBeGreaterThanOrEqual(7);
    expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(11);
    expect(Number.parseFloat(motion.delay)).toBeLessThan(0);
  }

  rerender(<IonDistribution />);
  expect(readMotion()).toEqual(before);
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx
```

Expected: FAIL because the motion attributes and CSS variables are empty.

- [ ] **Step 3: Add six exact deterministic profiles**

In `components/action-potential/IonDistribution.tsx`, add:

```tsx
interface FreeIonMotionProfile {
  x: string;
  y: string;
  mobileX: string;
  mobileY: string;
  duration: string;
  delay: string;
}

const MOTION_PROFILES: readonly FreeIonMotionProfile[] = [
  { x: "3px", y: "1px", mobileX: "2px", mobileY: "1px", duration: "7.2s", delay: "-1.4s" },
  { x: "-2px", y: "3px", mobileX: "-1px", mobileY: "2px", duration: "8.1s", delay: "-3.7s" },
  { x: "2px", y: "-3px", mobileX: "1px", mobileY: "-2px", duration: "9.3s", delay: "-5.1s" },
  { x: "-3px", y: "-1px", mobileX: "-2px", mobileY: "-1px", duration: "10.4s", delay: "-2.2s" },
  { x: "1px", y: "3px", mobileX: "1px", mobileY: "2px", duration: "7.8s", delay: "-6s" },
  { x: "-1px", y: "-2px", mobileX: "-1px", mobileY: "-2px", duration: "10.8s", delay: "-4.4s" },
] as const;
```

Change the region and ion callbacks so each ion receives a profile:

```tsx
{REGIONS.map((region, regionIndex) => (
  <div
    key={region.id}
    className={`ap-free-ion-region ap-free-ion-region--${region.id}`}
    data-free-ion-region={region.id}
    role="img"
    aria-label={region.label}
  >
    {region.ions.map((ion, index) => {
      const profileIndex = (regionIndex * 2 + index) % MOTION_PROFILES.length;
      const motion = MOTION_PROFILES[profileIndex];

      return (
        <i
          key={`${ion.species}-${index}`}
          className={`ap-free-ion ap-free-ion--${ion.species}`}
          data-free-ion-species={ion.species}
          data-motion-profile={profileIndex}
          style={
            {
              "--free-ion-x": `${ion.x}%`,
              "--free-ion-y": `${ion.y}%`,
              "--free-ion-drift-x": motion.x,
              "--free-ion-drift-y": motion.y,
              "--free-ion-mobile-drift-x": motion.mobileX,
              "--free-ion-mobile-drift-y": motion.mobileY,
              "--free-ion-drift-duration": motion.duration,
              "--free-ion-drift-delay": motion.delay,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          {LABELS[ion.species]}
        </i>
      );
    })}
  </div>
))}
```

Keep all existing region attributes, labels, ion classes, safe x/y coordinates, and ordering unchanged.

- [ ] **Step 4: Run the component test and verify GREEN**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx
```

Expected: all component tests PASS.

- [ ] **Step 5: Commit deterministic profiles**

```bash
git add components/action-potential/IonDistribution.tsx tests/action-potential/ion-distribution.test.tsx
git commit -m "feat: assign free ion drift profiles"
```

### Task 2: CSS drift, pause state, conduction state, and reduced motion

**Files:**
- Modify: `components/action-potential/action-potential.css`
- Modify: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**
- Consumes the seven CSS variables and `data-motion-profile` from Task 1.
- Produces `@keyframes ap-free-ion-drift` and play-state selectors based on existing `.ap-scene--conduction` and `[data-playing="true"]` attributes.

- [ ] **Step 1: Write the failing CSS contract test**

Add to `tests/action-potential/visual-contracts.test.ts`:

```ts
it("drifts free ions slowly with pause, conduction, mobile, and reduced-motion rules", () => {
  const ionRule = ruleBody(".ap-free-ion");
  const runningRule = ruleBody(
    '.ap-scene[data-playing="true"] .ap-free-ion,\n.ap-scene--conduction .ap-free-ion',
  );
  const keyframes = stylesheet.match(
    /@keyframes ap-free-ion-drift\s*\{([\s\S]*?)\n\}/,
  )?.[1];

  expect(ionRule).toMatch(
    /animation:\s*ap-free-ion-drift var\(--free-ion-drift-duration\) ease-in-out infinite/,
  );
  expect(ionRule).toMatch(/animation-delay:\s*var\(--free-ion-drift-delay\)/);
  expect(ionRule).toMatch(/animation-play-state:\s*paused/);
  expect(runningRule).toMatch(/animation-play-state:\s*running/);
  expect(keyframes).toBeDefined();
  expect(keyframes).toMatch(/var\(--free-ion-active-drift-x\)/);
  expect(keyframes).toMatch(/var\(--free-ion-active-drift-y\)/);

  const mobileRule = stylesheet.match(
    /@media \(max-width:\s*720px\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
  )?.[1];
  expect(mobileRule).toMatch(
    /--free-ion-active-drift-x:\s*var\(--free-ion-mobile-drift-x\)/,
  );
  expect(mobileRule).toMatch(
    /--free-ion-active-drift-y:\s*var\(--free-ion-mobile-drift-y\)/,
  );

  const reducedRule = stylesheet.match(
    /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
  )?.[1];
  expect(reducedRule).toBeDefined();
  expect(reducedRule).toMatch(/animation:\s*none/);
  expect(reducedRule).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
});
```

- [ ] **Step 2: Run the focused contract test and verify RED**

Run:

```bash
npm test -- --run tests/action-potential/visual-contracts.test.ts
```

Expected: FAIL because the animation, play-state, mobile-variable, keyframe, and reduced-motion contracts do not exist.

- [ ] **Step 3: Add the minimal drift CSS**

Extend `.ap-free-ion` in `components/action-potential/action-potential.css`:

```css
.ap-free-ion {
  --free-ion-active-drift-x: var(--free-ion-drift-x);
  --free-ion-active-drift-y: var(--free-ion-drift-y);
  animation: ap-free-ion-drift var(--free-ion-drift-duration) ease-in-out infinite;
  animation-delay: var(--free-ion-drift-delay);
  animation-play-state: paused;
  will-change: transform;
}

.ap-scene[data-playing="true"] .ap-free-ion,
.ap-scene--conduction .ap-free-ion {
  animation-play-state: running;
}
```

Add the keyframes before the media queries:

```css
@keyframes ap-free-ion-drift {
  0%, 100% {
    transform: translate(-50%, -50%) translate(0, 0);
  }

  38% {
    transform: translate(-50%, -50%)
      translate(var(--free-ion-active-drift-x), var(--free-ion-active-drift-y));
  }

  72% {
    transform: translate(-50%, -50%)
      translate(var(--free-ion-active-drift-y), var(--free-ion-active-drift-x));
  }
}
```

Inside `@media (max-width: 720px)`, extend `.ap-free-ion`:

```css
.ap-free-ion {
  --free-ion-active-drift-x: var(--free-ion-mobile-drift-x);
  --free-ion-active-drift-y: var(--free-ion-mobile-drift-y);
}
```

Inside `@media (prefers-reduced-motion: reduce)`, add:

```css
.ap-free-ion {
  animation: none;
  transform: translate(-50%, -50%);
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 5: Run focused lint and commit**

Run:

```bash
npx eslint components/action-potential/IonDistribution.tsx tests/action-potential/ion-distribution.test.tsx tests/action-potential/visual-contracts.test.ts
```

Expected: exit 0 for changed files. The repository-wide generated standalone lint baseline remains out of scope.

Commit:

```bash
git add components/action-potential/action-potential.css tests/action-potential/visual-contracts.test.ts
git commit -m "feat: animate free ion drift"
```

### Task 3: Full regression and sampled motion verification

**Files:**
- Verify only: the four source/test files changed in Tasks 1–2.

**Interfaces:**
- Consumes completed deterministic profiles and CSS play-state rules.
- Produces no runtime API.

- [ ] **Step 1: Run fresh automated verification**

```bash
npm test
npm run build
npx eslint components/action-potential/IonDistribution.tsx tests/action-potential/ion-distribution.test.tsx tests/action-potential/visual-contracts.test.ts
git diff --check
```

Expected: full tests and build PASS; focused ESLint and diff check exit 0.

- [ ] **Step 2: Start the local page**

```bash
npm run dev -- --port 3002
```

Open `http://localhost:3002/models/action-potential` in the exact in-app Browser.

- [ ] **Step 3: Verify 1280×720 sampled drift**

Across resting, active generation, and conduction current steps 1–3:

- sample all 26 free-ion rectangles at least every 500ms for 12 seconds;
- confirm at least two ions change transform/position while running;
- confirm maximum displacement from each safe base center is at most 3px per axis;
- confirm zero intersections with charges, channel containers and petals, stimulus, moving particles, exact SVG current strokes/markers, scene edges, and controls at every sample;
- pause resting and generation for at least 800ms and confirm every ion transform is byte-stable; resume and confirm movement continues without a jump;
- leave conduction waiting for “下一步” for at least 1.5 seconds and confirm drift continues.

- [ ] **Step 4: Verify 390×844 sampled drift**

Repeat the same state/sampling checks with:

- maximum displacement at most 2px per axis;
- all particles remaining 14×14 and inside the scene;
- `clientWidth === scrollWidth === 390`;
- “下一步” remaining fully visible in the first 844px and at least 44px high.

- [ ] **Step 5: Verify reduced motion and console**

Run:

```bash
npm test -- --run tests/action-potential/lab.test.tsx -t "uses representative static ion frames with disabled playback for reduced motion"
```

Expected: the selected reduced-motion test PASS. Confirm the CSS contract sets `animation: none`, the browser console has no warnings/errors, and stop the dev server.

- [ ] **Step 6: Final scope check**

```bash
git status --short
git log --oneline -7
```

Expected: no uncommitted action-potential source/test files; only intended commits after `a190aa5`.
