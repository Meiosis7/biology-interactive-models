# Final review fixes report

Date: 2026-08-11 (Asia/Shanghai)  
Worktree: `/Users/fushuo/Documents/一生 选必1 交互模型/.worktrees/action-potential-visual-polish`  
Base HEAD: `ca475fdb9e5a1521a7512e5e17b29305141daa68`

## Scope and root causes

This change fixes the six final-review Important findings and the replay Minor without changing the three modes, seven-segment shared fiber, charge slots, causal conduction stages, controls, or recovery-free biology.

- CSS transitions were independent of `animation-play-state`, so channel and membrane transitions continued after RAF playback paused.
- Excited/target shadows used full-edge inset/ring forms and visually resealed the outer fiber ends.
- Outside-current markers terminated under segment-center charges/channels.
- Named generic channel/stream elements had invalid ARIA semantics, and the current SVG omitted the two exact directional descriptions.
- The phase caption announced every automatic loop update.
- The K⁺ and Na⁺ gates shared the upper membrane lane and overlapped in narrow segments.
- Replay reset progress but retained still-mounted K⁺ and current animation instances.

The in-app Browser exposed neither `Element.getAnimations()` nor `Document.getAnimations()`. A first Web Animations retention implementation therefore could not freeze transitions in the actual target browser. The final implementation replaces only the affected 300 ms transitions with pause-aware CSS keyframes controlled by the existing `data-playing` state. Opening and excitation motion remain present, paused frames retain their computed progress, and reduced motion still disables animation.

## TDD evidence

### Initial RED

```text
npm test -- tests/action-potential/lab.test.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Exit `1`: 3/3 files ran; 9 failed and 44 passed (53 total).

The failures reproduced: no transition pause hook, full-edge shadows, centered outside endpoints in all three rounds, invalid/missing accessible roles and current descriptions, automatic `aria-live="polite"`, same-lane K⁺ geometry, and replay-retained K⁺ DOM.

### First GREEN

The identical command exited `0`: 3/3 files and 53/53 tests passed.

### Target-browser compatibility RED

Browser inspection then proved the target in-app Browser exposes no Web Animations query API. A focused contract was changed first to require the compatible pauseable-keyframe design.

```text
npm test -- tests/action-potential/lab.test.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Exit `1`: 1 failed and 52 passed. The expected failure found the remaining membrane `transition:` declaration.

After replacing the three affected transitions with 300 ms paused/running keyframes, the identical command exited `0`: 3/3 files and 53/53 tests passed.

## Implemented contracts

- Channel petals, channel pores, and excited membrane fill/shadow use 300 ms keyframes. They are paused by default and run only below `.ap-scene[data-playing="true"]`.
- Excited and current-target styling uses top/bottom inset emphasis plus vertical glow only; no `inset 0 0 0` or zero-spread outer ring remains.
- Each outside path ends 40 SVG units away from its destination segment center, still within the same adjacent pair and still directed inward.
- Membrane segments use `role="group"`; channel, stream, stimulus, and current diagram visuals use valid `role="img"` semantics.
- The current SVG exposes title `局部电流方向` and exact description `膜内局部电流向两侧未兴奋区；膜外局部电流返回兴奋区`.
- The phase caption uses `aria-live="off"` during automatic playback and `polite` while paused, completed, or reduced-motion-static.
- K⁺ remains in segment 1 but occupies the lower membrane lane. Its stream starts inside and exits downward: `--ion-start-y: -20px` to `--ion-end-y: 34px`, with `data-ion-direction="outward"`.
- A monotonic animation epoch remounts only the K⁺ stream and local-current SVG on restart. The shared fiber and all seven segment nodes keep stable identities.

## In-app Browser evidence

Target: `http://localhost:3002/models/action-potential`, served by this exact worktree. Temporary viewport overrides were reset and the verification tab was finalized.

### 1280 × 720

