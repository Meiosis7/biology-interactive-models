import { describe, expect, it } from "vitest";
import { getHumoralSnapshot } from "../../../models/05-humoral-immunity/simulation";

describe("humoral immunity simulation", () => {
  const normal = {
    antigen: "A",
    exposure: "primary",
    condition: "normal",
  } as const;

  it("orders presentation, activation, expansion and antibody release", () => {
    expect(getHumoralSnapshot(0, normal).stage).toBe("entry");
    expect(getHumoralSnapshot(2, normal).stage).toBe("presentation");
    expect(getHumoralSnapshot(4, normal).stage).toBe("helper-activation");
    expect(getHumoralSnapshot(6, normal).stage).toBe("b-activation");
    expect(getHumoralSnapshot(8, normal).stage).toBe("clonal-expansion");
    expect(getHumoralSnapshot(10, normal).stage).toBe("differentiation");
    expect(getHumoralSnapshot(11, normal).stage).toBe("antibody-release");
    expect(getHumoralSnapshot(14, normal).stage).toBe("clearance");
    expect(getHumoralSnapshot(16, normal).stage).toBe("memory");
  });

  it("makes a matched secondary response faster, stronger, and longer", () => {
    const matchedSecondary = {
      ...normal,
      exposure: "secondary",
      memoryAntigen: "A",
    } as const;

    expect(getHumoralSnapshot(6, matchedSecondary).antibodyLevel).toBeGreaterThan(0);
    expect(getHumoralSnapshot(10, matchedSecondary).antibodyLevel).toBeGreaterThan(
      getHumoralSnapshot(10, normal).antibodyLevel,
    );
    expect(getHumoralSnapshot(16, matchedSecondary).antibodyLevel).toBeGreaterThan(0);
    expect(getHumoralSnapshot(10, matchedSecondary).memoryMatched).toBe(true);
  });

  it("does not transfer a memory advantage to a different antigen", () => {
    const secondaryBWithMemoryA = {
      ...normal,
      antigen: "B",
      exposure: "secondary",
      memoryAntigen: "A",
    } as const;
    const primaryB = { ...normal, antigen: "B" } as const;

    expect(getHumoralSnapshot(10, secondaryBWithMemoryA).memoryMatched).toBe(false);
    expect(getHumoralSnapshot(10, secondaryBWithMemoryA).antibodyLevel).toBe(
      getHumoralSnapshot(10, primaryB).antibodyLevel,
    );
    expect(getHumoralSnapshot(6, secondaryBWithMemoryA).antibodyLevel).toBe(
      getHumoralSnapshot(6, primaryB).antibodyLevel,
    );
  });

  it("releases antibodies specific to the current antigen only", () => {
    const againstA = getHumoralSnapshot(12, normal);
    const againstB = getHumoralSnapshot(12, { ...normal, antigen: "B" });

    expect(againstA.antibodyTarget).toBe("A");
    expect(againstB.antibodyTarget).toBe("B");
    expect(againstA.antigenLevel).toBeLessThan(100);
    expect(againstB.antigenLevel).toBeLessThan(100);
  });

  it.each([
    ["presentation-blocked", "presentation"],
    ["helper-t-blocked", "helper-activation"],
    ["b-cell-missing", "b-activation"],
  ] as const)("blocks %s at %s and freezes downstream outputs", (condition, blockedAt) => {
    const before = getHumoralSnapshot(14, { ...normal, condition });
    const after = getHumoralSnapshot(16, { ...normal, condition });

    expect(before.blockedAt).toBe(blockedAt);
    expect(before.antibodyLevel).toBe(0);
    expect(before.plasmaCount).toBe(0);
    expect(before.memoryCount).toBe(0);
    expect(after).toMatchObject({
      blockedAt,
      antibodyLevel: 0,
      plasmaCount: 0,
      memoryCount: 0,
      antigenLevel: before.antigenLevel,
    });
  });
});
