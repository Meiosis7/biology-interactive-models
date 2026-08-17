# Membrane Potassium Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show more continuously moving K⁺ particles inside the membrane and a small nonzero number outside.

**Architecture:** Keep the current membrane component and its animation system. Add an explicit extracellular potassium particle collection, rename the intracellular collection for clarity, and render both in their existing compartments.

**Tech Stack:** React, TypeScript, CSS animations, Vitest, Testing Library

## Global Constraints

- Keep 5 intracellular K⁺ particles and add 2 extracellular K⁺ particles.
- Do not change channel, flow-path, curve, or stage behavior.
- Reuse the existing `.membrane-particle.potassium` visual and animation.

---

### Task 1: Potassium concentration contrast

**Files:**
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Test: `tests/models/membrane-potential-curve/ion-distribution.test.tsx`

**Interfaces:**
- Consumes: `MembraneCurveLab` and the existing membrane compartment class names.
- Produces: 2 extracellular and 5 intracellular `.membrane-particle.potassium` elements.

- [ ] **Step 1: Write the failing test**

```tsx
const outside = view.querySelectorAll(".membrane-extracellular .membrane-particle.potassium");
const inside = view.querySelectorAll(".membrane-intracellular .membrane-particle.potassium");
expect(outside).toHaveLength(2);
expect(inside).toHaveLength(5);
expect(inside.length).toBeGreaterThan(outside.length);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/models/membrane-potential-curve/ion-distribution.test.tsx`
Expected: FAIL because the extracellular compartment has 0 K⁺ particles.

- [ ] **Step 3: Write minimal implementation**

Add a two-position extracellular K⁺ collection, rename the existing five-position collection to identify it as intracellular, and render the two outside particles with unique motion timing.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- tests/models/membrane-potential-curve/ion-distribution.test.tsx`
Expected: PASS.

Run: `npm test -- tests/models/membrane-potential-curve`
Expected: all membrane-potential tests PASS.

- [ ] **Step 5: Build and package**

Run the main and standalone production builds, then create the next versioned ZIP excluding build caches and dependencies.
Expected: both builds succeed and the ZIP contains the extracellular K⁺ implementation.
