# Bilateral membrane Task 4 acceptance report

## Current status at `5dc0fe9` (2026-08-11)

### Status

**PASS**

Accepted commit: `5dc0fe90c47c711cc67647a09268537ad5c07a67`

The former Na⁺ particle–charge blocker is resolved. Exact in-app Browser verification on this commit produced `0 px²` intersections at both `1280×720` and `390×844` in generation and conduction, with no open-end intrusion or horizontal overflow. Fresh automation also passed: 20 test files / 214 tests, lint, five-stage build, and `git diff --check` all exited 0.

The detailed current-HEAD evidence appears in `Current-HEAD re-audit after overlap fix` below and in the `Bilateral membrane follow-up` section of `action-potential-visual-polish-verification.md`. All earlier BLOCKED and unavailable-browser results in this file are historical and superseded by the current PASS.

---

## Superseded re-audit attempt at `5dc0fe9`

### Historical status

**INCONCLUSIVE — exact in-app Browser unavailable in that attempt; superseded by later exact-IAB PASS**

Re-audit commit: `5dc0fe90c47c711cc67647a09268537ad5c07a67`

The required fresh automated chain passed, but the exact Codex in-app Browser backend was unavailable in this re-audit environment. Browser runtime diagnostics listed only a Chrome extension backend. Two exact selections of `agent.browsers.get("iab")` both returned `Browser is not available: iab`. The Browser skill treats the requested browser as a hard constraint and forbids substituting Chrome or another automation surface, so no browser acceptance claim is made from this run.

### Fresh automated chain

Executed once, in order, against the re-audit commit:

- `npm test`: exit 0; 20 test files passed; 214 tests passed.
- `npm run lint`: exit 0; no lint errors or warnings reported.
- `npm run build`: exit 0; all five vinext build stages completed and the action-potential route was included.
- `git diff --check`: exit 0.

### Browser verification not established in this re-audit

Because the exact in-app Browser could not be selected, this run did not independently re-establish the following required evidence after the collision fix:

- dense 1280×720 and 390×844 geometry samples with every requested intersection class at `0 px²` and no horizontal overflow;
- generation charge atomicity, bilateral Na⁺ directions and counts, channel-opening/influx pause freezing, resume continuity, and replay behavior;
- all three conduction rounds, four local-current arcs, stable seven segments, four charge slots, 14 Na⁺ channels, paired resting K⁺, and open-end clearance;
- page console warning/error count, accessible surface names, and forbidden-content scans.

The reduced-motion behavior remains covered by the fresh automated suite, but the rest of the exact Browser checklist must be rerun when the `iab` backend is available. No product code was changed and no commit was created during this re-audit.

---

## Historical acceptance at `89e5889` — superseded blocker evidence

### Historical status

**BLOCKED AT `89e5889` — superseded by `5dc0fe9` PASS**

Acceptance is blocked by repeatable, non-zero intersections between visible Na⁺ particles and charge nodes at both required viewports. The implementation was not changed.

Tested commit: `89e5889e21b6ebdab176f3b3433db05dd5705606`
Page: `http://localhost:3002/models/action-potential`
Browser: exact Codex in-app Browser only
Viewports: `1280×720`, `390×844`

## Automated chain (run exactly once)

The complete chain was executed once, in order, with fresh output:

- `npm test`: exit 0; 20 test files passed; 213 tests passed.
- `npm run lint`: exit 0.
- `npm run build`: exit 0; all five vinext build stages completed.
- `git diff --check`: exit 0.

No focused RED/GREEN cycle was run because Task 4 was constrained to report browser defects without modifying implementation.

## In-app Browser phase evidence at 1280×720

### Stable structure and resting mode

- Mode labels: `静息电位`, `动作电位产生`, `动作电位传导`.
- Compartment labels, top to bottom: `膜外`, `膜内`, `膜外`.
- Stable counts: 7 segments, 28 charge nodes (four per segment), 14 Na⁺ channels.
- Resting counts: exactly 2 open K⁺ channels, 2 streams, 3 particles per stream (6 particle nodes total), no open Na⁺ channel.
- Resting directions and accessible names:
  - top: `K⁺经上膜向膜外流出`, `data-screen-direction="up"`;
  - bottom: `K⁺经下膜向膜外流出`, `data-screen-direction="down"`.
- Six live resting observations found 0 px² for charge–petal, charge–particle, Na–K petal, and label–fiber-content intersections.

