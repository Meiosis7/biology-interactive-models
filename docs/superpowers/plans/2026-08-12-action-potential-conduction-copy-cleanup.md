# Action Potential Conduction Copy Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the approved instructional clutter while retaining the exact terminal conclusion and all existing animation behavior.

**Architecture:** Keep the simulation state machine, timing, and controls unchanged. Replace the local-current instruction at its simulation source, remove three helper paragraphs from their owning components, and render the scene-bottom conclusion only for the completed conduction phase.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, vinext, in-app Browser.

## Global Constraints

- Every local-current macro step displays exactly “形成局部电流”.
- Do not display round numbers, current-step counts, playback-status helper text, the header subtitle, or the general teaching-disclaimer paragraph.
- Do not display the intermediate bottom sentence “兴奋由刺激点向两侧逐段传导”.
- Preserve the exact terminal conclusion “神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。”.
- Preserve all seven-step interaction, disabled states, animation timing, reduced motion, geometry, and knowledge-card content.

---

### Task 1: Remove redundant process copy

**Files:**
- Modify: `tests/action-potential/simulation.test.ts`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/lab.test.tsx`
- Modify: `components/action-potential/simulation.ts`
- Modify: `components/action-potential/ConductionControls.tsx`
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Modify: `components/action-potential/LabControls.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`

**Interfaces:**
- Consumes: `getConductionStepFrame(step, progress)`, `ConductionControls`, `LabControls`, and `ActionPotentialScene`.
- Produces: unchanged control callbacks and frame phases with simplified visible copy.

- [ ] **Step 1: Write failing copy-cleanup tests**

```ts
expect(getConductionStepFrame(1, 1).instruction).toBe("形成局部电流");
expect(getConductionStepFrame(3, 1).instruction).toBe("形成局部电流");
expect(getConductionStepFrame(5, 1).instruction).toBe("形成局部电流");

expect(document.body).not.toHaveTextContent(
  /第[123]轮|当前第|共7步|本步动画播放中|传导演示完成|切换三个模式|离子、通道和传导方向均为教学示意/,
);
expect(screen.queryByText("兴奋由刺激点向两侧逐段传导")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: FAIL on the existing round, step, header, helper, and intermediate-bottom copy.

- [ ] **Step 3: Apply the minimal copy changes**

```ts
// simulation.ts local-current frame
instruction: "形成局部电流",

// ConductionControls.tsx
interface ConductionControlsProps {
  busy: boolean;
  complete: boolean;
  onNext: () => void;
  onReplay: () => void;
}
// Render only the two existing buttons; remove the status paragraph.

// ActionPotentialScene.tsx
{conductionComplete && (
  <p className="ap-bidirectional">
    神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。
  </p>
)}
```

Remove the header subtitle paragraph from `ActionPotentialLab`, the teaching-disclaimer paragraph from `LabControls`, the `step` prop passed to `ConductionControls`, and the status calculation/paragraph from `ConductionControls`.

- [ ] **Step 4: Run focused tests and lint**

Run: `npm test -- tests/action-potential && npx eslint components/action-potential tests/action-potential`

Expected: all focused tests PASS and lint exits 0.

- [ ] **Step 5: Commit the implementation**

```bash
git add components/action-potential tests/action-potential
git commit -m "fix: simplify action potential teaching copy"
```

### Task 2: Verify the finished page

**Files:**
- Verify only: `components/action-potential/ActionPotentialLab.tsx`
- Verify only: `components/action-potential/ActionPotentialScene.tsx`

**Interfaces:**
- Consumes: the cleaned components from Task 1.
- Produces: automated and visible-page evidence for final delivery.

- [ ] **Step 1: Run the complete verification chain**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all tests PASS; lint, build, and diff check exit 0.

- [ ] **Step 2: Verify desktop and mobile visible copy**

At 1280×720 and 390×844, confirm the removed strings have zero visible matches, the deleted paragraphs leave no awkward blank row, and the controls remain visible and at least 44 px high.

- [ ] **Step 3: Verify conduction behavior and terminal copy**

Advance all seven conduction states. Confirm each local-current state shows exactly “形成局部电流”, intermediate states have no `.ap-bidirectional`, the final state shows exactly one terminal conclusion, and Next/Replay behavior is unchanged.

- [ ] **Step 4: Check runtime health and hand off the page**

Confirm zero browser warnings/errors, reset the viewport, return to the initial conduction frame, and keep the local page open as the deliverable.

