# Action Potential Ion Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable, uncluttered free-ion layer that shows more Na⁺ and less K⁺ outside the membrane, and more K⁺ and less Na⁺ inside, in all three action-potential modes.

**Architecture:** Create a focused `IonDistribution` component with deterministic position data and render it once inside the shared fiber. Keep this teaching layer independent of simulation frames so mode changes preserve node identity and positions. CSS places the static particles below charges, channels, transport streams, and local-current arcs while preserving the existing mobile control layout.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, vinext, in-app Browser verification.

## Global Constraints

- Show the distribution in resting, generation, and conduction modes.
- Top outside: exactly 6 Na⁺ and 2 K⁺.
- Bottom outside: exactly 6 Na⁺ and 2 K⁺.
- Inside: exactly 8 K⁺ and 2 Na⁺.
- Keep all free-ion positions deterministic across mode switches.
- Free ions must not cover charges, channels, stimulus, transport particles, current arcs, or controls.
- Preserve generation looping, manual conduction steps, open fiber ends, aligned channel transport, reduced motion, and the 390×844 first-screen control layout.
- Do not add dependencies or change simulation timing.

---

## File Structure

- Create `components/action-potential/IonDistribution.tsx`: deterministic free-ion data and semantic rendering.
- Modify `components/action-potential/ActionPotentialScene.tsx`: compose one persistent distribution layer inside the shared fiber.
- Modify `components/action-potential/action-potential.css`: desktop/mobile particle layout and visual hierarchy.
- Create `tests/action-potential/ion-distribution.test.tsx`: counts, region semantics, and deterministic rendering.
- Modify `tests/action-potential/mode-components.test.tsx`: shared-node identity across modes.
- Modify `tests/action-potential/visual-contracts.test.ts`: static layer, z-index, and mobile-size contracts.

### Task 1: Deterministic free-ion component

**Files:**
- Create: `components/action-potential/IonDistribution.tsx`
- Create: `tests/action-potential/ion-distribution.test.tsx`

**Interfaces:**
- Produces: `IonDistribution(): JSX.Element`
- Produces DOM attributes: `data-testid="free-ion-distribution"`, `data-free-ion-region`, `data-free-ion-species`, `--free-ion-x`, and `--free-ion-y`.
- Consumes: React `CSSProperties` only; no simulation frame or mode state.

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IonDistribution } from "../../components/action-potential/IonDistribution";

