# Action-potential visual-polish verification report

Date: 2026-08-11 (Asia/Shanghai)
Worktree: `/Users/fushuo/Documents/一生 选必1 交互模型/.worktrees/action-potential-visual-polish`
Original browser-verified commit: `24eec93` (`fix: separate conduction label lanes`)
Final-fix commit: `c46da03` (`fix: polish accessible ion motion`)
Follow-up commit subject: `fix: give sodium influx timing margin` (final SHA is recorded in the handoff)
Result: **PASS**

This file preserves the approved Task 4 evidence previously recorded in `task-4-report.md` and adds the final automated-fix verification. Browser measurements below remain evidence for commit `24eec93`; no browser evidence is claimed for the later particle colors, duration/stagger values, or strict zero-RAF fix.

## Final-fix addendum

The final-review fixes changed only representative reduced-motion progress, preference initialization, ion particle fill/label tokens, and species-specific animation timing.

- Reduced-motion generation now renders `sodium-in` with one open central Na⁺ channel and three static Na⁺ particles.
- Reduced-motion conduction now renders `neighbor-sodium-in` with excited segments `[2,3,4]`, open/influx neighbors `[1,5]`, local-current targets `[1,5]`, and six static Na⁺ particles.
- Play/replay remain disabled, mode switching remains usable, and the RAF mock is never called while reduced motion is active, including initial render.
- White labels on sodium `#0b6673` and potassium `#5a3e91` fills calculate to about `6.64:1` and `8.29:1`, respectively. Mobile inherits the same colors.
- The unchanged six-phase conduction order is now three repetitions of 580ms local current and 920ms Na⁺ influx. Recruitment completes at 4500ms, then the terminal frame holds for 1500ms within the existing 6000ms mode duration.
- Na⁺ uses `650ms` duration and `100ms` stagger, so the last of three particles completes at 850ms with 70ms of phase margin. K⁺ uses a slower `720ms`/`125ms` contract. Existing paused/running `animation-play-state` rules are unchanged.

TDD and final command evidence are detailed in `final-fix-report.md`. The post-fix complete verification chain passed once: 20/20 test files and 171/171 tests, clean lint, successful five-stage build, and clean `git diff --check`.

Follow-up automation after the schedule-derived timing fix also passed: 20/20 files and 171/171 tests, clean lint, successful five-stage build, and a clean staged diff check. The synapse-transmission `task-2-report.md` matches its `9be3ff7` base blob exactly, and this plan-path verification report is now tracked rather than ignored.

## Preserved approved Task 4 evidence

### Automated verification at `24eec93`

The original complete chain passed:

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | 19 test files passed; 169 tests passed; 0 failed; 6.13 s |
| `npm run lint` | PASS | ESLint exited 0 with no diagnostics |
| `npm run build` | PASS | Vinext completed all five build stages and listed `/models/action-potential`; exit 0 |
| `git diff --check` | PASS | Exit 0; no output |

The original focused reduced-motion case also passed 1/1 with 9 skipped. That earlier case established no queued RAF, disabled playback/replay, working mode switching, and representative conduction segments `[2,3,4]`; the final-fix tests strengthen it to prove no RAF call and visible static Na⁺ content.

The Task 4 browser console contained zero warnings and zero errors.

### Desktop browser verification — exactly 1280 × 720

The in-app Browser reported `innerWidth=1280`, `innerHeight=720`, `documentElement.clientWidth=1280`, and `documentElement.scrollWidth=1280`.

- Each mode independently reported exactly one shared fiber, seven membrane segments, and five buttons.
- All seven segment rectangles formed one continuous fiber from x=138.18 to x=781.09, contained by the fiber rectangle x=135.18 to x=784.09. No horizontal overflow was present.
- The controls were exactly the three mode buttons, play/pause, and replay. Their rectangles were 385.87×44 px for each mode button, 66×44 px for play/pause, and 98×44 px for replay.
- All three modes were scanned independently for `mV`, `-70`, `−70`, `曲线`, `复极化`, `超极化`, and `恢复`; every term was absent.

#### Channel geometry

Coordinates are direct `getBoundingClientRect()` observations in CSS pixels.

| State | Left petal `(x, y, w, h)` | Pore `(x, y, w, h)` | Right petal `(x, y, w, h)` | Gap |
| --- | --- | --- | --- | ---: |
| Central Na⁺ closed | `(449.13, 625.52, 12, 24)` | `(459.53, 622.52, 1.20, 30)` | `(459.13, 625.52, 12, 24)` | -2.00 px |
| Central Na⁺ open | `(440.58, 625.64, 15.22, 25.44)` | `(458.13, 622.52, 4, 30)` | `(464.46, 625.64, 15.22, 25.44)` | 8.66 px |
| K⁺ open | `(280.51, 625.64, 15.22, 25.44)` | `(298.06, 622.52, 4, 30)` | `(304.39, 625.64, 15.22, 25.44)` | 8.66 px |

