# Task 3 Report: Animated Local-Current Flow and Scene Polish

## Status

Implemented Task 3 on top of `a3e73fd` without changing simulation timing, playback state, the three modes, or the shared seven-segment fiber model.

## RED evidence

Command:

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
```

Observed result: 2 test files failed, with 2 failed and 20 passed assertions.

- The local-current regression failed because the static arrow rows had no `data-current-direction` attribute or semantic branch nodes.
- The touch-target regression failed because the shared action-potential button rule had no `min-width: 44px` declaration.

The first full-suite run later exposed one stale integration assertion in `tests/site-metadata.test.ts` that still required the old `#f6f3eb` paper color. That assertion was updated to the Task 3 approved `#fffdf8` palette, then verified independently before the final full-suite run.

## GREEN evidence

Initial regression command after implementation:

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
```

Result: 2 files passed, 22 tests passed.

Specified focused verification:

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/models/touch-targets.test.ts
```

Result: 3 files passed, 32 tests passed.

Stale integration-contract verification:

```text
npm test -- tests/site-metadata.test.ts
```

Result: 1 file passed, 3 tests passed.

## Full verification

```text
npm run lint
```

Result: exit 0 with no lint errors.

```text
npm test
```

Final result: 19 files passed, 168 tests passed, 0 failures.

```text
git diff --check
```

Result: exit 0 with no whitespace errors.

## Files

- `components/action-potential/LocalCurrentFlow.tsx` — reusable semantic two-branch SVG flow component.
- `components/action-potential/ActionPotentialScene.tsx` — composes outside and inside flow layers in the existing current-step wrapper.
- `components/action-potential/action-potential.css` — pause-aware current/dot/halo animations, warm teaching palette, segment transitions, responsive sizing, reduced-motion static layout, and 44×44 control baseline.
- `tests/action-potential/mode-components.test.tsx` — structural inward/outward flow regression.
- `tests/models/touch-targets.test.ts` — 44×44 action-potential control regression.
- `tests/site-metadata.test.ts` — updates the shared presentation palette contract from the former beige to the approved warm white.

## Self-review

- `LocalCurrentFlow` exposes the requested Chinese accessible labels, `outward`/`inward` direction metadata, and exactly two semantic branch dots per layer.
- Intracellular teal-blue dots animate from the center outward; extracellular muted blue-purple dots animate from both sides inward. Dashed track motion reinforces the same directions.
- Current dots/tracks and target halos keep their animations assigned and default to paused; only `.ap-scene[data-playing="true"]` changes their play state to running.
- The former `left`/`right` transition on the current-system container was removed. Frame-controlled width still expands through current steps 1, 2, and 3, while pausing can no longer leave a resize transition running.
- Resting and excited segments use pale cyan and coral fills, with a 300 ms background/box-shadow transition and a pale blue target halo pulse.
- Mobile rules modestly scale channel bodies and ion balls without changing the pore's centered anchor, retain all seven segments, and separate current labels from membrane charges.
- Reduced motion disables gate, pore, particle, current, halo, and segment animation/transition. The three static ion particles receive distinct horizontal offsets for readability.
- The existing three mode buttons plus play/pause and replay remain the only five controls; the shared button rule guarantees at least 44×44 CSS pixels.
- No timing or biological phase source was changed: `simulation.ts` and `ActionPotentialLab.tsx` are untouched.

## Concerns

No code or automated-verification concerns. Exact browser geometry, pause snapshots, and viewport screenshots remain the explicit scope of Task 4.

## Review fix: separate current and region-label lanes

The Task 3 visual review found that the intracellular-current label and conduction region labels intersected vertically at both the desktop and mobile verification widths.

### RED evidence

Added a focused CSS regression requiring a 400 px fiber stage at both desktop and mobile widths and a distinct bottom-anchored lane for `.ap-region-labels`.

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
```

Result before the CSS fix: 1 failed and 22 passed tests. The new lane regression failed because the stage still used 370 px on desktop, 350 px on mobile, and positioned region labels at `top: 83%`.

### Fix details

- Increased `.ap-fiber-stage` minimum height to 400 px at desktop and mobile widths.
- Replaced the percentage-based region-label position with a dedicated lane using `top: auto` and `bottom: 32px`.
- Left all horizontal fiber/current geometry, seven segments, current text/directions, and pause-aware animation selectors unchanged.

### GREEN and verification evidence

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/models/touch-targets.test.ts
```

Result after the CSS fix: 2 files passed, 23 tests passed.

```text
npm run lint
```

Result: exit 0 with no lint errors.

```text
git diff --check
```

Result: exit 0 with no whitespace errors.

### Review-fix concerns

None. The fix changes vertical allocation only, so it introduces no new horizontal overflow path.
