# Humoral immunity final-review fix report

Date: 2026-08-09  
Base/head before this fix: `93cb68f` (`feat: complete humoral immunity alignment`)  
Authoritative review: `.superpowers/sdd/humoral-final-review-findings.md`  
Approved design: `docs/superpowers/specs/2026-08-09-humoral-immunity-cellular-alignment-design.md`

## Status

DONE. All four Important findings, both Minor findings, and the added textbook two-signal requirement are addressed. The final focused tests, full test suite, lint, build, and responsive visual checks pass.

The pre-existing dirty tracked scratch file `.superpowers/sdd/task-2-report.md` was neither edited by this work nor staged.

## Phase 1: reproduction and data-flow trace

Before production edits, the existing humoral tests passed (`2` files, `26` tests), confirming that the review findings were untested behavior rather than existing test failures.

### Finding 1: mismatch exposed before its stop

- Reproduction: snapshots at times `0`, `4.9`, `5`, and `18` all returned `blockedAt: "b-activation"`. At time `0`, the rendered lab already showed heading `未匹配`, announcer `未匹配：抗原呈递`, a failed spine, an `is-blocked` B cell, and mismatch chart/scene copy.
- Trace: `getHumoralSnapshot()` selected `getStoppedSnapshot()` as soon as settings contained a mismatch. `getStoppedSnapshot()` calculated `blockedStarted`, but returned the configured `blockedAt` unconditionally. `HumoralImmunityLab`, `HumoralProcessView`, and `AntibodyChart` all treated that non-null field or raw `bCellMatched` as an already-reached failure.
- Cellular reference: `getRecognitionLimitedSnapshot()` keeps `blockedAt` null before target-recognition, then exposes it at the recognition threshold.
- Root cause: the snapshot did not distinguish a stable configured future stop from a reached stop, and consumers independently exposed raw configuration.

### Finding 2: secondary clearance and invisible memory interval

- Reproduction: matched secondary used `memory: 18`; at time `15`, antigen was `25` versus primary `20`; at time `16`, primary antigen was `0` while secondary was `17`. Secondary remained in `antibody-binding` through time `17` and reached `memory` only at duration `18`.
- Trace: `MATCHED_SECONDARY_TIMELINE.memory` was simultaneously the stage-seven start, antibody-decay end, antigen-clearance end, and plasma-cell display end.
- Root cause: one timestamp represented three independent biological/teaching events.

### Finding 3: contradictory outcome inference

- Reproduction: with BCR B plus a helper-T intervention, Lab and Chart reported intervention while the scene still said `BCR 与抗原不匹配`. With `b-cell-missing`, the scene rendered `匹配 B 细胞`, a BCR, and `待活化`. Secondary mismatch settings said `记忆不匹配：按初次反应` while the curve was flat. Mismatch and absence used the same blocked styling.
- Trace: Lab derived `recognitionLimited` from settings plus `bCellMatched`; ProcessView rechecked `settings.condition` and `bCellMatched`; Chart separately derived mismatch/intervention/matched-secondary. None consumed one authoritative reason.
- Root cause: the simulation returned quantities but not a centralized stop reason/reached contract, so UI consumers implemented different precedence rules.

### Finding 4: live quantity flood

- Reproduction: `.humoral-live-values` had both `aria-live="polite"` and `aria-atomic="true"`; its existing test required the live attribute.
- Root cause: continuously changing values were placed in a live region instead of leaving only the dedicated stage announcer live.

### Minor 1: scene semantics and decorative tokens

- Reproduction: the named scene was a generic `div` with no role; rendered clone/antibody `B` and `Y` tokens had no `aria-hidden`.
- Root cause: visual scene naming and decorative glyph semantics were not explicitly modeled.

### Minor 2: mobile visual order

- Reproduction: below `980px`, chart had `order: 2`, explanation `order: 3`, while the later live-values item remained `order: 0`; visual order became process → quantities → chart → explanation.
- Root cause: positive ordering rules were retained after quantities became a separate grid item.

### Added textbook requirement

- Reproduction: existing stage and scene copy described generic presentation/help/binding, but omitted direct pathogen–B-cell first signaling; dendritic/B/other APC capture; helper-T proliferation, differentiation, cytokines, contact, and second signaling; the two-signal gate; plasma-majority/memory-minority differentiation; and antibody inhibition of proliferation/adhesion in body fluids.
- Root cause: the earlier copy represented the high-level seven stages but not the textbook mechanism inside those stages.

## RED evidence

### Simulation RED

Command:

```text
npm test -- --run tests/models/humoral-immunity/simulation.test.ts
```