describe("action-potential free-ion distribution", () => {
  it("shows sodium-rich outside lanes and a potassium-rich inside lane", () => {
    const { container } = render(<IonDistribution />);
    const region = (name: string) =>
      container.querySelector(`[data-free-ion-region="${name}"]`)!;
    const count = (name: string, species: string) =>
      region(name).querySelectorAll(
        `[data-free-ion-species="${species}"]`,
      ).length;

    expect(screen.getByTestId("free-ion-distribution")).toBeInTheDocument();
    expect(count("outside-top", "sodium")).toBe(6);
    expect(count("outside-top", "potassium")).toBe(2);
    expect(count("outside-bottom", "sodium")).toBe(6);
    expect(count("outside-bottom", "potassium")).toBe(2);
    expect(count("inside", "potassium")).toBe(8);
    expect(count("inside", "sodium")).toBe(2);
  });

  it("uses complete deterministic position variables for every ion", () => {
    const { container, rerender } = render(<IonDistribution />);
    const distribution = screen.getByTestId("free-ion-distribution");
    const before = Array.from(
      container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
    ).map((ion) => [ion.dataset.freeIonSpecies, ion.getAttribute("style")]);

    expect(before).toHaveLength(26);
    expect(before.every(([, style]) => style?.includes("--free-ion-x"))).toBe(true);
    expect(before.every(([, style]) => style?.includes("--free-ion-y"))).toBe(true);

    rerender(<IonDistribution />);
    expect(screen.getByTestId("free-ion-distribution")).toBe(distribution);
    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
      ).map((ion) => [ion.dataset.freeIonSpecies, ion.getAttribute("style")]),
    ).toEqual(before);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx
```

Expected: FAIL because `components/action-potential/IonDistribution.tsx` does not exist.

- [ ] **Step 3: Implement the minimal deterministic component**

Create `components/action-potential/IonDistribution.tsx`:

```tsx
import type { CSSProperties } from "react";

type FreeIonSpecies = "sodium" | "potassium";
type FreeIonRegion = "outside-top" | "inside" | "outside-bottom";

interface FreeIonPoint {
  species: FreeIonSpecies;
  x: number;
  y: number;
}

const LABELS: Record<FreeIonSpecies, string> = {
  sodium: "Na⁺",
  potassium: "K⁺",
};

const OUTSIDE_POINTS: readonly FreeIonPoint[] = [
  { species: "sodium", x: 14, y: 24 },
  { species: "sodium", x: 28, y: 72 },
  { species: "sodium", x: 42, y: 22 },
  { species: "sodium", x: 58, y: 70 },
  { species: "sodium", x: 72, y: 24 },
  { species: "sodium", x: 86, y: 70 },
  { species: "potassium", x: 7, y: 78 },
  { species: "potassium", x: 93, y: 20 },
] as const;

const INSIDE_POINTS: readonly FreeIonPoint[] = [
  { species: "potassium", x: 14, y: 24 },
  { species: "potassium", x: 28, y: 72 },
  { species: "potassium", x: 42, y: 24 },
  { species: "potassium", x: 58, y: 72 },
  { species: "potassium", x: 72, y: 24 },
  { species: "potassium", x: 86, y: 72 },
  { species: "potassium", x: 7, y: 70 },
  { species: "potassium", x: 93, y: 28 },
  { species: "sodium", x: 21, y: 26 },
  { species: "sodium", x: 79, y: 70 },
] as const;

const REGIONS: ReadonlyArray<{
  id: FreeIonRegion;
  label: string;
  ions: readonly FreeIonPoint[];
}> = [
  { id: "outside-top", label: "上方膜外 Na⁺多、K⁺少", ions: OUTSIDE_POINTS },
  { id: "inside", label: "膜内 K⁺多、Na⁺少", ions: INSIDE_POINTS },
  { id: "outside-bottom", label: "下方膜外 Na⁺多、K⁺少", ions: OUTSIDE_POINTS },
];

export function IonDistribution() {
  return (
    <div className="ap-free-ion-distribution" data-testid="free-ion-distribution">
      {REGIONS.map((region) => (
        <div
          key={region.id}
          className={`ap-free-ion-region ap-free-ion-region--${region.id}`}
          data-free-ion-region={region.id}
          role="img"
          aria-label={region.label}
        >
          {region.ions.map((ion, index) => (
            <i
              key={`${ion.species}-${index}`}
              className={`ap-free-ion ap-free-ion--${ion.species}`}
              data-free-ion-species={ion.species}
              style={
                {
                  "--free-ion-x": `${ion.x}%`,
                  "--free-ion-y": `${ion.y}%`,
                } as CSSProperties
              }
              aria-hidden="true"
            >
              {LABELS[ion.species]}
            </i>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the component test and verify GREEN**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit the component and tests**

```bash
git add components/action-potential/IonDistribution.tsx tests/action-potential/ion-distribution.test.tsx
git commit -m "feat: add action potential ion distribution"
```

### Task 2: Compose the persistent layer and style its hierarchy

**Files:**
- Modify: `components/action-potential/ActionPotentialScene.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**
- Consumes: `IonDistribution(): JSX.Element` from Task 1.
- Preserves: one `data-testid="shared-fiber"` node and one `data-testid="free-ion-distribution"` node across rerenders.
- Produces: `.ap-free-ion-distribution`, `.ap-free-ion-region`, and `.ap-free-ion` CSS contracts.

- [ ] **Step 1: Write failing scene and CSS contract tests**

Add to `tests/action-potential/mode-components.test.tsx`:

```tsx
it("keeps one free-ion distribution stable across all three modes", () => {
  const { rerender } = render(
    <ActionPotentialScene
      mode="resting"
      frame={getActionPotentialFrame("resting", 0)}
      playing
    />,
  );
  const distribution = screen.getByTestId("free-ion-distribution");

  rerender(
    <ActionPotentialScene
      mode="generation"
      frame={getActionPotentialFrame("generation", 0.55)}
      playing
    />,
  );
  expect(screen.getByTestId("free-ion-distribution")).toBe(distribution);

  rerender(
    <ActionPotentialScene
      mode="conduction"
      frame={getConductionStepFrame(1, 1)}
      playing={false}
    />,
  );
  expect(screen.getByTestId("free-ion-distribution")).toBe(distribution);
  expect(screen.getByLabelText("上方膜外 Na⁺多、K⁺少")).toBeInTheDocument();
  expect(screen.getByLabelText("膜内 K⁺多、Na⁺少")).toBeInTheDocument();
  expect(screen.getByLabelText("下方膜外 Na⁺多、K⁺少")).toBeInTheDocument();
});
```

Add to `tests/action-potential/visual-contracts.test.ts`:

```ts
it("keeps static free ions below teaching overlays and compact on mobile", () => {
  const distributionRule = ruleBody(".ap-free-ion-distribution");
  const ionRule = ruleBody(".ap-free-ion");
  const currentLayer = zIndex(".ap-local-current-system");

  expect(distributionRule).toMatch(/position:\s*absolute/);
  expect(distributionRule).toMatch(/inset:\s*0/);
  expect(distributionRule).toMatch(/z-index:\s*1/);
  expect(distributionRule).toMatch(/pointer-events:\s*none/);
  expect(ionRule).not.toMatch(/animation:/);
  expect(1).toBeLessThan(currentLayer);
  expect(1).toBeLessThan(zIndex(".ap-segment-charge"));
  expect(1).toBeLessThan(zIndex(".ap-ion-channel"));
  expect(1).toBeLessThan(zIndex(".ap-ion-stream"));

  const mobileIonRule = stylesheet.match(
    /@media \(max-width:\s*720px\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
  )?.[1];
  expect(mobileIonRule).toBeDefined();
  expect(mobileIonRule).toMatch(/width:\s*14px/);
  expect(mobileIonRule).toMatch(/height:\s*14px/);
  expect(mobileIonRule).toMatch(/font-size:\s*5px/);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm test -- --run tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Expected: FAIL because the scene does not render the distribution and the CSS selectors do not exist.

- [ ] **Step 3: Compose the component inside the shared fiber**

In `components/action-potential/ActionPotentialScene.tsx`, import the component:

```tsx
import { IonDistribution } from "./IonDistribution";
```

Render it as the first child of `.ap-fiber`, before the seven segments:

```tsx
<div className="ap-fiber" data-testid="shared-fiber">
  <IonDistribution />
  {frame.segments.map((segment) => (
    // existing segment markup remains unchanged
  ))}
</div>
```

- [ ] **Step 4: Add minimal desktop and mobile CSS**

Add before `.ap-segment-charge` in `components/action-potential/action-potential.css`:

```css
.ap-free-ion-distribution {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.ap-free-ion-region {
  position: absolute;
  left: 0;
  width: 100%;
  height: 48px;
}

.ap-free-ion-region--outside-top { top: -108px; }
.ap-free-ion-region--inside { top: 12px; height: 84px; }
.ap-free-ion-region--outside-bottom { bottom: -108px; }

.ap-free-ion {
  position: absolute;
  left: var(--free-ion-x);
  top: var(--free-ion-y);
  display: grid;
  width: 20px;
  height: 20px;
  border: 1px solid color-mix(in srgb, var(--free-ion-fill) 55%, white);
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: color-mix(in srgb, var(--free-ion-fill) 78%, white);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--free-ion-fill) 18%, transparent);
  font-size: 7px;
  font-style: normal;
  font-weight: 800;
  opacity: .78;
  transform: translate(-50%, -50%);
}

.ap-free-ion--sodium { --free-ion-fill: var(--ap-sodium-particle-fill); }
.ap-free-ion--potassium { --free-ion-fill: var(--ap-potassium-particle-fill); }
```

Inside the existing `@media (max-width: 720px)` block add:

```css
.ap-free-ion-region--outside-top { top: -92px; }
.ap-free-ion-region--outside-bottom { bottom: -92px; }

.ap-free-ion {
  width: 14px;
  height: 14px;
  font-size: 5px;
}
```

Do not add an animation rule; the distribution must remain static in normal and reduced-motion modes.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- --run tests/action-potential/ion-distribution.test.tsx tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
```

Expected: all focused tests PASS.

- [ ] **Step 6: Run lint and commit the scene integration**

Run:

```bash
npm run lint
```

Expected: exit 0 with no lint errors.

Commit:

```bash
git add components/action-potential/ActionPotentialScene.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "feat: show membrane ion concentration differences"
```

### Task 3: Full regression and real-layout verification

**Files:**
- Verify only: all action-potential source and tests changed in Tasks 1-2.

**Interfaces:**
- Consumes the completed `IonDistribution` layer and all existing action-potential controls.
- Produces no new runtime API.

- [ ] **Step 1: Run the complete automated chain once**

```bash
npm test && npm run lint && npm run build && git diff --check
```

Expected: all tests PASS; lint, build, and diff check exit 0.

- [ ] **Step 2: Start the local page for browser verification**

```bash
npm run dev -- --port 3002
```

Open `http://localhost:3002/models/action-potential` in the in-app Browser.

- [ ] **Step 3: Verify the 1280×720 layout**

For each mode, confirm:

- one distribution layer and 26 free ions;
- top outside and bottom outside each contain 6 Na⁺/2 K⁺;
- inside contains 8 K⁺/2 Na⁺;
- all free-ion bounds stay inside the scene;
- no free ion overlaps a charge, channel, stimulus, moving ion, or current arc;
- generation still loops and both Na⁺ streams stay aligned to their pores;
- conduction still advances only through “下一步,” and local-current arcs draw progressively.

- [ ] **Step 4: Verify the 390×844 layout**

Confirm:

- `documentElement.scrollWidth === documentElement.clientWidth === 390`;
- all 26 free ions remain visible inside the scene;
- mobile free ions are 14×14px with readable abbreviated labels;
- no overlap with charges, channels, stimulus, or current arcs;
- “下一步” remains fully visible in the first 844px viewport and at least 44px high.

- [ ] **Step 5: Verify reduced motion and console cleanliness**

Run:

```bash
npm test -- --run tests/action-potential/lab.test.tsx -t "uses representative static ion frames with disabled playback for reduced motion"
```

Expected: 1 selected test PASS. In the browser, confirm there are no console warnings or errors.

- [ ] **Step 6: Final scope review**

```bash
git status --short
git log --oneline -5
```

Expected: no uncommitted action-potential files; unrelated pre-existing workspace changes remain untouched.
