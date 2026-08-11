# Action-potential visual-polish final-fix report

Date: 2026-08-11 (Asia/Shanghai)
Worktree: `/Users/fushuo/Documents/一生 选必1 交互模型/.worktrees/action-potential-visual-polish`
Base: `24eec93faed57fa7bca3632ddfd63b0283fae0bc`
Fix commit subject: `fix: polish accessible ion motion` (final SHA is recorded in the handoff)
Result: **PASS**

## Scope and files

The implementation fixes only the final-review visual/accessibility findings. It does not add biological phases, voltage values, recovery behavior, controls, or modes.

- `components/action-potential/ActionPotentialLab.tsx`
  - Uses generation progress `0.55` and conduction progress `0.42` for representative reduced-motion frames.
  - Waits for the motion preference to initialize before requesting animation frames.
- `components/action-potential/action-potential.css`
  - Adds explicit accessible ion label/fill tokens.
  - Gives sodium and potassium separate duration/stagger values.
  - Keeps the existing paused/running `animation-play-state` contract.
- `tests/action-potential/lab.test.tsx`
  - Verifies exact reduced-motion phases, open-channel/particle counts, conduction segments/targets, disabled controls, usable mode changes, and zero RAF calls.
- `tests/action-potential/visual-contracts.test.ts`
  - Verifies calculated contrast ratios, desktop/mobile color inheritance, schedule-derived sodium completion, slower potassium timing, and paused/running CSS rules.

## TDD evidence

### RED 1: representative frames, contrast, and timing

Tests were written before product code, then run with:

```text
npm test -- tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
```

Exit code: `1`. Two files ran; 3 tests failed and 9 passed.

Expected failures:

1. Reduced-motion generation expected `data-phase="sodium-in"` but received `excited`, proving the old progress `1` omitted sodium particles.
2. The accessible color test reported the missing `--ap-ion-particle-label` token.
3. The timing test reported the missing `.ap-ion-stream--sodium` rule.

After the minimal implementation, the same focused command exited `0`: 2/2 files and 12/12 tests passed.

### RED 2: strict no-RAF behavior found in review

A read-only reviewer found that the initial reduced-motion render requested one RAF and then canceled it. The original queue-size assertion could not distinguish that from never requesting a frame. A stricter assertion was added first and run with:

```text
npm test -- tests/action-potential/lab.test.tsx -t "uses representative static ion frames"
```

Exit code: `1`. The assertion expected zero calls but observed exactly one `requestAnimationFrame(tick)` call.

The minimal fix added a motion-preference initialization gate. The complete focused command was then rerun:

```text
npm test -- tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
```

Exit code: `0`; 2/2 files and 12/12 tests passed. The reduced-motion test now checks zero RAF calls both after initial render and after generation/conduction mode switches.

## Implemented contracts

### Reduced motion

- Generation: progress `0.55`, phase `sodium-in`, one central open Na⁺ channel, three Na⁺ particles.
- Conduction: progress `0.42`, phase `neighbor-sodium-in`, excited segments `[2,3,4]`, open/influx neighbor segments `[1,5]`, six Na⁺ particles, and local-current targets `[1,5]`.
- Play and replay remain disabled.
- Mode switching remains usable.
- No animation frame is ever requested while reduced motion is active, including the initial render.
- Existing reduced-motion CSS keeps particles visible and static with animation disabled.

### Contrast

The shared desktop/mobile label token is `#ffffff`. Sodium uses solid fill `#0b6673`; potassium uses solid fill `#5a3e91`.

- Na⁺ contrast: approximately `6.64:1`.
- K⁺ contrast: approximately `8.29:1`.
- Both exceed `4.5:1` at the existing desktop 8px and mobile 7px sizes.
- The mobile media rule changes particle size/font size only and does not override fill or label color.

### Timing and pause behavior

- Sodium: `650ms` duration and `100ms` stagger. The third particle completes at `650 + 2×100 = 850ms`, 70ms before each 920ms conduction influx phase ends.
- Potassium: species-specific `720ms` duration and `125ms` stagger, slower than sodium.
- `.ap-ion-particle` remains paused by default.
- `.ap-scene[data-playing="true"] .ap-ion-particle` remains the only rule that sets it running.

## Read-only review

The reviewer approved the reduced-motion frame choice, conduction neighborhood, contrast tokens, timing separation, pause contract, and biological scope. The only Important issue was the initial request/cancel RAF behavior; it was reproduced with a failing test and fixed before final verification. No Critical or remaining Important issues were reported.

