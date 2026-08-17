# Progressive Curve Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw membrane-potential curves only from time zero through the current experiment time so learners see each curve form alongside its synchronized cause.

**Architecture:** Add one pure sampling helper to `CurveCanvas.tsx` and use its returned times for every visible curve. Keep the existing shared `time` state as the sole driver for curve progress, stage explanation, ion movement, and channel state.

**Tech Stack:** React, TypeScript, Canvas 2D, Vitest, Testing Library

## Global Constraints

- At time 0, render only the starting curve point.
- Never draw curve samples after the current time.
- At time 6, retain the existing full 241-sample curve resolution.
- Apply the same reveal boundary to comparison curves.
- Do not change simulation values, stage timing, or membrane animation behavior.

---

### Task 1: Visible curve sampling

**Files:**
- Modify: `models/03-membrane-potential-curve/CurveCanvas.tsx`
- Create: `tests/models/membrane-potential-curve/progressive-curve.test.ts`

**Interfaces:**
- Consumes: current `time` in the inclusive range 0 through 6.
- Produces: `getVisibleCurveTimes(time: number): number[]` whose final item is the clamped current time.

- [ ] **Step 1: Write the failing test**

```ts
expect(getVisibleCurveTimes(0)).toEqual([0]);
expect(getVisibleCurveTimes(2).at(-1)).toBe(2);
expect(getVisibleCurveTimes(2).every((pointTime) => pointTime <= 2)).toBe(true);
expect(getVisibleCurveTimes(6)).toHaveLength(241);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm test -- tests/models/membrane-potential-curve/progressive-curve.test.ts`

Expected: FAIL because `getVisibleCurveTimes` is not exported.

- [ ] **Step 3: Implement exact-time progressive sampling**

```ts
export function getVisibleCurveTimes(time: number) {
  const visibleTime = Math.min(DURATION, Math.max(0, time));
  if (visibleTime === 0) return [0];
  const segmentCount = Math.ceil((visibleTime / DURATION) * 240);
  return Array.from(
    { length: segmentCount + 1 },
    (_, index) => (visibleTime * index) / segmentCount,
  );
}
```

Replace the fixed 0-to-6 drawing loop with iteration over `getVisibleCurveTimes(time)` for every active intensity.

- [ ] **Step 4: Verify focused and complete behavior**

Run: `npm test -- tests/models/membrane-potential-curve/progressive-curve.test.ts`

Expected: PASS.

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

- [ ] **Step 5: Synchronize and package the standalone model**

Apply the identical `CurveCanvas.tsx` change to `membrane-potential-curve-standalone`, build both projects, and create the next versioned ZIP without dependency or build-cache folders.

Expected: both production builds succeed, source files match, ZIP integrity passes, and the local preview route responds successfully.