Relevant exact summary:

```text
Test Files  1 failed (1)
Tests  9 failed | 6 passed (15)
```

Expected failures proved:

- time-zero mismatch returned `blockedAt: "b-activation"` instead of null and had no `stopReason`/`stopReached`;
- intervention snapshots had no centralized reason/reached fields;
- secondary stage at time `16` was `antibody-binding`, not `memory`;
- matched-secondary clearance time was `18`, later than primary `16`.

### Lab/scene/chart/accessibility/layout/textbook RED

Command:

```text
npm test -- --run tests/models/humoral-immunity/lab.test.tsx
```

Relevant exact summary:

```text
Test Files  1 failed (1)
Tests  12 failed | 10 passed (22)
```

Expected failures covered delayed mismatch visibility, distinct unmatched styling, neutral/absent B-cell rendering, all mismatch-plus-intervention combinations, secondary mismatch status, textbook copy, quantity live-region removal, scene group/token semantics, and mobile order.

During final self-review, one additional cross-view copy defect was found: `b-cell-missing` still let the helper-T scene imply contact with a B cell. A focused RED test failed as expected:

```text
Test Files  1 failed (1)
Tests  1 failed | 21 skipped (22)
```

The independent final code review then found four remaining gaps: the configured stop stage was not stable for every stop reason, completed primary memory showed pre-response copy, helper blockade overclaimed a first signal when the hidden BCR mismatched, and differentiation began with equal plasma/memory counts. Focused tests were added before the corresponding production changes; the combined RED was:

```text
Test Files  2 failed (2)
Tests  10 failed | 30 passed (40)
```

Those failures also verified the actual primary clearance boundary (`15.999`/`16`), independently compared secondary peak magnitude and late persistence, and protected the plasma-majority relationship.

## Fixes and passing evidence by finding

### Important 1: delayed mismatch reach

- Fix: `HumoralSnapshot` now carries stable `stopAt`, authoritative `stopReason`, actual `blockedAt`, and `stopReached`. A configured BCR mismatch has `stopAt: "b-activation"` but keeps `blockedAt: null` until time `5`; at time `5` and later it exposes `blockedAt: "b-activation"` and `stopReached: true`.
- Consumers gate unmatched headings, announcer text, spine/cell classes, chart summary, and scene failure copy on `stopReached`.
- Before the threshold, the UI shows the real current stage and neutral pending copy.
- Tests: `keeps a BCR mismatch pending until B-cell activation is reached`; `reveals a BCR mismatch only when B-cell activation is reached` cover time `0`, `4.9`, exactly `5`, and `18`.
- Passing trace: time `0`/`4.9` have `blockedAt: null`, `stopReached: false`; time `5`/`18` have `blockedAt: "b-activation"`, `stopReached: true`.

### Important 2: independent timing endpoints

- Fix: matched-secondary stage seven now starts at `15`, giving a visible `[15, 18]` memory interval. `ResponseProfile` separately defines antibody persistence (`18`) and antigen clearance (`15`); primary endpoints remain `16`.
- At time `15`: primary antibody/antigen = `50/20`; secondary = `90/0`, already in `memory`.
- At times `16` and `17`, secondary remains in `memory` with antibody `60` and `30`, independently preserving its longer tail while antigen stays `0`.
- Tests: `makes a matched secondary response faster, stronger, and longer`; `clears antigen no later in a matched secondary response` sample the entire timeline and verify memory reachability.
- The primary memory-stage scene now reports that antibody binding completed and antigen was cleared rather than falsely saying antibody has not yet been secreted.

### Important 3: one authoritative reason and precedence

- Fix: `stopReason` is one of `bcr-mismatch`, `presentation-blocked`, `helper-t-blocked`, `b-cell-missing`, or null. `stopAt` centralizes the configured destination while `blockedAt`/`stopReached` identify an actually reached stop. Simulation gives interventions precedence over simultaneous BCR mismatch.
- Lab, ProcessView, and Chart now classify outcomes only from `snapshot.stopReason`, `snapshot.stopAt`, and `snapshot.stopReached`; none re-infers outcome from raw settings/BCR match.
- ProcessView uses neutral heading `B 细胞`; `b-cell-missing` renders an absence placeholder and no receptor; mismatch uses `is-unmatched`, while interventions use `is-blocked`.
- Secondary mismatch uses neutral pending status before reach, then an explicit reached-stop status; it never claims a primary-like memory-mismatch response.
- The final self-review fix makes helper-T copy explicitly say no B cell is available for second-signal contact in the missing-cell condition.
- Helper-T blockade copy no longer claims that the first signal exists when intervention precedence masks a mismatched BCR.
- Tests: table-driven simulation and UI coverage for all three mismatch-plus-intervention combinations, missing-cell absence/receptor removal, secondary mismatch status, and distinct CSS classes.

