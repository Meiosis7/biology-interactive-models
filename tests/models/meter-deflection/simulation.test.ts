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
    const value = getMeterSnapshot(3, {
      ...normal,
      mode: "equidistant",
      stimulusPosition: 50,
      electrodeA: 30,
      electrodeB: 70,
    });

    expect(value.stage).toBe("simultaneous");
    expect(Math.abs(value.differenceMv)).toBeLessThan(0.01);
  });

  it("ends the simultaneous stage when the equal-arrival excitation pulse has passed", () => {
    const settings = {
      ...normal,
      mode: "equidistant",
      stimulusPosition: 50,
      electrodeA: 30,
      electrodeB: 70,
    } as const;

    expect(getMeterSnapshot(3.9, settings).stage).toBe("simultaneous");
    expect(getMeterSnapshot(4, settings).stage).toBe("passed");
    expect(getMeterSnapshot(METER_DURATION, settings).stage).toBe("passed");
  });

  it("keeps extracellular difference near zero when both sites share a state", () => {
    expect(getMeterSnapshot(0, normal).differenceMv).toBe(0);
    expect(getMeterSnapshot(9, normal).differenceMv).toBe(0);
  });

  it("classifies an extracellular excitation at A at time zero", () => {
    const snapshot = getMeterSnapshot(0, {
      ...normal,
      stimulusPosition: normal.electrodeA,
    });

    expect(snapshot.stage).toBe("at-a");
    expect(snapshot.voltageA).toBeLessThan(0);
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

  it("bases transmembrane stages only on A while B remains a reference", () => {
    const settings = {
      ...normal,
      mode: "transmembrane",
      stimulusPosition: 10,
      electrodeA: 70,
      electrodeB: 30,
    } as const;

    const whenWavePassesB = getMeterSnapshot(2.5, settings);
    expect(whenWavePassesB).toMatchObject({
      stage: "approaching-a",
      voltageA: -70,
      voltageB: 0,
    });
    expect(getMeterSnapshot(6.5, settings).stage).toBe("at-a");
    expect(getMeterSnapshot(8.5, settings).stage).toBe("passed");
  });

  it("classifies a transmembrane excitation at A at time zero", () => {
    const snapshot = getMeterSnapshot(0, {
      ...normal,
      mode: "transmembrane",
      stimulusPosition: normal.electrodeA,
    });

    expect(snapshot.stage).toBe("at-a");
    expect(snapshot.voltageA).toBe(30);
  });

  it("names B as the approaching electrode when B arrives first", () => {
    const snapshot = getMeterSnapshot(1, {
      ...normal,
      electrodeA: 70,
      electrodeB: 35,
    });

    expect(snapshot.stage).toBe("approaching-b");
    expect(snapshot.differenceMv).toBe(0);
  });

  it("keeps the pointer within the teaching dial limits", () => {
    expect(Math.abs(getMeterSnapshot(0, { ...normal, mode: "transmembrane" }).pointerAngle)).toBeLessThanOrEqual(42);
    expect(METER_DURATION).toBeGreaterThan(9);
  });
});