### Generation

Observed sequence:

1. `stimulus`: central quartet `＋−−＋`, 0 open Na⁺ channels, 0 streams.
2. `sodium-channel-opening`: central quartet `＋−−＋`, top and bottom central Na⁺ channels open, 0 streams.
3. `sodium-in`: central quartet `＋−−＋`, 2 streams, 3 particles per stream; top is `down`, bottom is `up`.
4. `excited`: central quartet `−＋＋−`; no mixed quartet was observed in 30 ms polling.

K⁺ was absent throughout generation.

Pause evidence:

- Channel opening was paused for 726 ms. Phase, charge quartet, both petals, both pores, and all particle transforms were byte-for-byte unchanged while paused.
- Influx was paused for 721 ms. Phase, charges, channels, particle transforms, and particle bounding boxes were byte-for-byte unchanged while paused.
- On resuming channel opening, the two petals changed immediately from translations `±5.27862px` to `±6px`, and pore scale changed from `0.766384` to `1`; the next 120 ms observation was already unchanged at the endpoint. This does not satisfy the requested evidence of continuing without a jump and is recorded as a secondary acceptance concern.

Replay evidence:

- Replay returned immediately to `stimulus` with no streams, then mounted two `sodium-in` streams with three particles each.
- Segment count remained 7, IDs remained `0…6`, charge count remained 28, and segment widths remained stable.
- Exact DOM identity across the replay could not be proven: the in-app Browser page sandbox did not expose a `MutationObserver` constructor. No other browser or automation surface was substituted.

### Conduction

Three complete rounds were observed in 4.927 s:

`local-current → neighbor-sodium-in → neighbor-excited` repeated three times.

- Every `local-current` observation contained exactly 4 current arcs.
- Round 1 targeted segment IDs 2 and 4. During influx each target remained `＋−−＋`, with two open Na⁺ channels and two streams of three particles each (six particles per target). Both switched to `−＋＋−` only at `neighbor-excited`.
- Rounds 2 and 3 expanded symmetrically to IDs 1/5 and 0/6 with the same bilateral channel and stream counts.
- K⁺ remained absent throughout conduction.
- Channel petals on both surfaces used x-only transforms (no y translation or rotation), so the petals remained horizontal.

## Geometry evidence

Measurements used each element's live `getBoundingClientRect()` and exact pairwise intersection area. Visible particles were filtered by computed display, visibility, size, and opacity. Labels were compared against segments, charge nodes, channels, particles, and current arcs inside the shared fiber.

### 1280×720

- `clientWidth = 1280`, `scrollWidth = 1280` in every sampled phase.
- All 7 segments, 28 charges, 14 Na⁺ channels, both resting K⁺ channels, all three labels, and visible particles stayed within viewport width.
- No channel or particle crossed the shared fiber's actual left/right boundary (0 end intrusions).
- Charge–petal, Na–K petal, and label–fiber-content maximum intersection: 0 px².
- **Failure:** six generation influx samples reached a maximum single-pair charge–particle intersection of **267.046875 px²** (up to 6 intersecting pairs in one sample).
- **Failure:** conduction sampling reached a maximum single-pair charge–particle intersection of **324 px²**. A paused round-1 evidence frame contained 8 intersecting pairs and a maximum of 237.97309184074402 px².

### 390×844

- `clientWidth = 390`, `scrollWidth = 390` in every sampled phase.
- All required segments, charges, Na⁺/K⁺ channels, labels, and visible particles stayed within viewport width.
- No channel or particle crossed the shared fiber's actual left/right boundary (0 end intrusions).
- Six resting observations had 0 px² for every requested intersection class.
- Charge–petal, Na–K petal, and label–fiber-content maximum intersection remained 0 px² during generation and conduction.
- **Failure:** six generation influx samples had non-zero charge–particle intersections in every sample; maximum single-pair area **243.40875244140625 px²** and up to 8 intersecting pairs.
- **Failure:** six conduction influx samples had non-zero charge–particle intersections in every sample; maximum single-pair area **243.40875244140625 px²** and up to 16 intersecting pairs.

The open ends are CSS presentation rather than separate DOM nodes. End acceptance therefore used the shared fiber's live left/right bounds and counted any channel or visible particle extending past either edge; the count was 0 at both viewports.

## Reduced motion, accessibility, forbidden scope, and console