- Browser reported `innerWidth/clientWidth/scrollWidth = 1280/1280/1280`.
- Resting Na⁺ petal y-range was `625.52…649.52`; K⁺ petal y-range was `711.64…737.08`. All four Na⁺×K⁺ petal-pair intersection areas were `0 px²`.
- K⁺ retained `data-ion-direction="outward"` and `-20px → 34px`. Replay moved its first-particle transform from y `32.05` to the restarted y `18.69`, then advanced to `29.13`.
- Mid-channel opening paused with left-petal transform `translateX=-5.99108` and pore opacity `0.795057`; both transforms, both rectangles, and opacity were byte-for-byte unchanged after 650 ms. Resume reached `-6` and `0.8`.
- Mid-membrane excitation paused at `rgb(249, 225, 218)` with an intermediate top/bottom shadow. Background, shadow, and rectangle were unchanged after 650 ms; resume reached `rgb(255, 220, 211)`.
- Third-round paused state was `local-current / step 3`, excited `[1,2,3,4,5]`, targets `[0,6]`. Both purple outside markers were inward, approximately `12.40 × 10.61 px`, `37.08 px` off the destination centers, and had zero intersections with visible charges, channels, or ions.
- Fiber, first segment, and last segment side-border widths were all `0px`. First/last target shadows contained only top/bottom inset and vertical glow components. Direct screenshot inspection showed both purple arrowheads and both open ends.
- Terminal state stopped with seven excited segments, zero targets/arcs, side borders `0px`, and only top/bottom excited shadows; both ends remained visibly open.
- Current replay changed dash offset from `-19.44px` to the restarted `-11.78px`, then advanced to `-16.31px`, while remaining in step 1.

### 390 × 844

- Browser reported `innerWidth/clientWidth/scrollWidth = 390/390/390`.
- Resting Na⁺ petal y-range was `665.61…686.25`; K⁺ petal y-range was `733.71…755.59`. All four Na⁺×K⁺ petal-pair intersection areas were `0 px²`.
- K⁺ retained outward `-20px → 34px` motion. Replay changed its first-particle transform y from `32.96` to `15.12`, then advanced to `26.75`.
- Mid-channel opening paused at left-petal `translateX=-5.90979` and pore opacity `0.755403`; transforms, opacity, and rectangles were unchanged after 650 ms. Resume reached `-6` and `0.8`.
- Mid-membrane excitation paused at `rgb(250, 224, 217)`; background, shadow, and rectangle were unchanged after 650 ms, then resumed to the final coral state.
- Third-round targets were `[0,6]`. Both inward purple marker bounds had zero intersections; endpoints were `17.29 px` off their destination centers and both were inside the viewport after positioning the complete fiber in view. Direct screenshot inspection showed both arrowheads and open ends.
- Terminal state stopped with all seven segments excited, no targets/arcs, no side borders/rings, and both ends visibly open.
- Current replay changed dash offset from `-19.15px` to `-11.40px`, then advanced to `-16.22px`, while remaining in step 1.

Across the final browser session, console warnings/errors were `0`. Browser DOM inspection also confirmed one shared fiber, seven segments, three mode controls, valid current/channel image roles, exact title/description text, `aria-live="off"` while running, and `polite` while paused/terminal.

## Full automated verification

```text
npm test && npm run lint && npm run build
```

Exit `0`.

- Tests: 20/20 files, 200/200 tests, 0 failed.
- Lint: ESLint exited `0` with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.
- Vinext's informational route-classification note remained non-failing.
- `git diff --check` is intentionally the final command after this report is added; its fresh result is recorded in the task handoff.

## Files changed

- `components/action-potential/ActionPotentialLab.tsx`
- `components/action-potential/ActionPotentialScene.tsx`
- `components/action-potential/IonChannel.tsx`
- `components/action-potential/IonStream.tsx`
- `components/action-potential/LocalCurrentFlow.tsx`
- `components/action-potential/action-potential.css`
- `tests/action-potential/lab.test.tsx`
- `tests/action-potential/mode-components.test.tsx`
- `tests/action-potential/visual-contracts.test.ts`
- `.superpowers/sdd/final-review-fixes-report.md`

## Self-review and limitations

