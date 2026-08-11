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

## Post-fix focused browser re-verification

The final worktree build at `a7b18a3` was reloaded in the in-app Browser after the revised schedule, contrast, and one-shot sodium fixes. The focused pass intentionally repeated only the visual inputs changed after the original Task 4 acceptance.

### Desktop — exactly 1280 × 720

One complete third-round `neighbor-sodium-in` frame was sampled atomically from start through recruitment:

| Sample | Phase | Excited segments | Third Na⁺ particle |
| --- | --- | --- | --- |
| Delayed start | `neighbor-sodium-in` | `[1,2,3,4,5]` | opacity `0`; transform y=`-20`; iteration `1`; fill `both` |
| Crossing | `neighbor-sodium-in` | `[1,2,3,4,5]` | opacity `1`; transform y=`14.2947` |
| 70 ms tail | `neighbor-sodium-in` | `[1,2,3,4,5]` | opacity `0`; transform y=`34`; remained at the completed endpoint without restarting |
| Recruitment | `conducted` | `[0,1,2,3,4,5,6]` | stream unmounted; zero Na⁺ particles |

The sampled sodium animation reported duration `0.65s`, 100 ms particle staggering, `animation-iteration-count: 1`, and `animation-fill-mode: both`. This directly confirmed the third particle completed before recruitment and did not restart in the 70 ms phase tail.

Pause was repeated during `neighbor-sodium-in`. Immediately after pause and after 820 ms:

- Ion: opacity `1`; transform `matrix(0.973254, 0, 0, 0.973254, -12.5, 27.435)`; x=`356.1234`, y=`348.7928`; play state `paused`.
- Current marker: opacity `1`; transform `matrix(1, 0, 0, 1, -13.2327, 0)`; x=`451.7186`, y=`300.0234`; play state `paused`.

Every recorded value was unchanged after 820 ms. After Play and 180 ms, both play states became `running`; the ion reached the invisible endpoint and the current marker moved, with no snap to origin. Replay had created the fresh six-particle sequence used for this pause sample.

Generation was then replayed once after the final generation schedule fix. A continuous page-clock trace observed:

| Observed transition | Page-clock time | Evidence |
| --- | ---: | --- |
| Stimulus → channel opening | 650 ms after trace start | only central segment 3 opened; zero particles |
| Channel opening → Na⁺ influx | 2155 ms | exactly three Na⁺ particles; central channel remained open; no segment excited |
| Third particle visibly crossing | 2417…2910 ms | opacity rose to 1 while transform y advanced from `-16.729` to `33.2396` |
| Third particle completed | 3015 ms | opacity `0`; transform y=`34`; iteration `1`; fill `both` |
| Central excitation | 3198 ms | particles unmounted; only segment 3 became excited |

The observed sodium-in phase lasted approximately 1043 ms, and the causal tail from the third particle's invisible endpoint to central excitation was approximately 183 ms. This matched the schedule-derived 1050 ms phase / 200 ms tail contract within sampling granularity. The particle never restarted, the caption remained causally aligned, and replay created a fresh stimulus-first sequence.

Desktop K⁺ particles retained white labels on `rgb(90, 62, 145)` at 8 px. The three particles reported 720 ms duration, delays `0`, `125`, and `250` ms, and infinite iteration, confirming the intended visibly slower continuous resting outflow relative to the 650 ms Na⁺ pass.

### Mobile — exactly 390 × 844

The final page reported `innerWidth=clientWidth=scrollWidth=390`, so the timing/color changes introduced no horizontal overflow.

- Na⁺: white 7 px label on `rgb(11, 102, 115)` (`#0b6673`), contrast approximately 6.64:1; one iteration with fill mode `both`; all six sampled particles remained within x=0…390.
- K⁺: white 7 px label on `rgb(90, 62, 145)` (`#5a3e91`), contrast approximately 8.29:1; infinite iteration; sampled particle remained within x=0…390.
- The sampled Na⁺ ball measured approximately 21.24×21.24 px and the sampled K⁺ ball approximately 17.47×17.47 px. Both labels were visually distinct, centered, and aligned with their pores.

Reduced-motion media emulation remained unavailable in the in-app Browser. No system preference was changed; the strict zero-RAF, open-channel, and static-particle automated/CSS evidence remains the accepted reduced-motion proof.

This focused post-fix pass found no timing, contrast, pause, replay, overflow, or alignment regression.

## Looped generation, causal conduction, and open-fiber follow-up

Final verification was performed against HEAD `e32e21d` at `http://localhost:3002/models/action-potential`. Port 3002 was served by this exact worktree.

### Fresh automated evidence

The required chain was run once in order and exited 0 throughout:

| Command | Result |
| --- | --- |
| `npm test` | 20/20 test files and 194/194 tests passed; 0 failed; 5.19 s |
| `npm run lint` | ESLint exited 0 with no diagnostics |
| `npm run build` | All five Vinext stages completed; the action-potential route was listed |
| `git diff --check` | Exit 0; no output |

