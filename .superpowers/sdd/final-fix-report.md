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
  - Verifies calculated contrast ratios, desktop/mobile color inheritance, 720ms sodium completion, slower potassium timing, and paused/running CSS rules.

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

- Sodium: `520ms` duration and `100ms` stagger. The third particle completes at `520 + 2×100 = 720ms`, within each 720ms conduction influx phase.
- Potassium: species-specific `660ms` duration and `130ms` stagger, slower than sodium.
- `.ap-ion-particle` remains paused by default.
- `.ap-scene[data-playing="true"] .ap-ion-particle` remains the only rule that sets it running.

## Read-only review

The reviewer approved the reduced-motion frame choice, conduction neighborhood, contrast tokens, timing separation, pause contract, and biological scope. The only Important issue was the initial request/cancel RAF behavior; it was reproduced with a failing test and fixed before final verification. No Critical or remaining Important issues were reported.

The reviewer noted that an optional future timing margin below 720ms could add scheduling slack. The current explicit requirement is met (`<=720ms`) and no out-of-scope timing redesign was added.

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
