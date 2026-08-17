# Membrane Continuous Ion Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep compartment ions gently moving at all times and keep active-channel ions crossing the membrane even when the voltage timeline is paused.

**Architecture:** CSS owns microscopic motion so it remains independent from React playback state. React supplies staggered timing values for each background particle, while the existing snapshot continues to decide which directional flow track is rendered.

**Tech Stack:** React 19, TypeScript, CSS keyframes, Vitest source-level regression tests.

## Global Constraints

- Preserve the existing single-viewport layout and AI-generated channel/particle textures.
- Timeline pause must stop only stage progression, not microscopic ion animation.
- Preserve the existing `prefers-reduced-motion` fallback.

---

### Task 1: Add continuous-motion regression coverage

**Files:**
- Create: `tests/models/membrane-potential-curve/continuous-motion.test.ts`
- Test: `tests/models/membrane-potential-curve/continuous-motion.test.ts`

**Interfaces:**
- Consumes: CSS selectors in `membrane-curve.css` and particle markup in `MembraneView.tsx`.
- Produces: regression assertions for ambient drift, independent flow animation, timing variation, and reduced-motion support.

- [ ] **Step 1: Write the failing test**

Read both source files and assert that particles use an infinite `ion-drift-*` animation, flow-dot selectors do not depend on `.is-playing`, JSX assigns `animationDelay` and `animationDuration`, and reduced-motion remains present.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/models/membrane-potential-curve/continuous-motion.test.ts`

Expected: FAIL because ambient motion and playback-independent flow selectors do not yet exist.

### Task 2: Implement continuous microscopic movement

**Files:**
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Test: `tests/models/membrane-potential-curve/continuous-motion.test.ts`

**Interfaces:**
- Consumes: `SODIUM_PARTICLES`, `POTASSIUM_PARTICLES`, and conditional flow-track rendering from `snapshot.ionFlow`.
- Produces: independently timed ambient drift and always-running active flow animations.

- [ ] **Step 1: Add staggered particle timings**

Map particles with an index and assign deterministic negative `animationDelay` plus varied `animationDuration` values.

- [ ] **Step 2: Add bounded drift keyframes**

Define three small transform paths that preserve the particle's `translate(-50%, -50%)` anchor and run infinitely with alternating directions.

- [ ] **Step 3: Decouple flow animation from playback**

Remove `.membrane-scene.is-playing` from sodium and potassium flow-dot animation selectors. The conditional flow-track rendering remains the sole activation gate.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/models/membrane-potential-curve/continuous-motion.test.ts`

Expected: PASS.

### Task 3: Verify and package v5

**Files:**
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneView.tsx`
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/membrane-curve.css`
- Create: `膜电位变化曲线-动态交互模型-2026-08-15-v5.zip`

**Interfaces:**
- Consumes: verified main-project implementation.
- Produces: buildable standalone source and a validated ZIP artifact.

- [ ] **Step 1: Run the membrane-model test suite**

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all tests pass.

- [ ] **Step 2: Build the main project**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Sync and build the standalone project**

Copy the two changed source files into the standalone project, then run its build.

Expected: exit code 0.

- [ ] **Step 4: Create and validate the ZIP**

Archive the standalone project without `node_modules`, `.next`, or `.DS_Store`, then run `unzip -t`.

Expected: `No errors detected in compressed data`.