The first follow-up review identified that the original 520ms sodium duration was below the approved 650–850ms range and had no phase-boundary margin. The schedule-derived follow-up below resolves that issue without changing biological phase order.

## Final verification

The required full chain was run once after implementation and review fixes:

```text
npm test && npm run lint && npm run build && git diff --check
```

Overall exit code: `0`.

- Tests: 20/20 files passed; 171/171 tests passed; 0 failed.
- Lint: ESLint exited `0` with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.
- Diff check: exited `0` with no output.

## Self-review

- Scientific relay correctness is preserved: the reduced-motion conduction frame shows an already excited `[2,3,4]` neighborhood recruiting adjacent `[1,5]` through open Na⁺ channels and local-current targets.
- Generation continues to show only central Na⁺ influx and does not introduce K⁺ recovery or a recovery phase.
- The simulation state machine, mode content, seven-segment fiber, control set, and terminal playback behavior were not changed.
- Color tokens apply identically at desktop and mobile; no responsive geometry changed.
- The new preference-readiness state suppresses premature RAF only until `matchMedia` has been read. Normal-motion playback starts after initialization; preference changes still synchronize through the existing listener.
- The committed diff contains one product/test commit and no unrelated user changes.

## Concerns and evidence limits

- No browser re-verification was performed for the changed colors, timing, or strict reduced-motion RAF behavior. No new browser claim is made for those changes; automated tests, stylesheet calculation, lint, and build are the evidence.
- The previously approved Task 4 browser observations at commit `24eec93` remain historical evidence for unchanged layout, channel geometry, current direction, pause retention, controls, and responsive bounds. They are preserved separately in `action-potential-visual-polish-verification.md` with an explicit post-fix addendum.

## Follow-up timing and evidence-file fix

### Scope

- Replaced fractional conduction thresholds with the same six phases expressed as explicit millisecond durations: three repetitions of `580ms local-current` followed by `920ms neighbor-sodium-in`.
- Kept `MODE_DURATION_MS` at 6000ms. Recruitment ends at 4500ms and the existing `conducted` terminal frame remains visible for 1500ms.
- Changed Na⁺ timing to `650ms` duration / `100ms` stagger. All three particles finish at 850ms, leaving a 70ms margin in every 920ms influx window.
- Changed K⁺ timing to the slightly slower `720ms` duration / `125ms` stagger.
- Restored `.superpowers/sdd/task-2-report.md` byte-for-byte from `9be3ff7`; that file again contains only the pre-existing synapse-transmission report.
- Assigned all action-potential evidence to the unique `final-fix-report.md` and `action-potential-visual-polish-verification.md` names. The plan-path verification file is force-added so worktree cleanup cannot remove it.

### TDD RED

The hard-coded 720ms assertion was first replaced by a test that samples the real `getActionPotentialFrame("conduction", elapsed / MODE_DURATION_MS)` behavior for every millisecond, groups contiguous phase windows, and compares CSS timing against each discovered influx window.

```text
npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/simulation.test.ts tests/action-potential/lab.test.tsx
```

Exit code: `1`. Three files ran; 1 test failed and 26 passed. The expected failure observed an actual influx duration of 720ms where the approved schedule-derived lower bound was 850ms. Simulation and lab behavior remained green.

### TDD GREEN

After the minimal schedule/timing change, the identical focused command exited `0`: 3/3 files and 27/27 tests passed.

The contract now asserts:

- total conduction duration remains between 5.5 and 6.5 seconds (actual: 6000ms);
- exact phase order remains local/influx repeated three times, then conducted;
- all three discovered influx windows are 850–1000ms (actual: 920ms);
- Na⁺ duration is 650–850ms and stagger is 100–130ms (actual: 650ms/100ms);
- the final Na⁺ particle finishes at least 50ms before every influx phase ends (actual margin: 70ms);
- potassium duration and stagger remain greater than sodium's.

### Follow-up automation

```text
npm test && npm run lint && npm run build
```

Exit code: `0`.

- Tests: 20/20 files passed; 171/171 tests passed.
- Lint: ESLint exited with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.

After every evidence file was staged, `git diff --cached --check` exited `0` with no output.

### Follow-up evidence limit

No browser re-verification was performed or claimed. Browser validation of the new phase allocation and particle timing remains assigned to the next review stage.

## Follow-up Na⁺ one-shot animation fix

### Root cause

