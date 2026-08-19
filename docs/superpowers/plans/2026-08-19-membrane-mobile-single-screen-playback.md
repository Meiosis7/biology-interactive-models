# Membrane Mobile Single-Screen Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reliable playback on the public membrane-potential page and fit the curve, ion-channel cause view, current-stage summary, and essential controls into one mobile viewport.

**Architecture:** Keep the existing React simulation and desktop layout. Add behavior coverage for animation-frame time advancement, replace the mobile document-flow override with a bounded `100svh` grid, compact secondary mobile content, then publish a complete static export and verify every referenced runtime asset.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Next.js static export, GitHub Pages

## Global Constraints

- Ignore the supplied PDF and make no knowledge-content changes.
- Preserve the desktop layout and its complete controls.
- At widths of `800px` or less, keep the curve, ion-channel view, stage summary, and essential controls inside one `100svh` viewport.
- The public GitHub Pages HTML must reference only JavaScript assets that return HTTP 200.

---

### Task 1: Protect Playback Progression

**Files:**
- Modify: `tests/models/membrane-potential-curve/lab.test.tsx`

**Interfaces:**
- Consumes: `MembraneCurveLab`, the global `requestAnimationFrame` callback, and the visible time output
- Produces: a regression test proving that clicking Start advances time and updates playback state

- [ ] **Step 1: Write the failing playback progression test**

Stub `requestAnimationFrame`, click the `开始` button, invoke successive captured callbacks with timestamps `1000` and `2000`, then assert that the output changes from `0.0` to `1.0` and the control reads `暂停`.

- [ ] **Step 2: Run the focused behavior test**

Run: `npm test -- --run tests/models/membrane-potential-curve/lab.test.tsx`

Expected: the new progression assertion passes if the source logic is healthy; failure identifies a source-code playback defect that must be fixed before layout work.

### Task 2: Replace Mobile Scrolling with a Bounded Single-Screen Grid

**Files:**
- Modify: `tests/models/membrane-potential-curve/mobile-layout.test.ts`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`

**Interfaces:**
- Consumes: existing `.membrane-shell`, `.membrane-process-canvas`, `.membrane-stage-guide`, and `.membrane-controls` structure
- Produces: a mobile `100svh` grid with a flexible two-row process area, compact stage information, and a two-row essential control console

- [ ] **Step 1: Replace the old mobile layout assertions with failing single-screen assertions**

Require `.membrane-shell` to use `height: 100svh`, `overflow: hidden`, and four grid rows; require `.membrane-process-canvas` to use two `minmax(0, ...)` rows; require compact stage and control rules; require `.membrane-options` to be hidden only in the mobile block.

- [ ] **Step 2: Run the mobile test and confirm it fails**

Run: `npm test -- --run tests/models/membrane-potential-curve/mobile-layout.test.ts`

Expected: FAIL because the current mobile shell is `height: auto`, `overflow: visible`, and the cards use large responsive pixel heights.

- [ ] **Step 3: Implement the bounded mobile CSS**

Change the mobile shell to a four-row `100svh` grid. Make the process area a one-column, two-row flexible grid; make both cards and their visual regions fill their allocated row; compact the header and three-cell status row; reduce mobile particle/channel sizing; compress the stage navigation and show only the current “通道与离子” detail line; compress intensity, playback, reset, and timeline into two control rows; hide only speed and comparison options on mobile.

- [ ] **Step 4: Add short-screen safeguards**

At `max-width: 800px` and `max-height: 700px`, hide secondary captions, use smaller gaps, and retain all essential visual and control surfaces.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run tests/models/membrane-potential-curve/mobile-layout.test.ts tests/models/membrane-potential-curve/lab.test.tsx tests/models/membrane-potential-curve/single-viewport.test.ts`

Expected: PASS.

### Task 3: Verify, Commit, and Publish Complete Runtime Assets

**Files:**
- Modify: standalone deployment copy of `models/03-membrane-potential-curve/membrane-curve.css`
- Publish: branch `gh-pages`

**Interfaces:**
- Consumes: verified source CSS and static export
- Produces: a public page whose HTML, CSS, JavaScript, and ion textures all load successfully

- [ ] **Step 1: Run full verification**

Run: `npm test -- --run && npm run build`

Expected: all tests pass and the application build exits successfully.

- [ ] **Step 2: Commit and push the feature branch**

Commit source, tests, spec, and plan with `fix: restore playback and fit mobile single screen`, then push the existing branch so pull request 1 updates.

- [ ] **Step 3: Build the GitHub Pages export**

Synchronize the verified CSS into the standalone source, build with base path `/biology-interactive-models`, and retain all current public assets.

- [ ] **Step 4: Publish every referenced output file**

Create the Pages tree from the current `gh-pages` tree while adding all modified, added, and renamed output paths. Do not omit rename-only JavaScript files and do not delete unrelated existing assets.

- [ ] **Step 5: Verify the public site**

Confirm the latest Pages build succeeds; fetch the public HTML; enumerate every script and stylesheet URL and require HTTP 200; verify the new mobile CSS contains the single-screen shell and compact control rules.
