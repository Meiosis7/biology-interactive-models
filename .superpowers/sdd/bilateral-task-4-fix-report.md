# Bilateral membrane Task 4 fix report

## Status

**DONE_WITH_CONCERNS**

The blocking Na⁺ particle–charge intersections are fixed at both required viewports. The secondary channel-opening resume observation could not be distinguished from normal animation progress during the exact in-app Browser's 267 ms click call, so no speculative channel-animation change was made.

Base commit: `89e5889e21b6ebdab176f3b3433db05dd5705606`

## Systematic debugging

### Root cause

Every segment placed its four charge nodes, Na⁺ channel, and Na⁺ stream on the same `left: 50%` axis. Exact Browser measurements confirmed that every failing particle–charge pair had a horizontal center delta of `0 px`, and the Na⁺ particle center matched its channel center. The straight `ap-ion-cross` path therefore necessarily swept through the outside and inside charge glyphs.

The working K⁺ layout could not be reused directly: its separate boundary lane would either collide with a neighboring charge/channel on the 43.23 px mobile segments or intrude through an open fiber end. Moving stable Na⁺ channels would also weaken the visual identity of the 14-channel structure.

### Hypothesis and minimal experiment

The hypothesis was that Na⁺ could keep the existing vertical path and channel alignment while a second, surface-specific horizontal animation moved particles around the charge rows, returned them to the pore while crossing the membrane, then moved them back out before the opposite charge row. Right-half membrane segments mirror the offset toward the fiber center.

The first exact Browser experiment confirmed the common axis at both viewports:

- `1280×720` generation: six samples, maximum single-pair overlap `324 px²`, up to six pairs; every failing center delta was `0 px`.
- `390×844` generation: six samples, maximum single-pair overlap `243.40875244140625 px²`, up to eight pairs; every failing center delta was `0 px`.

### RED / GREEN

1. Added `routes sodium around charge columns while rejoining each membrane pore` to `tests/action-potential/visual-contracts.test.ts`.
2. First RED: `14 passed / 1 failed`; the failure was the expected missing mirrored bypass lane and direction-specific keyframes.
3. Implemented a second Na-only animation using the CSS individual `translate` property, leaving the existing vertical `transform` animation intact. Desktop offsets are `±24 px`; the mobile offsets are `±21 px`; segments 5–7 mirror toward the fiber center. Top-down and bottom-up keyframes return to `translate: 0 0` at their respective pore-crossing windows.
4. The first GREEN attempt exposed an existing test-helper prefix match because the new descendant rule preceded the base particle rule. Reordering the CSS rules restored the intended selector lookup; focused result: `15 passed`.
5. First IAB verification then caught two residual edge intersections at `0.4295654296875 px²` and `0.6957854405045509 px²`. They occurred when the bottom particle first appeared and while the top particle was just leaving the outside charge.
6. Tightened the timing contract first. Second RED: `14 passed / 1 failed`, with the expected old keyframe windows in the failure output.
7. Updated only the two bypass timing windows. Second GREEN: `15 passed`.

No particles, channels, streams, or labels were removed, hidden, or clipped. The vertical path, duration, stagger, one-shot fill, per-stream particle count, and top-down/bottom-up direction attributes are unchanged.

## Exact in-app Browser verification after GREEN

All measurements used live `getBoundingClientRect()` values and visible computed styles. Each generation and conduction run used 30 observations, exceeding the six-observation minimum.

### `1280×720`

- Generation: maximum charge–particle intersection `0 px²` across 30 samples; visible particle counts progressed `2 → 4 → 6 → 0`.
- Conduction: maximum charge–particle, charge–petal, Na–K petal, and label–fiber-content intersection `0 px²` across 30 samples.
- Conduction open-end intrusions: `0`.
- `clientWidth = 1280`, `scrollWidth = 1280`.

### `390×844`

- Generation: maximum charge–particle, charge–petal, Na–K petal, and label–fiber-content intersection `0 px²` across 30 samples.
- Conduction: maximum charge–particle, charge–petal, Na–K petal, and label–fiber-content intersection `0 px²` across 30 samples.
- Generation and conduction open-end intrusions: `0`.
- `clientWidth = 390`, `scrollWidth = 390`.

The post-fix conduction samples contained `4 → 8 → 12` visible Na⁺ particles as staggered particles appeared across the two active target segments, then `0` after the phase changed. This is consistent with two surfaces and three particles per surface for each of two targets.

## Pause, resume, and replay

### Na⁺ particles after the fix

At `390×844`, an influx pause froze all six particles for `720 ms`. Computed vertical transforms, new horizontal translates, opacity, and bounding positions were byte-for-byte unchanged. The two streams remained:

- top: `data-screen-direction="down"`, three particles;
- bottom: `data-screen-direction="up"`, three particles.

After resume, both transform and translate values advanced; a further 50 ms observation advanced them again. Replay changed `sodium-in / 6 particles` to `stimulus / 0 particles`, then remounted `sodium-in / 6 particles` with the same two directions and three particles per stream. Existing component coverage continues to verify shared fiber and segment identity across replay.

### Channel-opening concern

The exact Browser repeated the earlier observation:

- early opening pause: left petal `translateX(-3.69298px)`, right petal `translateX(3.69298px)`, pore opacity `0.226203`, pore scaleX `0.497927`;
- after `720 ms` paused: all values were identical;
- after resume call returned: the 300 ms animation was at its endpoint.

However, the exact Browser measured the resume click call itself at `267 ms` (pause click: `272 ms`). The animation was already partway complete when paused, so its remaining time was shorter than the click call. The endpoint observation is therefore consistent with the animation continuing normally while the browser interaction call was in flight; it does not establish a direct jump. Because the Browser cannot sample between event dispatch and completion of that click call, the suspected jump was not confirmed and the channel animation was not changed.

## Focused automated verification

- `npm test -- tests/action-potential/visual-contracts.test.ts tests/action-potential/lab.test.tsx tests/action-potential/mode-components.test.tsx`: exit 0; 3 files passed; 67 tests passed.
- `npx eslint tests/action-potential/visual-contracts.test.ts`: exit 0.
- `git diff --check`: exit 0.
- Exact page console warnings/errors: 0.

The full `npm test`, `npm run lint`, and `npm run build` chain was intentionally not repeated because the parent verifier will run the complete chain once after focused GREEN, per the task handoff.

## Self-review and concerns

- The bypass animation composes a horizontal `translate` with the existing vertical `transform`, so the particle still returns to the channel axis at the membrane instead of visually bypassing the pore.
- The offset mirrors for the right half of the fiber and was verified against both open ends at the narrow viewport.
- Potassium rules and motion remain unchanged; the Na-only `animation-name` selectors do not affect resting K⁺ outflow.
- Reduced motion still removes all animations with `animation: none !important`; existing static-frame tests remain in the focused 67-test pass.
- Concern: exact Browser observations are dense temporal samples, not a mathematical proof for every sub-frame.
- Concern: the channel resume test remains observationally limited by the 267 ms Browser click duration, as documented above.

## Commit

Fix commit: this report is included in the single fix commit. Its final SHA is reported in the handoff because a Git commit cannot contain its own hash.
