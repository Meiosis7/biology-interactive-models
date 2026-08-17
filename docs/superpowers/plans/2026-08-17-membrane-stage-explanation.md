# Membrane Stage Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synchronized, clickable seven-step explanation for every action-potential phase, including separate hyperpolarization and resting recovery stages.

**Architecture:** Extend the simulation state machine with `hyperpolarization`, centralize educational copy and representative times in a stage-content module, and render it through a focused `StageExplanation` component. The lab remains the owner of time, intensity, and playback so step selection uses the same data flow as curve scrubbing.

**Tech Stack:** React 19, TypeScript, CSS, Canvas, Vitest, Testing Library.

## Global Constraints

- Keep the complete desktop experience in one viewport.
- Preserve continuous microscopic ion motion when the timeline is paused.
- Do not mention PDF or教材 in user-facing copy.
- Preserve reduced-motion support and all existing experiment controls.

---

### Task 1: Specify the new phase model with failing tests

**Files:**
- Modify: `tests/models/membrane-potential-curve/simulation.test.ts`
- Modify: `tests/models/membrane-potential-curve/lab.test.tsx`

**Interfaces:**
- Consumes: `getCurveSnapshot()` and `MembraneCurveLab`.
- Produces: regression requirements for separate hyperpolarization/recovery stages and seven clickable explanations.

- [ ] Add simulation assertions that 4.9 is `hyperpolarization`, 5.6 is `recovery`, and both preserve K⁺-related state while the voltage moves from about −80 mV toward −70 mV.
- [ ] Add UI assertions for seven step buttons, hyperpolarization explanation, recovery explanation, and step-to-time synchronization.
- [ ] Run both focused test files and confirm they fail because the new stage and explainer do not exist.

### Task 2: Extend the simulation and curve phase highlighting

**Files:**
- Modify: `models/03-membrane-potential-curve/types.ts`
- Modify: `models/03-membrane-potential-curve/simulation.ts`
- Modify: `models/03-membrane-potential-curve/CurveCanvas.tsx`

**Interfaces:**
- Produces: `CurveStage` including `hyperpolarization`; stage intervals 0–1, 1–2, 2–3, 3–4, 4–4.8, 4.8–5.3, and 5.3–6.

- [ ] Add `hyperpolarization` to the stage union and answer/explanation records.
- [ ] Split the old recovery curve into repolarization, hyperpolarization, and recovery interpolation segments.
- [ ] Update canvas labels and highlighted intervals.
- [ ] Run simulation tests and update prior exact-time assertions to the new phase boundaries.

### Task 3: Add the synchronized seven-step explainer

**Files:**
- Create: `models/03-membrane-potential-curve/stage-content.ts`
- Create: `models/03-membrane-potential-curve/StageExplanation.tsx`
- Modify: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`

**Interfaces:**
- Produces: `ACTION_POTENTIAL_STEPS`, `STAGE_DETAILS`, and `StageExplanation({stage, onSelectTime})`.

- [ ] Define seven step labels, representative times, and complete explanation text plus a local-potential fallback.
- [ ] Render accessible step buttons and a live explanation card.
- [ ] On step selection, pause playback, mark the lab started, switch weak stimulation to threshold, and set the representative time.
- [ ] Add compact desktop and scrollable mobile styles.
- [ ] Run focused and full membrane-model tests.

### Task 4: Verify, sync, and package

**Files:**
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/*`
- Create: `膜电位变化曲线-动态交互模型-2026-08-17-v7.zip`

**Interfaces:**
- Consumes: tested main-project implementation.
- Produces: refreshed local preview and validated standalone artifact.

- [ ] Build the main and standalone projects.
- [ ] Inspect the existing preview at the hyperpolarization and recovery steps.
- [ ] Confirm all source files match the standalone copy.
- [ ] Create and validate the v7 ZIP.