The focused reduced-motion command also passed: 1/1 selected test passed, with 9 non-selected tests skipped. It establishes zero requested animation frames and zero queued RAF callbacks, disabled Play and Replay, usable mode switching, generation `sodium-in` with one open central Na⁺ channel and three static Na⁺ particles, and conduction `neighbor-excited` with excited `[2,3,4]`, no particles, and no local-current paths.

### Looped generation at exactly 1280×720

A continuous 12,460 ms trace after Replay recorded:

```text
0 stimulus
781 sodium-channel-opening
2264 sodium-in (3 Na⁺)
3347 excited ([3])
5778 stimulus
6771 sodium-channel-opening
8255 sodium-in (3 fresh Na⁺)
9327 excited ([3])
11761 stimulus
```

Playback remained running throughout. The first `excited` frame wrapped directly to `stimulus`; no recovery state/text appeared. Pause during the second cycle froze all three Na⁺ particle rectangles/transforms for 820 ms and the open channel petals/pore for 720 ms. Play resumed in place and particle transforms advanced after 180 ms. Replay immediately restored `stimulus`, zero particles, and running playback.

### Three rounds of causal conduction

The complete observed trace was:

```text
0    local-current step 1 / excited [3] / targets [2,4] / 4 arcs
278  neighbor-sodium-in / excited [3] / influx [2,4] / 6 Na⁺ / 0 arcs
1191 neighbor-excited / excited [2,3,4] / 0 particles / 0 arcs
1553 local-current step 2 / excited [2,3,4] / targets [1,5] / 4 arcs
2085 neighbor-sodium-in / excited [2,3,4] / influx [1,5] / 6 Na⁺ / 0 arcs
2995 neighbor-excited / excited [1,2,3,4,5] / 0 particles / 0 arcs
3352 local-current step 3 / excited [1,2,3,4,5] / targets [0,6] / 4 arcs
3880 neighbor-sodium-in / excited [1,2,3,4,5] / influx [0,6] / 6 Na⁺ / 0 arcs
4793 neighbor-excited / excited [0,1,2,3,4,5,6] / 0 particles / 0 arcs
5172 conducted / excited [0,1,2,3,4,5,6] / 0 particles / 0 arcs
5766 conducted / excited [0,1,2,3,4,5,6] / stopped
```

The three captions changed in order between local current, Na⁺ influx, and adjacent excitation. Each next local current appeared only after the prior targets were excited. Every local-current beat had exactly four short arcs: two inside/outward and two outside/inward. Adjacent pairs progressed `2↔3 + 3↔4`, then `1↔2 + 4↔5`, then `0↔1 + 5↔6`. All arcs disappeared in influx and newly-excited phases. Terminal replay immediately returned to step 1 with excited `[3]`, targets `[2,4]`, four arcs, and running playback.

### Open ends, charge rows, and responsive layout

| Observation | 1280×720 | 390×844 |
| --- | --- | --- |
| `innerWidth / clientWidth / scrollWidth` | `1280 / 1280 / 1280` | `390 / 390 / 390` |
| Fiber top / bottom border | `3px / 3px` | `3px / 3px` |
| Fiber left / right border | `0px / 0px` | `0px / 0px` |
| Fiber top-left / top-right radius | `0px / 0px` | `0px / 0px` |
| First segment computed left border | `0px` | `0px` |
| First segment left radii | `0px / 0px` | `0px / 0px` |
| Last segment right radii | `0px / 0px` | `0px / 0px` |
| Visible segments | 7 | 7 |
| Open-end overlap count | 0 | 0 |

The Task 4 reviewer Minor is directly closed: the first membrane segment's computed `border-left-width` is `0px` at both viewports.

At desktop, an excited segment's charge centers had strictly increasing y values `319.023, 358.023, 410.023, 449.023`, identical x=`460.125`, and signs `−,＋,＋,−`. At mobile, a resting segment measured y=`652.730, 691.730, 728.129, 767.129`, identical x=`77.203`, and signs `＋,−,−,＋`; an excited mobile segment independently showed `−,＋,＋,−` with `0px` horizontal spread.

Desktop local-current/influx bounds scans covered 61/63 visible elements; mobile resting/local-current/influx scans covered 58/61/63. Every scan had 0 horizontal-bound failures and 0 label/object intersections. Dedicated open-end scans across charges, channels, ions, arcs, and labels also found 0 overlaps. Browser console warnings/errors: 0.

Direct-viewport screenshots are genuine PNG files at the exact requested sizes:

- `.superpowers/sdd/action-potential-open-fiber-desktop-1280x720.png` (1280×720)
- `.superpowers/sdd/action-potential-open-fiber-mobile-390x844.png` (390×844)

Both visibly show the uncapped left/right ends and all four charge rows.

### Forbidden scope and limitations

Rendered text in each of resting, generation, and conduction was scanned for `mV`, `-70`, `−70`, `曲线`, `复极化`, `超极化`, and `恢复`; each mode returned 0 matches.

The in-app Browser cannot emulate `prefers-reduced-motion`, so no media-preference browser evidence is claimed and no system setting was changed. The dedicated zero-RAF test above is the accepted evidence. The screenshots and detailed Task 5 report are ignored verification artifacts under `.superpowers/sdd/.gitignore`; they remain at the stated paths. No product defect or acceptance blocker was found.