The in-app Browser exposes viewport control but not media-feature emulation. Reduced motion was therefore covered by the dedicated test included in the single `npm test` run: `uses representative static ion frames with disabled playback for reduced motion`. It asserts:

- zero queued RAF callbacks and `requestAnimationFrame` never called;
- reduced-motion generation at static `sodium-in`;
- 2 open central Na⁺ channels, 2 sodium streams, 6 particles;
- playback and replay controls disabled;
- mode switches still work;
- reduced-motion conduction is a static `neighbor-excited` frame.

Active channel and stream accessible names explicitly included upper/lower membrane surfaces, including `第4膜段上膜 Na⁺通道开放`, `第4膜段下膜 Na⁺通道开放`, and the matching upper/lower influx names. Mode scans exposed only the three mode controls plus pause/replay.

All three modes were scanned for `mV`, `-70`, `−70`, `曲线`, `复极化`, `超极化`, and `恢复`; every match count was 0.

Page console warnings/errors: **0**. A Statsig telemetry timeout printed by the Browser client itself during one tool call was outside the page console and is not counted as an application console message.

## Evidence files

All screenshot files were verified as actual JPEG/JFIF data; their `.jpg` extensions match their MIME:

- `.superpowers/sdd/evidence/bilateral-1280-resting.jpg` (1280×1016)
- `.superpowers/sdd/evidence/bilateral-1280-generation-influx-paused.jpg` (1280×1016)
- `.superpowers/sdd/evidence/bilateral-1280-conduction-influx-paused.jpg` (1280×1016)
- `.superpowers/sdd/evidence/bilateral-390-resting.jpg` (390×1477)
- `.superpowers/sdd/evidence/bilateral-390-generation-influx-paused.jpg` (390×1504)
- `.superpowers/sdd/evidence/bilateral-390-conduction-influx.jpg` (390×1504)

## Historical conclusion at `89e5889` — superseded

At `89e5889`, the bilateral structure, phase sequence, charge atomicity, directions, counts, three conduction rounds, pause freezing, width containment, forbidden-scope scan, reduced-motion test, accessibility names, and page console checks were supported, but acceptance could not pass because particle–charge intersection area was non-zero at both viewports. That result is retained only as root-cause history and is superseded by the `5dc0fe9` PASS below.

## Current-HEAD re-audit after overlap fix

Re-audited commit: `5dc0fe90c47c711cc67647a09268537ad5c07a67`.

- Independent fresh automation on the repaired HEAD passed: 20 test files / 214 tests; lint, five-stage build, and `git diff --check` all exited 0.
- The fixer used the exact in-app Browser on this HEAD to densely sample 30 generation frames and 30 conduction frames at each of 1280×720 and 390×844. All particle–charge, particle–channel, particle–label, and open-end intrusion intersections were 0 px²; both widths had `scrollWidth === clientWidth`.
- The primary agent then independently reclaimed the exact in-app Browser and repeated current-HEAD acceptance. At 1280×720, a 70-sample generation run observed both charge quartets (`＋−−＋` and `−＋＋−`), both stream directions, 2 open channels / 6 particles, and 0 particle–charge intersections. An 85-sample conduction run observed excited sets `3 → 2,3,4 → 1,2,3,4,5 → 0…6`, exactly 4 current paths in every local-current frame, no influx-target charge violations, 4 open channels / 12 particles, terminal stop, and 0 intersections.
- At 390×844, a fresh 70-sample generation run and 85-sample conduction run again had 0 particle–charge intersections. All tracked segments, charges, channels, particles, labels, and controls stayed within width; `clientWidth = scrollWidth = 390`; terminal conduction stopped at 7/7 excited.
- Resting on current HEAD had exactly 2 K⁺ channels and two 3-particle streams: top `screen-direction=up`, bottom `screen-direction=down`. Three compartment labels remained `膜外、膜内、膜外`; counts remained 7 segments, 14 Na⁺ channels, and 28 charges.
- Current page console contained no warning or error entries. The Browser client emitted one external Statsig telemetry timeout, which was not a page-console message and did not affect the app.
- Particle pause/resume/replay was independently established by the fix pass (six particles frozen for 720 ms, then resumed and replayed 0→6). The original channel-opening “jump” concern could not be reproduced independently of Browser click latency, so no speculative product change was made.

**Current-HEAD acceptance: PASS.** The former particle–charge blocker is resolved at both required viewports; no new product defect was found.