Focused in-app browser verification at `c8ebf02` observed Na⁺ particles with computed `animation-duration: 0.65s` and `animation-iteration-count: infinite`. The shared `.ap-ion-particle` animation shorthand hard-coded `infinite`; the species rules parameterized duration and stagger only. Consequently, each Na⁺ particle restarted after 650ms and reappeared during the remaining 70–270ms of a 920ms influx phase.

The fix keeps the shared animation and species inheritance pattern, but also parameterizes iteration count and fill mode:

- Na⁺: `--ion-iteration-count: 1` and `--ion-fill-mode: both`.
- K⁺: `--ion-iteration-count: infinite` and `--ion-fill-mode: none`.
- The existing keyframes have invisible 0%/100% states at the start/end transforms. `both` therefore holds delayed Na⁺ particles at the invisible start state before their delay and holds completed particles at the invisible end state until the stream unmounts.
- The shared `animation-play-state: paused` declaration and the sole running override under `.ap-scene[data-playing="true"]` are unchanged.
- The reduced-motion rule remains `animation: none !important` with its representative static transform/opacity.

### TDD RED

A focused stylesheet contract was added first, asserting Na⁺ `1/both`, K⁺ `infinite`, shared custom-property consumption, and invisible start/end keyframes.

```text
npm test -- tests/action-potential/visual-contracts.test.ts
```

Exit code: `1`. One of three tests failed for the expected reason: `.ap-ion-stream--sodium` had no `--ion-iteration-count: 1`; the two existing visual contracts remained green.

### TDD GREEN and focused verification

After the minimal CSS change, the identical command exited `0`: 1/1 file and 3/3 tests passed.

The complete action-potential test directory then passed:

```text
npm test -- tests/action-potential
```

Exit code: `0`; 4/4 files and 44/44 tests passed.

### Full verification

```text
npm test && npm run lint && npm run build
```

Exit code: `0`.

- Tests: 20/20 files and 172/172 tests passed.
- Lint: ESLint exited with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.

After this report was staged, `git diff --cached --check` exited `0` with no output.

### Evidence limit

No browser evidence was added or updated. The in-app browser controller will reverify computed animation iteration/fill behavior after this commit.

## Follow-up generation causal-tail fix

### Root cause

After Na⁺ became a one-shot animation, generation still used its original fractional phase boundaries. With the unchanged 6000ms mode duration, those boundaries produced:

- stimulus: 0–960ms (960ms);
- sodium-channel-opening: 960–2160ms (1200ms);
- sodium-in: 2160–4320ms (2160ms);
- excited terminal frame: 4320–6000ms (1680ms).

The third Na⁺ particle completes after `650 + 2×100 = 850ms`, leaving a 1310ms interval with an influx caption but no visible moving ions. The defect was generation scheduling, not the one-shot CSS or conduction schedule.

The generation boundaries are now expressed in milliseconds without changing phase count/order:

| Phase | Boundary | Duration |
| --- | ---: | ---: |
| stimulus | 0–1000ms | 1000ms |
| sodium-channel-opening | 1000–2500ms | 1500ms |
| sodium-in | 2500–3550ms | 1050ms |
| excited terminal frame | 3550–6000ms | 2450ms |

The last particle completes 850ms into the 1050ms influx window, so center excitation follows after an exact 200ms causal pause. Total generation remains 6000ms. Conduction data/timing was not changed.

### TDD RED

The new generation contract samples the real `getActionPotentialFrame("generation", elapsed / MODE_DURATION_MS)` result for every millisecond, groups actual phase windows, and derives the causal tail from those windows plus the real Na⁺ CSS duration/stagger.

```text
npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/simulation.test.ts tests/action-potential/lab.test.tsx
```

Exit code: `1`. One test failed and 28 passed. The new assertion observed a 1310ms tail and failed only the approved `<=250ms` bound.

### TDD GREEN and focused verification

After changing only the generation boundaries, the identical focused command exited `0`: 3/3 files and 29/29 tests passed.

The complete action-potential directory then passed:

```text
npm test -- tests/action-potential
```

Exit code: `0`; 4/4 files and 45/45 tests passed. This includes existing terminal one-center-excited stop, replay, reduced-motion static generation particles/open channel, and conduction schedule contracts.

### Full verification

```text
npm test && npm run lint && npm run build
```

Exit code: `0`.

- Tests: 20/20 files and 173/173 tests passed.
- Lint: ESLint exited with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.

After this report was staged, `git diff --cached --check` exited `0` with no output.

### Evidence limit

No browser report was updated and no new browser result is claimed. The in-app browser controller will replay the final generation sequence after this commit.
