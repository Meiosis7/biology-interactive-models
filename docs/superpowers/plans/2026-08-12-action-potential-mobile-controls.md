# Action Potential Mobile Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the action-potential controls directly below the animation on phones and tighten the surrounding mobile layout without changing model behavior.

**Architecture:** Keep one mounted scene, knowledge card, and control component. Introduce a single `ap-layout` grid containing all three surfaces; desktop grid areas preserve the existing two-column presentation, while the mobile media query reorders the controls between the scene and knowledge card.

**Tech Stack:** React 19, TypeScript, CSS Grid, Vitest, Testing Library, GitHub Pages.

## Global Constraints

- Mobile order at widths up to 720px is scene → controls → knowledge card.
- Desktop order remains scene and knowledge side by side, controls below both.
- Controls are never fixed, sticky, or overlaid on the animation.
- Touch targets remain at least 44px high.
- Simulation state, timing, copy, and all other models remain unchanged.

---

### Task 1: One responsive layout container

**Files:**
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Modify: `components/action-potential/action-potential.css`
- Test: `tests/action-potential/lab.test.tsx`
- Test: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**
- Consumes: the existing `ActionPotentialScene`, `ActionPotentialKnowledgeCard`, `LabControls`, and `ConductionControls` components.
- Produces: one `.ap-layout` with `.ap-scene`, `.ap-controls`, and `.ap-knowledge` children and responsive named grid areas.

- [ ] **Step 1: Add failing layout tests**

Add a DOM test requiring scene, controls, and knowledge card to share one `.ap-layout` ancestor. Add CSS contracts requiring desktop grid areas `scene knowledge` / `controls controls` and mobile areas `scene` / `controls` / `knowledge`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `npm test -- tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts`

Expected: tests fail because controls are outside `.ap-workspace` and named mobile areas do not exist.

- [ ] **Step 3: Implement the single grid**

Replace `.ap-workspace` with `.ap-layout`, render the current mode's existing control component between the scene and knowledge card in JSX, and assign `grid-area` values in CSS. Do not duplicate any controls.

- [ ] **Step 4: Add compact mobile sizing**

Within `@media (max-width: 720px)`, reduce shell/card gaps and padding, set `.ap-controls` to a two-column grid, make the primary button wider, and guarantee `.ap-control { min-height: 44px; }`.

- [ ] **Step 5: Run focused tests and lint**

Run: `npm test -- tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts && npm run lint`

Expected: all focused tests pass and lint exits 0.

- [ ] **Step 6: Commit**

```bash
git add components/action-potential/ActionPotentialLab.tsx components/action-potential/action-potential.css tests/action-potential/lab.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "fix: keep action potential controls near mobile animation"
```

### Task 2: Validate and publish

**Files:**
- Verify only: the source, Pages artifact, and deployed page.

**Interfaces:**
- Consumes: Task 1 and the existing GitHub Pages workflow.
- Produces: the updated public mobile page.

- [ ] **Step 1: Run complete validation**

Run: `npm test && npm run lint && npm run build && npm run build:pages && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 2: Browser acceptance at 390×844 and desktop**

At 390×844, confirm scene → controls → knowledge geometry, buttons at least 44px high, no horizontal overflow, and the next button stays near the scene after advancing. At desktop width, confirm scene/knowledge remain side by side and controls span below.

- [ ] **Step 3: Push and wait for Pages**

Push `HEAD:main`, wait for the GitHub Pages workflow to succeed, then open the deployed action-potential route.
