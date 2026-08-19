# Membrane Mobile Overlap Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove overlapping content from the membrane-potential model on narrow screens without changing its desktop layout or interactions.

**Architecture:** Keep the existing React structure and correct the narrow-screen CSS only. Replace fixed card heights with content-driven cards and responsive visual regions, then make dense header/control rows wrap explicitly. Protect the behavior with source-level layout tests before publishing the rebuilt static site.

**Tech Stack:** Next.js, React, CSS, Vitest, GitHub Pages

## Global Constraints

- Preserve all existing membrane-potential interactions and educational content.
- Preserve the desktop single-viewport layout.
- Apply the new layout only at `max-width: 800px`, with extra compaction at `max-width: 420px`.
- Publish the verified result to `https://meiosis7.github.io/biology-interactive-models/`.

---

### Task 1: Add Mobile Layout Regression Coverage

**Files:**
- Create: `tests/models/membrane-potential-curve/mobile-layout.test.ts`

**Interfaces:**
- Consumes: `models/03-membrane-potential-curve/membrane-curve.css`
- Produces: regression assertions for content-driven mobile cards, a two-row status bar, and wrapping controls

- [ ] **Step 1: Write the failing test**

Add assertions that the mobile CSS sets `.membrane-view-card` to `height: auto`, resets `.membrane-scene` to `min-height: 0`, gives it a `clamp(...)` height, makes `.membrane-status-line` a two-column grid, spans its final child across both columns, and enables wrapping for captions and options.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/models/membrane-potential-curve/mobile-layout.test.ts`

Expected: FAIL because the current mobile view card is fixed at `420px` and the status bar is not a grid.

- [ ] **Step 3: Commit with Task 2 after the test passes**

Keep the red test uncommitted until the matching CSS implementation is verified.

### Task 2: Make Narrow-Screen Layout Content-Driven

**Files:**
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Test: `tests/models/membrane-potential-curve/mobile-layout.test.ts`

**Interfaces:**
- Consumes: existing membrane model class names and the regression assertions from Task 1
- Produces: non-overlapping vertical mobile layout, responsive visual regions, and wrapping status/control rows

- [ ] **Step 1: Replace fixed mobile card heights**

Set `.membrane-curve-card` and `.membrane-view-card` to content-driven rows and `height: auto`; size the canvas and scene with `clamp(...)`, and reset the scene `min-height` to `0`.

- [ ] **Step 2: Reflow dense mobile rows**

Change `.membrane-status-line` to a two-column grid, span the ion-flow item across the second row, and add wrapping to card headers and `.membrane-options`.

- [ ] **Step 3: Add extra-small-screen safeguards**

At `max-width: 420px`, stack the main heading and live state, keep controls full-width, and slightly reduce outer/card padding.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run tests/models/membrane-potential-curve/mobile-layout.test.ts tests/models/membrane-potential-curve/single-viewport.test.ts`

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run: `npm test -- --run && npm run build`

Expected: all tests pass and the production build completes.

- [ ] **Step 6: Commit**

Commit the CSS, tests, design, and plan with message `fix: prevent mobile membrane model overlap`.

### Task 3: Publish the Verified Mobile Fix

**Files:**
- Modify: standalone static deployment copy of `models/03-membrane-potential-curve/membrane-curve.css`
- Publish: GitHub branch `gh-pages`

**Interfaces:**
- Consumes: the verified source CSS from Task 2
- Produces: updated GitHub Pages site at the existing public URL

- [ ] **Step 1: Synchronize the verified CSS**

Apply the same mobile rules to the standalone deployment source without changing its interaction code.

- [ ] **Step 2: Build the GitHub Pages artifact**

Build with base path `/biology-interactive-models` and include `.nojekyll` in the exported root.

- [ ] **Step 3: Publish to `gh-pages`**

Create a deployment commit whose parent is the current remote `gh-pages` commit, then push it without rewriting history.

- [ ] **Step 4: Verify publication**

Confirm the Pages build reports success, the public root and linked assets return HTTP 200, and the published stylesheet contains the new mobile layout rules.
