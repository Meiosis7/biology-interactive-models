import { describe, expect, it } from "vitest";
import { getCellularSnapshot } from "../../../models/06-cellular-immunity/simulation";

describe("cellular immunity simulation", () => {
  const normal = {
    target: "infected-a",
    tCellSpecificity: "A",
    exposure: "primary",
    condition: "normal",
  } as const;

  it("orders activation, expansion, recognition and lysis", () => {
    expect(getCellularSnapshot(3, normal).stage).toBe("helper-activation");
    expect(getCellularSnapshot(5, normal).stage).toBe("cytotoxic-activation");
    expect(getCellularSnapshot(8, normal).stage).toBe("clonal-expansion");
    expect(getCellularSnapshot(11, normal).stage).toBe("target-recognition");
    expect(getCellularSnapshot(13, normal).stage).toBe("target-lysis");
  });

  it("lyses only a matching infected target", () => {
    expect(getCellularSnapshot(14, normal).targetLysed).toBe(true);
    expect(getCellularSnapshot(14, { ...normal, target: "infected-b" }).targetLysed).toBe(
      false,
    );
    expect(getCellularSnapshot(14, { ...normal, target: "normal" }).targetLysed).toBe(false);
  });

  it.each([
    ["normal", "normal target"],
    ["infected-b", "infected target with an unmatched antigen"],
  ] as const)(
    "holds %s at recognition after prior activation and expansion",
    (target) => {
      const snapshot = getCellularSnapshot(16, { ...normal, target });

      expect(snapshot).toMatchObject({
        stage: "target-recognition",
        blockedAt: "target-recognition",
        helperActive: true,
        cytotoxicActive: true,
        effectorCount: 60,
        targetRecognized: false,
        targetLysed: false,
        targetCount: 1,
        memoryCount: 0,
      });
    },
  );

  it("makes a matched secondary response faster", () => {
    const primary = getCellularSnapshot(9, normal);
    const secondary = getCellularSnapshot(9, {
      ...normal,
      exposure: "secondary",
      memorySpecificity: "A",
    });

    expect(secondary.effectorCount).toBeGreaterThan(primary.effectorCount);
    expect(secondary.memoryMatched).toBe(true);
  });

  it.each([
    ["presentation-blocked", "presentation"],
    ["helper-t-blocked", "helper-activation"],
    ["cytotoxic-t-missing", "cytotoxic-activation"],
  ] as const)("blocks %s at %s", (condition, stage) => {
    const value = getCellularSnapshot(14, { ...normal, condition });

    expect(value.blockedAt).toBe(stage);
    expect(value.targetLysed).toBe(false);
  });

  it("does not recognize a target when its displayed marker mismatches", () => {
    const snapshot = getCellularSnapshot(14, { ...normal, condition: "marker-mismatch" });

    expect(snapshot.targetRecognized).toBe(false);
    expect(snapshot.targetLysed).toBe(false);
  });

  it("stops at recognition when the displayed marker mismatches", () => {
    const mismatchedPrimary = { ...normal, condition: "marker-mismatch" } as const;
    const mismatchedSecondary = {
      ...mismatchedPrimary,
      exposure: "secondary",
      memorySpecificity: "A",
    } as const;

    expect(getCellularSnapshot(14, mismatchedPrimary)).toMatchObject({
      stage: "target-recognition",
      blockedAt: "target-recognition",
      targetRecognized: false,
      targetLysed: false,
      targetCount: 1,
      memoryCount: 0,
    });
    expect(getCellularSnapshot(16, mismatchedPrimary)).toMatchObject({
      stage: "target-recognition",
      memoryCount: 0,
    });
    expect(getCellularSnapshot(16, mismatchedSecondary)).toMatchObject({
      stage: "target-recognition",
      memoryCount: 0,
    });
  });

  it("does not give unmatched secondary exposure a memory advantage", () => {
    const primary = getCellularSnapshot(9, normal);
    const unmatchedSecondary = getCellularSnapshot(9, {
      ...normal,
      exposure: "secondary",
      memorySpecificity: "B",
    });

    expect(unmatchedSecondary.memoryMatched).toBe(false);
    expect(unmatchedSecondary.effectorCount).toBe(primary.effectorCount);
  });

  it("does not transfer memory to a target carrying a different antigen", () => {
    const primary = getCellularSnapshot(9, {
      ...normal,
      target: "infected-b",
    });
    const secondaryWithMemoryA = getCellularSnapshot(9, {
      ...normal,
      target: "infected-b",
      exposure: "secondary",
      memorySpecificity: "A",
    });

    expect(secondaryWithMemoryA.memoryMatched).toBe(false);
    expect(secondaryWithMemoryA.effectorCount).toBe(primary.effectorCount);
  });
});
