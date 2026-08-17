# Membrane Sodium Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show 6 continuously moving Na⁺ particles outside the membrane and 2 inside.

**Architecture:** Split the existing sodium position collection into explicitly named extracellular and intracellular collections. Render both with the existing sodium particle class while keeping all channel and flow behavior unchanged.

**Tech Stack:** React, TypeScript, CSS animations, Vitest, Testing Library

## Global Constraints

- Keep exactly 6 extracellular Na⁺ particles.
- Add exactly 2 intracellular Na⁺ particles.
- Reuse `.membrane-particle.sodium` and its current animation.
- Do not change curve, stage, channel, or flow-path behavior.

---

### Task 1: Sodium concentration contrast

**Files:**
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `tests/models/membrane-potential-curve/ion-distribution.test.tsx`

**Interfaces:**
- Consumes: existing extracellular and intracellular membrane compartments.
- Produces: 6 outside and 2 inside `.membrane-particle.sodium` elements.

- [ ] **Step 1: Write the failing test**

```tsx
const outside = view.querySelectorAll(".membrane-extracellular .membrane-particle.sodium");
const inside = view.querySelectorAll(".membrane-intracellular .membrane-particle.sodium");
expect(outside).toHaveLength(6);
expect(inside).toHaveLength(2);
expect(outside.length).toBeGreaterThan(inside.length);
```

- [ ] **Step 2: Verify the test fails because intracellular Na⁺ is absent**

Run: `npm test -- tests/models/membrane-potential-curve/ion-distribution.test.tsx`

Expected: FAIL with intracellular Na⁺ length 0 instead of 2.

- [ ] **Step 3: Implement the sodium collections and intracellular rendering**

Rename the current six-position array to `EXTRACELLULAR_SODIUM_PARTICLES`, add `INTRACELLULAR_SODIUM_PARTICLES = ["42%", "78%"]`, and render the latter in the intracellular compartment with distinct vertical positions and animation timings.

- [ ] **Step 4: Verify focused and complete membrane tests**

Run: `npm test -- tests/models/membrane-potential-curve/ion-distribution.test.tsx`

Expected: PASS.

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

- [ ] **Step 5: Synchronize and package**

Apply the identical component change to the standalone model, build both projects, and create v10 ZIP excluding dependencies and build caches.

Expected: both builds succeed, source files match, ZIP integrity passes, and the local preview responds successfully.
