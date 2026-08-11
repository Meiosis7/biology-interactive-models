# Action Potential Vertical Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every segment’s four charges, bilateral sodium channels, and sodium ion streams on the same 50% vertical centerline without changing the approved animation logic.

**Architecture:** Keep the existing DOM and simulation state machine unchanged. Update the three shared CSS anchors that control charge, sodium-channel, and sodium-stream horizontal placement; retain the potassium-specific `left: 100%` override. Lock the geometry with CSS contract tests, then verify actual bounding-box centers in the in-app browser at desktop and mobile widths.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, vinext, in-app Browser.

## Global Constraints

- Four charge slots, top and bottom Na⁺ channels, and top and bottom Na⁺ streams use `left: 50%` in every membrane segment.
- K⁺ channels and streams remain at `left: 100%` on the shared segment boundary.
- Existing generation looping, seven-step manual conduction, local-current drawing, final conclusion, open fiber ends, and charge orders are unchanged.
- Do not add ambient free Na⁺ or K⁺ particles.
- At 1280×720 and 390×844, charge, Na⁺ pore, and Na⁺ particle horizontal centers differ by no more than 1 px and the page has no horizontal overflow.

---

### Task 1: Unify the membrane-segment centerline

**Files:**
- Modify: `tests/action-potential/visual-contracts.test.ts`
- Modify: `components/action-potential/action-potential.css`

**Interfaces:**
- Consumes: existing selectors `.ap-segment-charge`, `.ap-ion-channel`, `.ap-ion-stream`, `.ap-ion-channel--potassium`, and `.ap-ion-stream--potassium`.
- Produces: a shared `left: 50%` horizontal anchor for charges and sodium visuals while preserving the potassium `left: 100%` override.

- [ ] **Step 1: Replace the separated-lane contract with a failing shared-centerline contract**

```ts
it("aligns charges, sodium channels, and sodium transport on one centerline", () => {
  expect(ruleBody(".ap-segment-charge")).toMatch(/left:\s*50%\s*;/);
  expect(ruleBody(".ap-ion-channel")).toMatch(/left:\s*50%\s*;/);
  expect(ruleBody(".ap-ion-stream")).toMatch(/left:\s*50%\s*;/);
  expect(ruleBody(".ap-ion-channel--potassium")).toMatch(/left:\s*100%\s*;/);
  expect(ruleBody(".ap-ion-stream--potassium")).toMatch(/left:\s*100%\s*;/);
  expect(stylesheet).not.toMatch(/--ion-bypass-x/);
  expect(stylesheet).not.toMatch(/ap-sodium-bypass-(?:up|down)/);
});
```

- [ ] **Step 2: Run the focused contract test and verify RED**

Run: `npm test -- tests/action-potential/visual-contracts.test.ts`

Expected: FAIL because `.ap-segment-charge` is `left: 25%` and `.ap-ion-channel` / `.ap-ion-stream` are `left: 75%`.

- [ ] **Step 3: Apply the minimal shared-centerline CSS change**

```css
.ap-segment-charge {
  left: 50%;
}

.ap-ion-channel {
  left: 50%;
}

.ap-ion-channel--potassium {
  left: 100%;
}

.ap-ion-stream {
  left: 50%;
}

.ap-ion-stream--potassium {
  left: 100%;
}
```

- [ ] **Step 4: Run focused action-potential tests and lint**

Run: `npm test -- tests/action-potential && npx eslint components/action-potential tests/action-potential`

Expected: all focused tests PASS and lint exits 0.

- [ ] **Step 5: Commit the centerline change**

```bash
git add components/action-potential/action-potential.css tests/action-potential/visual-contracts.test.ts
git commit -m "fix: align membrane charges with sodium channels"
```

### Task 2: Verify the finished geometry and interaction

**Files:**
- Verify only: `components/action-potential/action-potential.css`
- Verify only: `components/action-potential/ActionPotentialLab.tsx`

**Interfaces:**
- Consumes: the shared 50% CSS centerline from Task 1 and the existing browser DOM attributes.
- Produces: fresh automated and browser evidence that the centerline is correct and existing teaching interactions still work.

- [ ] **Step 1: Run the complete automated verification chain**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all tests PASS; lint, build, and diff check exit 0.

- [ ] **Step 2: Measure the desktop centerline in the in-app browser**

At 1280×720, inspect every segment in generation and conduction frames. For each visible Na⁺ stream, compare the horizontal center of all four charge slots, the matching channel pore, and all three particles. Every difference must be at most 1 px. Confirm `document.documentElement.clientWidth === document.documentElement.scrollWidth`.

- [ ] **Step 3: Measure the mobile centerline in the in-app browser**

Repeat the same measurements at 390×844. Confirm all seven membrane segments remain visible, controls remain at least 44 px high, and `clientWidth === scrollWidth === 390`.

- [ ] **Step 4: Recheck interaction and runtime health**

Confirm generation still loops; conduction still advances only after “下一步”; current arcs still draw progressively; the final conclusion remains exact; K⁺ channels remain on the boundary; browser warning/error count is zero.

- [ ] **Step 5: Keep the verified page open for user review**

Reset the viewport override, return conduction to its initial central-action-potential frame, and retain the local page as a deliverable browser tab.