For central Na⁺, the left edge moved 8.55 px left and the right edge moved 5.33 px right. Petal vertical centers drifted only 0.84 px (≤2 px), and the gap grew from -2.00 to 8.66 px. Open K⁺ directly measured the same 8.66 px gap, with one pore centered between two outward petals. Every channel used exactly two petals and one pore.

The approved simulation exposes K⁺ only as open in resting mode and omits the K⁺ channel from generation/conduction; it does not expose a same-element closed K⁺ frame. No closed K⁺ state was fabricated. Shared `IonChannel` markup, species-neutral open selectors, the potassium palette/position override, and the passing potassium structure test establish that K⁺ uses the same opening mechanism.

#### Generation sequence

Fresh replay samples:

| Time after replay | Phase | Open Na⁺ segments | Na⁺ particles | Excited segments | Playing |
| ---: | --- | --- | ---: | --- | --- |
| 0 ms | stimulus | none | 0 | none | true |
| 1100 ms | sodium-channel-opening | `[3]` | 0 | none | true |
| 2450 ms | sodium-in | `[3]` | 3 | none | true |
| 4650 ms | excited | `[3]` | 0 | `[3]` | true |
| 6350 ms | excited | `[3]` | 0 | `[3]` | false |

This proved stimulus → one central sodium channel → three labeled Na⁺ particles crossing that pore → only the center segment excited → stopped terminal frame.

#### Conduction sequence and current direction

Fresh replay samples:

| Time | Phase/step | Current targets | Open Na⁺ | Excited segments | Na⁺ particles |
| ---: | --- | --- | --- | --- | ---: |
| 0 ms | local-current / 1 | `[2,4]` | none | `[3]` | 0 |
| 900 ms | neighbor-sodium-in / 1 | `[2,4]` | `[2,4]` | `[3]` | 6 |
| 1550 ms | local-current / 2 | `[1,5]` | none | `[2,3,4]` | 0 |
| 2300 ms | neighbor-sodium-in / 2 | `[1,5]` | `[1,5]` | `[2,3,4]` | 6 |
| 3100 ms | local-current / 3 | `[0,6]` | none | `[1,2,3,4,5]` | 0 |
| 3900 ms | neighbor-sodium-in / 3 | `[0,6]` | `[0,6]` | `[1,2,3,4,5]` | 6 |
| 4550 ms | conducted | none | none | `[0,1,2,3,4,5,6]` | 0 |
| 6250 ms | conducted | none | none | `[0,1,2,3,4,5,6]` | 0; playing=false |

The current DOM/computed animation names agreed with the teaching direction:

- Membrane inside: `data-current-direction="outward"`, label `膜内局部电流向两侧未兴奋区`, animations `ap-current-out-left` and `ap-current-out-right`.
- Membrane outside: `data-current-direction="inward"`, label `膜外局部电流返回兴奋区`, animations `ap-current-in-left` and `ap-current-in-right`.

The final conduction frame remained at 7/7 excited segments and stopped without recovery.

### Pause retention, resume, and replay

The Task 4 browser test paused during conduction phase `neighbor-sodium-in`, when Na⁺ particles and a current marker coexisted.

Immediately after pause:

- Scene: `data-playing="false"`.
- Ion: rectangle x=356.124, y=348.787, w=24.331, h=24.331; transform `matrix(0.97323, 0, 0, 0.97323, -12.5, 27.4293)`; `animation-play-state: paused`.
- Current marker: rectangle x=456.545, y=300.023, w=3.674, h=8; transform `matrix(1, 0, 0, 1, -2.7245, 0)`; `animation-play-state: paused`.

After 820 ms, both rectangles/transforms were byte-for-byte unchanged; a second independent pause sample remained unchanged for 760 ms. After play and 90 ms, the scene returned to `data-playing="true"`, both play states became running, and both elements moved. Replay returned conduction to its first `local-current` frame and later created a fresh six-particle `neighbor-sodium-in` sequence. There was no snap to an animation origin on pause.

### Mobile browser verification — exactly 390 × 844

The in-app Browser reported `innerWidth=390`, `innerHeight=844`, `clientWidth=390`, and `scrollWidth=390`.

