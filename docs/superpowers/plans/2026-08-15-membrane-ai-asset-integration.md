# Membrane AI Asset Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse the existing AI-generated protein and particle layers inside the membrane-potential model without weakening its teaching clarity.

**Architecture:** Keep all simulation and interaction state unchanged. Add sprite-backed visual layers inside existing channel and particle elements, using CSS background positioning and filters to distinguish Na⁺ from K⁺ while retaining labels and accessible state.

**Tech Stack:** React, TypeScript, CSS sprite backgrounds, Vitest, Testing Library

## Global Constraints

- Use only `/synapse-cinematic/receptors-layer.png` and `/synapse-cinematic/transmitters-layer.png`.
- Do not reuse the full synapse scene or vesicle imagery.
- Keep Na⁺ and K⁺ identifiable by both text and color.
- Keep all existing curve, time, channel-state, polarity, and ion-flow behavior.
- The standalone deliverable includes only the two required AI assets.

---

### Task 1: Add AI-Backed Protein and Particle Layers

**Files:**
- Create: `tests/models/membrane-potential-curve/ai-assets.test.ts`
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`

**Interfaces:**
- Consumes: existing `.membrane-channel`, `.membrane-particle`, and `.membrane-flow-dot` elements.
- Produces: `.membrane-channel-art` sprite layers with `data-protein="sodium" | "potassium"`, plus AI texture backgrounds for particles and flow dots.

- [ ] **Step 1: Write failing source and DOM tests**

Assert that each channel contains one `.membrane-channel-art` child with the correct `data-protein` value. Assert that CSS references `receptors-layer.png` for `.membrane-channel-art` and `transmitters-layer.png` for `.membrane-particle::before` and `.membrane-flow-dot`.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- tests/models/membrane-potential-curve/ai-assets.test.ts`

Expected: FAIL because no channel-art layers or AI sprite backgrounds exist.

- [ ] **Step 3: Add channel-art markup**

Insert this visual-only child before each channel label:

```tsx
<span
  className="membrane-channel-art"
  data-protein="sodium"
  aria-hidden="true"
/>
```

Use `data-protein="potassium"` for the K⁺ channel. Move the visible ion name to a `<b>` element so it stays above the sprite layer.

- [ ] **Step 4: Add sprite styles**

Use `receptors-layer.png` as a 650%-wide sprite sheet for channel art, with sodium and potassium selecting different horizontal positions. Use `transmitters-layer.png` as the background for particle pseudo-elements and flow dots; hue-shift sodium to blue-green and leave potassium amber. Dim closed channel art and restore saturation, scale, and a restrained glow for open channels.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- tests/models/membrane-potential-curve/ai-assets.test.ts && npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

### Task 2: Build and Package the AI-Enhanced Model

**Files:**
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/membrane-curve.css`
- Create: `membrane-potential-curve-standalone/public/synapse-cinematic/receptors-layer.png`
- Create: `membrane-potential-curve-standalone/public/synapse-cinematic/transmitters-layer.png`
- Create: `膜电位变化曲线-动态交互模型-2026-08-15-v4.zip`

**Interfaces:**
- Consumes: verified main-project model files and the two source images.
- Produces: an independently runnable model with local AI assets and an integrity-checked archive.

- [ ] **Step 1: Run main production build**

Run: `npm run build`

Expected: production build PASS.

- [ ] **Step 2: Sync source and AI assets**

Mechanically copy the six membrane model files and the two approved AI assets into the standalone project. Verify source and destination hashes match.

- [ ] **Step 3: Build standalone project**

Run: `npm run build` inside `membrane-potential-curve-standalone`.

Expected: standalone production build PASS.

- [ ] **Step 4: Create and validate v4 archive**

Create `膜电位变化曲线-动态交互模型-2026-08-15-v4.zip`, excluding `node_modules`, `.next`, and `.DS_Store`, then run `unzip -t`.

Expected: `No errors detected in compressed data`.
