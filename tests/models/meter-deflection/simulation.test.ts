import { describe, expect, it } from "vitest";
import {
  METER_DURATION,
  getMeterSnapshot,
} from "../../../models/04-meter-deflection/simulation";

describe("meter deflection simulation", () => {
  const normal = {
    mode: "extracellular",
    stimulusPosition: 10,
    electrodeA: 35,
    electrodeB: 70,
    leadsReversed: false,
  } as const;

  it("deflects in opposite directions when excitation reaches A then B", () => {
    expect(getMeterSnapshot(3.5, normal).differenceMv).toBeLessThan(0);
    expect(getMeterSnapshot(6.5, normal).differenceMv).toBeGreaterThan(0);
  });

  it("reverses only the pointer sign after swapping leads", () => {
    const original = getMeterSnapshot(3.5, normal);
    const reversed = getMeterSnapshot(3.5, { ...normal, leadsReversed: true });

    expect(reversed.differenceMv).toBe(-original.differenceMv);
    expect(reversed.pointerAngle).toBe(-original.pointerAngle);
    expect(reversed.wavefronts).toEqual(original.wavefronts);
    expect(reversed.arrivalA).toBe(original.arrivalA);
    expect(reversed.arrivalB).toBe(original.arrivalB);
  });

  it("stays near zero for equidistant simultaneous arrival", () => {
    const value = getMeterSnapshot(5, {
      ...normal,
      mode: "equidistant",
      stimulusPosition: 50,
      electrodeA: 30,
      electrodeB: 70,
    });

    expect(value.stage).toBe("simultaneous");
    expect(Math.abs(value.differenceMv)).toBeLessThan(0.01);
  });

  it("keeps extracellular difference near zero when both sites share a state", () => {
    expect(getMeterSnapshot(0, normal).differenceMv).toBe(0);
    expect(getMeterSnapshot(9, normal).differenceMv).toBe(0);
  });

  it("derives arrival order from distance instead of electrode labels", () => {
    const snapshot = getMeterSnapshot(3.5, {
      ...normal,
      electrodeA: 70,
      electrodeB: 35,
    });

    expect(snapshot.arrivalB).toBeLessThan(snapshot.arrivalA);
    expect(snapshot.differenceMv).toBeGreaterThan(0);
    expect(snapshot.stage).toBe("at-b");
  });

  it("uses a distinct resting and excited transmembrane signal", () => {
    const resting = getMeterSnapshot(0, { ...normal, mode: "transmembrane" });
    const excited = getMeterSnapshot(3.5, { ...normal, mode: "transmembrane" });

    expect(resting.differenceMv).toBe(-70);
    expect(excited.differenceMv).toBeGreaterThan(0);
    expect(excited.differenceMv).not.toBe(
      getMeterSnapshot(3.5, normal).differenceMv,
    );
  });

  it("keeps the pointer within the teaching dial limits", () => {
    expect(Math.abs(getMeterSnapshot(0, { ...normal, mode: "transmembrane" }).pointerAngle)).toBeLessThanOrEqual(42);
    expect(METER_DURATION).toBeGreaterThan(9);
  });
});
