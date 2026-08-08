import { describe, expect, it } from "vitest";
import { getHumoralSnapshot } from "../../../models/05-humoral-immunity/simulation";

describe("humoral immunity simulation", () => {
  const normal = {
    antigen: "A",
    bCellSpecificity: "A",
    exposure: "primary",
    memorySpecificity: "A",
    condition: "normal",
  } as const;

  it("orders the seven-stage humoral response", () => {
    expect(getHumoralSnapshot(0, normal).stage).toBe("presentation");
    expect(getHumoralSnapshot(4, normal).stage).toBe("helper-activation");
    expect(getHumoralSnapshot(6, normal).stage).toBe("b-activation");
    expect(getHumoralSnapshot(8, normal).stage).toBe("clonal-expansion");
    expect(getHumoralSnapshot(10, normal).stage).toBe("differentiation");
    expect(getHumoralSnapshot(12, normal).stage).toBe("antibody-binding");
    expect(getHumoralSnapshot(16, normal).stage).toBe("memory");
  });

  it("stops an unmatched BCR at B-cell activation", () => {
    const mismatch = { ...normal, bCellSpecificity: "B" } as const;
    const snapshot = getHumoralSnapshot(18, mismatch);

    expect(snapshot).toMatchObject({
      stage: "b-activation",
      blockedAt: "b-activation",
      bCellMatched: false,
      bCellActive: false,
      plasmaCount: 0,
      memoryCount: 0,
      antibodyLevel: 0,
      antigenLevel: 100,
      antibodyTarget: null,
    });
  });

  it("only grants memory advantage when memory and BCR both match", () => {
    const matched = {
      ...normal,
      exposure: "secondary",
      memorySpecificity: "A",
    } as const;
    const wrongMemory = { ...matched, memorySpecificity: "B" } as const;
    const wrongBcr = { ...matched, bCellSpecificity: "B" } as const;

    expect(getHumoralSnapshot(10, matched).memoryMatched).toBe(true);
    expect(getHumoralSnapshot(10, wrongMemory).memoryMatched).toBe(false);
    expect(getHumoralSnapshot(10, wrongBcr).memoryMatched).toBe(false);
    expect(getHumoralSnapshot(10, matched).antibodyLevel).toBeGreaterThan(
      getHumoralSnapshot(10, wrongMemory).antibodyLevel,
    );
  });

  it("makes a matched secondary response faster, stronger, and longer", () => {
    const matchedSecondary = {
      ...normal,
      exposure: "secondary",
      memorySpecificity: "A",
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
      bCellSpecificity: "B",
      exposure: "secondary",
      memorySpecificity: "A",
    } as const;
    const primaryB = { ...normal, antigen: "B", bCellSpecificity: "B" } as const;

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
    const againstB = getHumoralSnapshot(12, {
      ...normal,
      antigen: "B",
      bCellSpecificity: "B",
    });

    expect(againstA.antibodyTarget).toBe("A");
    expect(againstB.antibodyTarget).toBe("B");
    expect(againstA.antigenLevel).toBeLessThan(100);
    expect(againstB.antigenLevel).toBeLessThan(100);
  });

  it("keeps the primary antigen curve continuous at clearance", () => {
    const justBeforeClearance = getHumoralSnapshot(13.999, normal).antigenLevel;
    const atClearance = getHumoralSnapshot(14, normal).antigenLevel;

    expect(atClearance).toBeLessThanOrEqual(justBeforeClearance);
    expect(Math.abs(atClearance - justBeforeClearance)).toBeLessThanOrEqual(1);
  });

  it("never increases primary antigen after antibody release begins", () => {
    const levels = Array.from(
      { length: 21 },
      (_, index) => getHumoralSnapshot(11 + index * 0.25, normal).antigenLevel,
    );

    levels.slice(1).forEach((level, index) => {
      expect(level).toBeLessThanOrEqual(levels[index]);
    });
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
