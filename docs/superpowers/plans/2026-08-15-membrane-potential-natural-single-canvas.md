# Membrane Potential Natural Single Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped dark dashboard with a calm light single-canvas model while preserving all membrane-potential interactions.

**Architecture:** Keep simulation state and drawing logic unchanged. Simplify the React composition so one process canvas owns the curve and membrane observation area, then replace the page-level CSS visual hierarchy without changing public component props.

**Tech Stack:** React, TypeScript, CSS, Canvas 2D, Vitest, Testing Library

## Global Constraints

- Desktop at 1280×720 and larger must show title, full curve, membrane view, and controls without page scrolling.
- Mobile below 800px may stack and scroll.
- Touch controls remain at least 44px high.
- Do not add source labels such as “教材” or “PDF”.
- Preserve play, pause, reset, speed, intensity, timeline dragging, curve comparison, channel state, ion flow, and polarity behavior.

---

### Task 1: Lock the Natural Single-Canvas Structure

**Files:**
- Create: `tests/models/membrane-potential-curve/natural-canvas.test.ts`
- Modify: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`

**Interfaces:**
- Consumes: existing `CurveCanvas` and `MembraneView` props.
- Produces: `.membrane-status-line`, `.membrane-process-canvas`, and the existing `.membrane-controls` region.

- [ ] **Step 1: Write the failing structural test**

Assert that the lab source no longer contains `membrane-readouts`, contains a single `membrane-status-line`, and wraps both visual components in `membrane-process-canvas`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/models/membrane-potential-curve/natural-canvas.test.ts`

Expected: FAIL because the old three-card readout structure is still present.

- [ ] **Step 3: Implement the simplified structure**

Render the title and live state at the left of the header, and render one status sentence with three spans:

```tsx
<div className="membrane-status-line" aria-live="polite">
  <strong>{STAGE_LABEL[snapshot.stage]}</strong>
  <span>{formattedVoltage}</span>
  <span>{ION_LABEL[snapshot.ionFlow]}</span>
</div>
```

Use `<section className="membrane-process-canvas">` as the shared parent of `CurveCanvas` and `MembraneView`.

- [ ] **Step 4: Run the focused test and verify pass**

Run: `npm test -- tests/models/membrane-potential-curve/natural-canvas.test.ts`

Expected: PASS.

### Task 2: Replace Dashboard Styling with Natural Visual Hierarchy

**Files:**
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Modify: `models/03-membrane-potential-curve/CurveCanvas.tsx`

**Interfaces:**
- Consumes: the classes produced by Task 1.
- Produces: a light shell, single white process canvas, 68/32 curve-to-membrane split, and a compact control strip.

- [ ] **Step 1: Extend the focused test with CSS invariants**

Assert that `.membrane-shell` uses `height: 100svh`, a light background, and hidden overflow on desktop; `.membrane-process-canvas` uses one shared border and a two-column grid; `.membrane-curve-card` and `.membrane-view-card` do not declare independent card shadows or outer borders; and the mobile rule restores `height: auto` and `overflow: visible`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/models/membrane-potential-curve/natural-canvas.test.ts`

Expected: FAIL against the dark dashboard styles.

- [ ] **Step 3: Rewrite the visual hierarchy**

Use these core values:

```css
:root {
  --mem-bg: #f3f4ef;
  --mem-paper: #ffffff;
  --mem-text: #18313b;
  --mem-muted: #65777d;
  --mem-line: #d9e0dc;
  --mem-sodium: #168f91;
  --mem-potassium: #d58a22;
  --mem-curve: #ef6a57;
}

.membrane-process-canvas {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(290px, 1fr);
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--mem-line);
  border-radius: 22px;
  background: var(--mem-paper);
}
```

Update Canvas 2D grid, labels, stage wash, cursor, and plot background to work on white while keeping curve geometry and interaction unchanged.

- [ ] **Step 4: Run the focused test and membrane suite**

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

### Task 3: Verify and Package the Finished Model

**Files:**
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneCurveLab.tsx`
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/CurveCanvas.tsx`
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/membrane-curve.css`
- Create: `膜电位变化曲线-动态交互模型-2026-08-15-v2.zip`

**Interfaces:**
- Consumes: verified source components from Tasks 1–2.
- Produces: a standalone, integrity-checked deliverable.

- [ ] **Step 1: Run project verification**

Run: `npm test -- tests/models/membrane-potential-curve && npm run build`

Expected: test suite and production build PASS.

- [ ] **Step 2: Mechanically sync model files into the standalone package**

Copy the six model source files without changing their contents and confirm matching hashes for the lab and stylesheet.

- [ ] **Step 3: Build the standalone package**

Run: `npm run build` from `membrane-potential-curve-standalone`.

Expected: Next.js production build PASS.

- [ ] **Step 4: Create and validate the new archive**

Create `膜电位变化曲线-动态交互模型-2026-08-15-v2.zip`, excluding `node_modules`, `.next`, and `.DS_Store`, then run `unzip -t`.

Expected: `No errors detected in compressed data`.