### Important 4: quantity announcements

- Fix: removed `aria-live` and `aria-atomic` from `.humoral-live-values`; retained the dedicated polite, atomic stage announcer.
- Test: `keeps live quantities outside the explanation card` now requires quantities not to be live while verifying stage announcements still update.

### Minor 1: semantic scene/decorative tokens

- Fix: scene has `role="group"` with its accessible name; all repeated clone/antibody glyphs have `aria-hidden="true"`.
- Test: `keeps scene semantics and decorative tokens accessible`.

### Minor 2: aligned responsive order

- Fix: removed the positive `order` declarations. DOM and visual order are now process → chart → explanation → quantities.
- Test: `keeps mobile visual order aligned with process, chart, explanation, quantities DOM order`.

### Textbook two-signal mechanism

- Fix: preserved the approved seven stages while expanding stage and scene copy:
  - presentation covers direct B-cell contact/first signal and capture by dendritic cells, B cells, and other APCs;
  - APCs process and present antigen to helper T cells;
  - activated helper T cells proliferate/differentiate, secrete cytokines, contact B cells, and provide the second signal;
  - B-cell activation explicitly requires both signals;
  - cytokines promote proliferation/differentiation, mostly to plasma cells and partly to memory B cells;
  - plasma-cell antibodies enter body fluids, bind antigen specifically, and inhibit pathogen proliferation or adhesion to human cells.
- The teaching counts preserve that majority/minority relationship as soon as differentiation begins (`plasmaCount > memoryCount`).
- Tests: `teaches the textbook two-signal mechanism across explanations and the scene`, `keeps plasma cells the majority when differentiation begins`, plus missing-cell and masked-mismatch consistency coverage.

## Final verification

Focused combined command:

```text
npm test -- --run tests/models/humoral-immunity/simulation.test.ts tests/models/humoral-immunity/lab.test.tsx
```

Final result after all self-review fixes:

```text
Test Files  2 passed (2)
Tests  40 passed (40)
Duration  3.46s
```

Fresh required full verification after the final production change:

```text
npm test
Test Files  18 passed (18)
Tests  181 passed (181)
Duration  18.45s

npm run lint
eslint . --ignore-pattern dist --ignore-pattern .next
exit 0; no warnings or errors

npm run build
all 5 vinext build phases passed
161 client-reference modules, 89 server-reference modules,
167 RSC modules, 96 client modules, 95 SSR modules transformed
6 application routes emitted
Build complete
```

Responsive visual QA on the production build:

- Desktop: two-column grid, four-column scene, no horizontal overflow.
- Mobile below the `720px` breakpoint (browser backend viewport `500×1082`): one-column scene; computed item tops strictly followed process (`307.5`) → chart (`1374.5`) → explanation (`1801.8`) → quantities (`2191.3`); every item had computed `order: 0`; no horizontal overflow.
- The only element with intentional internal overflow was the 1px screen-reader-only announcer.
- Browser console contained no warnings or errors.

An earlier full-suite attempt produced distributed five-second timeouts across six unrelated UI suites (`20` timeout failures, `158` passes) under concurrent resource contention. No assertions failed. The affected humoral file immediately passed focused, the exact full command then passed, and the final exact full command after the last code change passed `181/181` as recorded above.

## Files changed

- `models/05-humoral-immunity/types.ts`
- `models/05-humoral-immunity/simulation.ts`
- `models/05-humoral-immunity/HumoralImmunityLab.tsx`
- `models/05-humoral-immunity/HumoralProcessView.tsx`
- `models/05-humoral-immunity/AntibodyChart.tsx`
- `models/05-humoral-immunity/humoral-immunity.css`
- `tests/models/humoral-immunity/simulation.test.ts`
- `tests/models/humoral-immunity/lab.test.tsx`
- `.superpowers/sdd/humoral-final-fix-report.md`

## Self-review and concerns

- Every authoritative finding and the textbook delta has a direct test and passing evidence above.
- Outcome/stop reason remains centralized in the simulation snapshot; consumers only format the shared classification.
- The seven-stage architecture, independent controls, reset/playback behavior, normal primary response, secondary comparison curve, and reduced-motion behavior remain intact.
- Timing and quantities remain explicitly instructional rather than clinical/physiological measurements.
- The Vinext build prints its existing informational `Unknown` route-classification note; the build exits successfully and emits all routes.
- No Critical or Important concern remains.
