# Task 2 — 联动实验台与交互控制

## RED / GREEN evidence

- **RED:** `npm test -- tests/action-potential/lab.test.tsx` failed as expected before implementation: Vite could not resolve `ActionPotentialLab` because the component did not yet exist.
- **GREEN:** after adding the lab, controls, stage explanation, and minimal visual-component stubs, `npm test -- tests/action-potential/lab.test.tsx` passed: **4/4 tests**.
- **Full suite:** `npm test` passed: **14/14 tests across 2 files**.

## Files changed

- `components/action-potential/ActionPotentialLab.tsx` — page-level state, simulation snapshot wiring, transport controls, and animation loop.
- `components/action-potential/LabControls.tsx` — stateless intensity, stimulus-position, speed, timeline, and transport controls.
- `components/action-potential/StageExplanation.tsx` — required stage copy and accessible explanation card.
- `components/action-potential/AxonView.tsx` — minimal compilable Task 3 replacement stub.
- `components/action-potential/PotentialChart.tsx` — minimal compilable Task 3 replacement stub.
- `tests/action-potential/lab.test.tsx` — required interaction coverage.
- `tests/setup.ts`, `package.json`, `package-lock.json` — added React Testing Library and deterministic cleanup after each render; without cleanup, the brief's sequential tests retained prior rendered labs and produced duplicate-control query failures.

## Self-review

- Confirmed settings changes stop playback and reset time to zero.
- Confirmed the lab passes current `time` and unchanged Task 1 settings into `getSimulationSnapshot`; Task 1 local-time semantics were not modified.
- Confirmed the weak near-electrode interaction displays the required local-potential explanation.
- Confirmed controls are stateless and delegate through the required callbacks.
- Confirmed only requested Task 3 view files were added as minimal stubs.
- `git diff --check` completed with no whitespace errors.

## Concerns

- `npx tsc --noEmit` remains blocked by pre-existing Cloudflare ambient-type errors in `db/index.ts` and `worker/index.ts` (`cloudflare:workers`, `Fetcher`, and `D1Database`), unrelated to this feature. The Vitest suite is green.

## Fix Review

### RED

- Command: `npm test -- tests/action-potential/lab.test.tsx`
- Output: **3 failed, 6 passed**. The new review tests showed that the step buttons lacked disabled semantics and that the timeline did not clamp a value above `DURATION`. The synchronization test initially also failed after an electrode change.
- Investigation: the mock electrode range was uncontrolled; its browser default value was already `0.5`, so changing it to `0.5` did not emit a React change event. The double now receives and renders the supplied electrode setting, which accurately exercises the lab boundary.

### GREEN

- Command: `npm test -- tests/action-potential/lab.test.tsx`
- Output: **9/9 passed**. This covers disabled previous/next controls and clamping; synchronized AxonView, PotentialChart, and stage explanation props; deterministic animation advancement; pause cancellation; and stopping at `DURATION`.
- Command: `npm test`
- Output: **19/19 passed across 2 files**.
