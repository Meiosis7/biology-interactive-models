# Action Potential PDF Frame Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every action-potential generation and conduction frame match the approved PDF wording and show the stimulus label/indicator only in the first generation phase.

**Architecture:** Keep the existing frame-driven simulation and shared membrane scene. Correct `ActionPotentialFrame.stimulusVisible` and instruction strings at the simulation boundary, then add a defensive renderer gate requiring generation mode plus the stimulus phase. Preserve all ion, channel, current, timing, manual-step, responsive-layout, and reduced-motion behavior.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library, CSS, in-app Browser.

## Global Constraints

- The stimulus text and red indicator line appear only when `mode === "generation" && phase === "stimulus"`.
- Generation copy is exactly: “刺激局部神经纤维”, “受刺激部位 Na⁺通道开放”, “Na⁺从上下通道进入受刺激部位膜内”, “受刺激部位兴奋，膜外为负、膜内为正”.
- Conduction copy remains exactly: “受刺激部位已经形成动作电位”, “形成局部电流”, “局部电流使相邻部位 Na⁺通道开放”, “Na⁺从上下通道进入相邻部位膜内”, “相邻部位形成动作电位”.
- Terminal result remains exactly: “神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。”.
- Do not show “中央”, “中央膜段”, step/round numbering, removed subtitles, or duplicated bottom teaching notes.
- Do not alter ion distribution or drift, channel geometry, sodium paths, local-current animation/direction, playback timing, conduction next-step order, reduced-motion behavior, or responsive layout.

---

### Task 1: Correct frame copy and stimulus state

**Files:**
- Modify: `tests/action-potential/simulation.test.ts`
- Modify: `components/action-potential/simulation.ts`

**Interfaces:**
- Consumes: `getActionPotentialFrame(mode, progress)` and `getConductionStepFrame(step, progress)`.
- Produces: `ActionPotentialFrame.stimulusVisible` as the canonical frame-level stimulus state and exact approved `instruction` strings.

- [ ] **Step 1: Write failing frame-contract tests**

Add assertions that only the first generation frame exposes the stimulus and that all conduction frames hide it:

```ts
it("shows the stimulus only in the first generation phase", () => {
  expect(getActionPotentialFrame("generation", 0.05).stimulusVisible).toBe(true);
  for (const progress of [0.25, 0.55, 0.9]) {
    expect(getActionPotentialFrame("generation", progress).stimulusVisible).toBe(false);
  }
  for (const step of [0, 1, 2, 3, 4, 5, 6] as const) {
    expect(getConductionStepFrame(step, 1).stimulusVisible).toBe(false);
  }
});
```

Update the generation copy assertions to require:

```ts
expect(getActionPotentialFrame("generation", 0.25).instruction).toBe(
  "受刺激部位 Na⁺通道开放",
);
expect(getActionPotentialFrame("generation", 0.55).instruction).toBe(
  "Na⁺从上下通道进入受刺激部位膜内",
);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/action-potential/simulation.test.ts`

Expected: failures show later generation and conduction frames still set `stimulusVisible: true`, and the two old generation instructions do not match the approved wording.

- [ ] **Step 3: Implement the minimal frame changes**

In `getConductionStepFrame`, set `stimulusVisible: false` in every return branch. In `getActionPotentialFrame`, keep the stimulus branch true and set the other generation branches false. Replace only the two outdated instructions:

```ts
instruction: "受刺激部位 Na⁺通道开放",
```

```ts
instruction: "Na⁺从上下通道进入受刺激部位膜内",
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- --run tests/action-potential/simulation.test.ts`

Expected: all simulation tests pass.

- [ ] **Step 5: Commit the frame contract**

```bash
git add components/action-potential/simulation.ts tests/action-potential/simulation.test.ts
git commit -m "fix: align action potential frames with pdf"
```

### Task 2: Enforce stimulus rendering through playback and mode changes