- Simulation data, phase durations/order, four fixed charge slots, four arcs per local-current frame, loop/terminal behavior, mode/control count, and forbidden recovery/voltage scope are unchanged.
- The K⁺ lower-lane direction remains scientifically outward: intracellular start above the lower membrane, extracellular end below it.
- Epoch keys are limited to animated overlays; automated identity assertions protect the fiber and segment nodes.
- The in-app Browser does not expose a reduced-motion preference emulator. Existing focused/full tests remain the evidence for zero RAF, disabled playback, static representative frames, and `aria-live="polite"` under reduced motion.
- Because the in-app Browser also omits SVG path measurement APIs, marker bounds were derived from the rendered path's actual `d`, the `700 × 160` viewBox scaling, marker geometry, and computed stroke width. Direct screenshots independently confirmed both visible arrowheads.
- No design, plan, or previous verification report was modified.

---

## Final re-review follow-up

Follow-up base HEAD: `0648eae598fb63c9a87f9f9690535d3640c7300c`

### Scope and root cause

At 390 px, the lower K⁺ channel and its particle track were still anchored at
`left: 76%` inside segment 1. That left too little horizontal clearance from
the segment-centered `inside-bottom` charge. The continuous boundary between
segments 1 and 2 is the widest available lower-membrane gap: it is equally
distant from both neighboring four-slot charge columns and from their upper Na⁺
channels.

The K⁺ channel and stream are now co-located at that boundary with
`left: 100%`. The particle stream's lower-membrane offset and outward
`-20px → 34px` motion are unchanged; the channel alone is lowered 3 px into the
gap between the inside-bottom and outside-bottom charge rows. The first
segment's existing `border-left: 0` override is now also protected by an
explicit visual-contract assertion.

### Follow-up TDD evidence

Focused RED:

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Exit `1`: 1 failed and 41 passed. The expected failure found the K⁺ channel at
`left: 76%` instead of the continuous segment boundary; the new first-segment
border assertion already passed against the existing correct CSS.

First focused GREEN: the identical command exited `0`, with 2/2 files and
42/42 tests passing.

Target-browser geometry then exposed one final 390 px edge case: at the segment
boundary, the K⁺ left petal still intersected segment 1's `inside-bottom`
charge by `4.7239 px²`. Its petal y-range was `733.71…755.59`, while that
charge ended at y `735.93`, leaving only about 2.2 px to clear vertically.

A second focused RED changed the channel-position contract to require
`bottom: -18px`; it exited `1` with the expected single failure and 41 passing
tests against the remaining `-15px` implementation. Moving only the K⁺ channel
down by 3 px then made the identical focused command GREEN again at 42/42. The
particle stream remained unchanged at the segment boundary.

### Follow-up full automated verification

```text
npm test && npm run lint && npm run build && git diff --check
```

Exit `0`.

- Tests: 20/20 files, 200/200 tests, 0 failed.
- Lint: ESLint exited `0` with no diagnostics.
- Build: Vinext completed all five stages and listed `/models/action-potential`.
- Diff check: exited `0` with no whitespace errors.

### Follow-up in-app Browser evidence

The root task inspected this shared final worktree state in the exact in-app
Browser; no substitute browser surface was used.

- At 390 × 844, computed K⁺ channel bottom was `-18px` and
  `clientWidth/scrollWidth = 390/390`. Across 6 samples spanning 1.68 s, all
  seven segments' charge slots versus K⁺ petals were `0 px²`, all charges versus
  every K⁺ particle were `0 px²`, K⁺ petals versus all Na⁺ petals were `0 px²`,
  and every K⁺ particle versus all Na⁺ petals was `0 px²`.
- At 1280 × 720, `clientWidth/scrollWidth = 1280/1280`. Across 5 samples
  spanning 1.6 s, the same four all-segment charge/Na intersection categories
  were all `0 px²`.
- The exact IAB console query returned an empty warnings/errors array.

The boundary anchor, unchanged particle trajectory, and channel-only 3 px
vertical adjustment therefore preserve a readable lower-membrane K⁺ gate and
downward outward flow while clearing both neighboring charge columns.
