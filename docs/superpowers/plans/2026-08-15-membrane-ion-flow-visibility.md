# Membrane Ion Flow Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sodium influx and potassium efflux unmistakable during both playback and time-axis scrubbing.

**Architecture:** Keep simulation data unchanged. Replace distributed cross-membrane particle animation with one explicit active flow track aligned to the corresponding channel; the track remains visible while paused, while its dots animate only during playback.

**Tech Stack:** React, TypeScript, CSS animations, Vitest, Testing Library

## Global Constraints

- Na⁺ influx uses a downward blue-green path through the Na⁺ channel.
- K⁺ efflux uses an upward amber path through the K⁺ channel.
- The active path remains visible when playback is paused.
- Existing channel state, polarity, controls, and curve behavior remain unchanged.
- Do not add source labels such as “教材” or “PDF”.

---

### Task 1: Add Explicit Channel-Aligned Flow Tracks

**Files:**
- Modify: `tests/models/membrane-potential-curve/lab.test.tsx`
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`

**Interfaces:**
- Consumes: `CurveSnapshot.ionFlow` and the existing `playing` boolean.
- Produces: accessible `Na⁺ 内流路径` and `K⁺ 外流路径` elements with `.membrane-flow-track`, `.membrane-flow-arrow`, and three `.membrane-flow-dot` children.

- [ ] **Step 1: Write failing interaction tests**

Add tests which move the time axis to `2.5` and assert that `Na⁺ 内流路径` exists while `K⁺ 外流路径` does not, then move it to `4.5` and assert the inverse. In both cases playback remains paused, proving the path is not conditional on `.is-playing`.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: FAIL because the accessible flow-path elements do not yet exist.

- [ ] **Step 3: Implement the flow-track markup**

Render one active track from `snapshot.ionFlow`:

```tsx
{sodiumFlow && (
  <div className="membrane-flow-track sodium is-active" aria-label="Na⁺ 内流路径">
    <strong>Na⁺ 内流</strong>
    <span className="membrane-flow-arrow" aria-hidden="true">↓</span>
    {FLOW_DOTS.map((delay) => <i className="membrane-flow-dot" style={{ animationDelay: delay }} />)}
  </div>
)}
```

Render the potassium equivalent with `K⁺ 外流`, `↑`, and the `potassium` class. Remove `is-flowing` from distributed particles and remove the old small flow labels.

- [ ] **Step 4: Implement persistent path and playback motion styles**

Make `.membrane-flow-track` span from `top: 13%` to `bottom: 13%`, align sodium to the left channel and potassium to the right channel, use a visible vertical line and 38px arrow, and animate `.membrane-flow-dot` only under `.membrane-scene.is-playing`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx && npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

### Task 2: Build and Refresh the Standalone Deliverable

**Files:**
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/membrane-curve.css`
- Create: `膜电位变化曲线-动态交互模型-2026-08-15-v3.zip`

**Interfaces:**
- Consumes: verified main-project source files.
- Produces: a rebuilt standalone model and integrity-checked archive.

- [ ] **Step 1: Run the main production build**

Run: `npm run build`

Expected: production build PASS.

- [ ] **Step 2: Sync and build standalone sources**

Mechanically copy the six membrane-potential model files into the standalone directory, verify matching hashes, and run `npm run build` there.

Expected: standalone production build PASS.

- [ ] **Step 3: Create and validate the archive**

Create `膜电位变化曲线-动态交互模型-2026-08-15-v3.zip`, excluding `node_modules`, `.next`, and `.DS_Store`, then run `unzip -t`.

Expected: `No errors detected in compressed data`.