**Files:**
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/lab.test.tsx`
- Modify: `components/action-potential/ActionPotentialScene.tsx`

**Interfaces:**
- Consumes: corrected `ActionPotentialFrame.phase` and `stimulusVisible` from Task 1.
- Produces: scene DOM where the `刺激点` graphic exists only for the approved generation stimulus frame.

- [ ] **Step 1: Write failing scene and playback tests**

Replace the old expectation that a sodium-in generation frame contains the stimulus with phase-specific checks:

```tsx
const stimulus = getActionPotentialFrame("generation", 0.05);
const { rerender } = render(
  <ActionPotentialScene mode="generation" frame={stimulus} playing={false} />,
);
expect(screen.getByRole("img", { name: "刺激点" })).toBeInTheDocument();

for (const progress of [0.25, 0.55, 0.9]) {
  rerender(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", progress)}
      playing={false}
    />,
  );
  expect(screen.queryByRole("img", { name: "刺激点" })).not.toBeInTheDocument();
}
```

Add conduction coverage for every manual step and a defensive mismatched-frame check:

```tsx
for (const step of [0, 1, 2, 3, 4, 5, 6] as const) {
  rerender(
    <ActionPotentialScene
      mode="conduction"
      frame={getConductionStepFrame(step, 1)}
      playing={false}
    />,
  );
  expect(screen.queryByRole("img", { name: "刺激点" })).not.toBeInTheDocument();
}
```

In the lab test, extend the generation loop/replay and mode-switch tests so the stimulus is present at the stimulus phase, absent after entering channel-opening, and absent immediately after switching to conduction.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: the old unconditional `frame.stimulusVisible` render or stale assertions fail against the new phase/mode contract.

- [ ] **Step 3: Add the defensive scene gate**

Define the visible state before rendering segments:

```tsx
const showStimulus =
  mode === "generation" &&
  frame.phase === "stimulus" &&
  frame.stimulusVisible;
```

Render the marker only with:

```tsx
{showStimulus && segment.id === 3 && (
  <i className="ap-stimulus" role="img" aria-label="刺激点">
    <span>刺激</span>
  </i>
)}
```

- [ ] **Step 4: Run action-potential tests and verify GREEN**

Run: `npm test -- --run tests/action-potential`

Expected: all action-potential tests pass with no stimulus in later generation or any conduction frame.

- [ ] **Step 5: Commit renderer and playback coverage**

```bash
git add components/action-potential/ActionPotentialScene.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
git commit -m "fix: remove stale stimulus from later frames"
```

### Task 3: Verify the complete PDF-aligned result

**Files:**
- Verify: `components/action-potential/`
- Verify: `tests/action-potential/`
- Create: `.superpowers/sdd/action-potential-pdf-frame-compliance-report.md`

**Interfaces:**
- Consumes: Tasks 1 and 2 at their committed HEAD.
- Produces: automated and real-browser evidence for the finished action-potential page.

- [ ] **Step 1: Run the complete automated verification chain**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Verify every desktop frame in the in-app Browser**

At `http://localhost:3002/models/action-potential` with viewport 1280×720:

- Open generation and observe one complete loop.
- Confirm the stimulus exists in the first phase and disappears in channel-opening, sodium-in, and excited phases.
- Pause in a later phase and confirm it stays absent; resume and replay, confirming replay restores it only on the first phase.
- Open conduction and click through every next-step state, confirming the stimulus never appears.
- Confirm all approved instructions and the terminal result exactly match the specification.

- [ ] **Step 3: Verify mobile and negative-copy constraints**

At viewport 390×844:

- Repeat generation and conduction stimulus checks.
- Confirm “下一步” remains visible and usable in the first viewport.
- Confirm no horizontal overflow, clipped instruction, or empty stimulus placeholder.
- Search rendered page text for `中央|中央膜段|第一轮|第二轮|第三轮|第几步|兴奋由中央向两侧逐段传导` and require zero matches.
- Confirm console warning/error count is zero.

- [ ] **Step 4: Write the verification report**

Record exact command results, viewport sizes, inspected phases, stimulus counts, copy checks, console results, and any concerns in `.superpowers/sdd/action-potential-pdf-frame-compliance-report.md`.

- [ ] **Step 5: Commit the report if it is tracked**

```bash
git add -f .superpowers/sdd/action-potential-pdf-frame-compliance-report.md
git commit -m "docs: record action potential pdf verification"
```

Expected: `git status --short` is empty after the final commit.
