# Action Potential Terminal Conclusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present one clean, non-overlapping terminal conclusion and use the same sentence as the conduction knowledge-card result.

**Architecture:** Remove the terminal region label at the React rendering boundary, delete the obsolete arrow pseudo-elements, and constrain the conclusion to a centered responsive text box. Update only the conduction result fact in `modeData`; all simulation and interaction state remains unchanged.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, vinext, in-app Browser.

## Global Constraints

- Terminal scene text is exactly “神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。”.
- Terminal scene does not render “全部膜段已兴奋” or decorative arrows.
- Conduction knowledge-card “结果” uses the same exact sentence; “原因” and “通道与离子变化” remain unchanged.
- Non-terminal region labels, seven-step interaction, disabled states, replay, animation timing, and geometry remain unchanged.
- At 1280×720 and 390×844 the conclusion overlaps no visible scene element and causes no horizontal overflow.

---

### Task 1: Fix terminal content and layout

**Files:**
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/visual-contracts.test.ts`
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `components/action-potential/modeData.ts`

**Interfaces:**
- Consumes: `conductionComplete`, `allSegmentsExcited`, `.ap-region-labels`, `.ap-bidirectional`, and `ACTION_POTENTIAL_MODES[2]`.
- Produces: terminal-only conclusion markup and exact conduction result copy.

- [ ] **Step 1: Write failing terminal-copy and CSS-contract tests**

```ts
expect(screen.queryByText("全部膜段已兴奋")).not.toBeInTheDocument();
expect(
  screen.getByText("神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。"),
).toBeInTheDocument();
expect(ACTION_POTENTIAL_MODES[2].facts[2]).toEqual({
  label: "结果",
  value: "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
});
expect(stylesheet).not.toMatch(/\.ap-bidirectional::(?:before|after)/);
expect(ruleBody(".ap-bidirectional")).toMatch(/max-width:\s*720px\s*;/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts`

Expected: FAIL because the terminal label, pseudo-element arrows, unconstrained layout, and old result value still exist.

- [ ] **Step 3: Apply the minimal rendering, CSS, and result-copy change**

```tsx
{mode === "conduction" && !conductionComplete && (
  <div className="ap-region-labels">
    <span>未兴奋区</span>
    <b>兴奋区</b>
    <span>未兴奋区</span>
  </div>
)}
```

```css
.ap-bidirectional {
  left: 50%;
  right: auto;
  width: 92%;
  max-width: 720px;
  bottom: 5px;
  font-size: clamp(12px, 1.2vw, 15px);
  line-height: 1.45;
  transform: translateX(-50%);
}
```

Delete `.ap-bidirectional::before` and `.ap-bidirectional::after`. Set the conduction result fact value in `modeData.ts` to the exact terminal sentence.

- [ ] **Step 4: Run focused tests and lint**

Run: `npm test -- tests/action-potential && npx eslint components/action-potential tests/action-potential`

Expected: all focused tests PASS and lint exits 0.

- [ ] **Step 5: Commit the implementation**

```bash
git add components/action-potential tests/action-potential
git commit -m "fix: clarify action potential terminal result"
```

### Task 2: Verify terminal geometry and interaction

**Files:**
- Verify only: `components/action-potential/ActionPotentialScene.tsx`
- Verify only: `components/action-potential/action-potential.css`

**Interfaces:**
- Consumes: the terminal markup and CSS from Task 1.
- Produces: automated and browser evidence for final delivery.

- [ ] **Step 1: Run complete verification**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all tests PASS; lint, build, and diff check exit 0.

- [ ] **Step 2: Verify terminal bounds at desktop and mobile sizes**

At 1280×720 and 390×844, advance to terminal state and measure the conclusion rectangle against the fiber, charges, channels, compartment labels, controls, and knowledge-card bounds. Every unintended intersection area must be 0 and `clientWidth === scrollWidth`.

- [ ] **Step 3: Verify copy and replay**

Confirm “全部膜段已兴奋” and arrow pseudo-content are absent, the scene and knowledge-card result each contain the exact sentence once, Next is disabled, Replay returns to the central-action-potential initial state, and browser warnings/errors are zero.

- [ ] **Step 4: Hand off the page**

Reset the viewport, leave conduction at its initial state, and keep the local page open as the deliverable.

