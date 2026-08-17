# Membrane Visible Ion Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make continuous Na⁺ and K⁺ motion immediately visible instead of appearing static.

**Architecture:** Keep CSS-driven independent motion, but distribute particles vertically from JSX and increase the keyframe amplitude. Add a secondary pulse animation to the AI particle texture so both position and body appearance communicate motion.

**Tech Stack:** React 19, TypeScript, CSS keyframes, Vitest.

## Global Constraints

- Preserve the existing single-viewport layout and AI particle assets.
- Do not couple microscopic movement to the playback state.
- Keep ion labels readable and preserve reduced-motion behavior.

---

### Task 1: Define visible-motion regression requirements

**Files:**
- Modify: `tests/models/membrane-potential-curve/continuous-motion.test.ts`

**Interfaces:**
- Consumes: particle styles and JSX timing/position values.
- Produces: assertions for vertical distribution, larger drift amplitude, and texture pulse.

- [ ] Add assertions for inline `top`, at least one 16 px keyframe offset, and `ion-pulse` on `.membrane-particle::before`.
- [ ] Run `npm test -- tests/models/membrane-potential-curve/continuous-motion.test.ts` and confirm failure.

### Task 2: Increase visible ion movement

**Files:**
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Test: `tests/models/membrane-potential-curve/continuous-motion.test.ts`

**Interfaces:**
- Consumes: existing particle arrays and three drift paths.
- Produces: staggered vertical placement, 10–16 px roaming, shorter varied durations, and texture breathing.

- [ ] Assign staggered `top` values and 2.8–4.1 second durations in JSX.
- [ ] Increase all three drift paths while retaining the `translate(-50%, -50%)` anchor.
- [ ] Add an infinite `ion-pulse` animation to the particle texture layer.
- [ ] Run the focused test and the full membrane-model test suite.

### Task 3: Inspect and package

**Files:**
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneView.tsx`
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/membrane-curve.css`
- Create: `膜电位变化曲线-动态交互模型-2026-08-15-v6.zip`

**Interfaces:**
- Consumes: verified visible-motion implementation.
- Produces: refreshed local preview and validated standalone artifact.

- [ ] Build both projects.
- [ ] Reload the existing preview and measure particle transforms at two points in time.
- [ ] Visually inspect the membrane scene.
- [ ] Create and validate the v6 ZIP.