- One shared fiber and exactly seven segments were present.
- A bounds scan covered 54 visible segment, petal, charge, ion, compartment, current, region, bidirectional, and control elements. All 54 stayed within x=0…390; failures: 0.
- The conduction ion/current frame had seven segments, 14 petals, 14 charges, six Na⁺ ion balls/labels, two current labels, three region labels, and five controls.
- An intersection scan found zero label/object intersections in both resting/K⁺ and conduction/Na⁺ frames.
- Control sizes were 118×49 px for mode buttons, 66×44 px for pause, and 98×44 px for replay; all passed the 44×44 minimum.
- Open conduction channels on segments 2 and 4 were centered 0.50 px from their membrane-segment centers.

Mobile channel rectangles:

| State | Left petal `(x, y, w, h)` | Pore `(x, y, w, h)` | Right petal `(x, y, w, h)` | Gap |
| --- | --- | --- | --- | ---: |
| Central Na⁺ closed | `(197.93, 665.61, 10.32, 20.64)` | `(206.87, 663.03, 1.03, 25.80)` | `(206.53, 665.61, 10.32, 20.64)` | -1.72 px |
| Central Na⁺ open | `(190.57, 665.71, 13.09, 21.88)` | `(205.67, 663.03, 3.44, 25.80)` | `(211.11, 665.71, 13.09, 21.88)` | 7.45 px |
| K⁺ open | `(116.58, 665.71, 13.09, 21.88)` | `(131.68, 663.03, 3.44, 25.80)` | `(137.12, 665.71, 13.09, 21.88)` | 7.45 px |

The Na⁺ left edge moved 7.36 px left and right edge moved 4.58 px right; petal vertical-center drift was 0.72 px (≤2 px). The directly observed open K⁺ rectangle had the same 7.45 px gap, subject to the same-element comparison limitation. At scrollY=660, the screenshot contained the complete fiber at viewport y=10.93…88.93 and complete controls card at y=706.27…812.27.

### Original reduced-motion evidence and limitations

The approved Task 4 CSS inspection confirmed the reduced-motion media query removes transitions/animations from channel petals, pore, particles, current dots/tracks, and membrane segments, and supplies static particle/current transforms. The in-app Browser controller did not expose reduced-motion media emulation, so macOS preferences were not mutated and no unsupported browser observation was claimed. This remains an automated/CSS contract; the final-fix test now adds exact open-channel/particle and strict zero-RAF assertions.

The app exposes K⁺ only as open while resting and omits it from other modes, so a same-element K⁺ closed→open browser comparison remains unavailable without changing/fabricating product state.

### Screenshots retained from Task 4

- [Desktop sodium-open generation frame](./action-potential-desktop-sodium-open-1280x720.png) — direct 1280×720 viewport; phase sampled as `sodium-in`; three Na⁺ particles existed with staggered motion.
- [Desktop local-current conduction frame](./action-potential-desktop-local-current-1280x720.png) — direct 1280×720 viewport; phase `local-current`, step 1, targets `[2,4]`.
- [Mobile complete fiber and controls](./action-potential-mobile-390x844.png) — direct 390×844 viewport; complete 7/7 terminal fiber and both playback controls visible together.

Visual inspection confirmed the warm light textbook style, legible channel/charge/ion/current distinctions, and no visible clipping or overlap in the captured states. All three retained files are genuine PNGs at exactly 1280×720, 1280×720, and 390×844.

## Final acceptance checklist

- [x] Two petals and one pore per Na⁺ and K⁺ channel
- [x] Direct Na⁺ horizontal opening with ≤2 px vertical drift; open K⁺ geometry/shared mechanism verified with stated limitation
- [x] Three labeled ions cross the generation pore with staggered motion
- [x] Intracellular current flows outward; extracellular current returns inward
- [x] Pause freezes particle/current; play resumes; replay restarts
- [x] Warm, light textbook styling remains consistent
- [x] Three modes, seven segments, sequence logic, and terminal states unchanged
- [x] No curve, voltage value, recovery phase, or extra control
- [x] Reduced-motion representative Na⁺ frames, disabled controls, usable mode switching, and zero RAF calls verified
- [x] Na⁺/K⁺ label contrast exceeds 4.5:1 at desktop and mobile sizes
- [x] All three Na⁺ particles complete at 850ms within each 920ms influx phase; K⁺ uses slower species-specific timing
- [x] Exact desktop/mobile Task 4 layout checks remain preserved as historical browser evidence
- [x] Post-fix full automated test/lint/build/diff-check chain passes

## Remaining evidence limit

Browser re-verification was intentionally deferred to the next review stage. The final color, revised schedule/timing, and strict reduced-motion changes are supported here by automated/CSS/build evidence only; the preserved browser measurements are explicitly scoped to the unchanged geometry and behavior observed at `24eec93`.
