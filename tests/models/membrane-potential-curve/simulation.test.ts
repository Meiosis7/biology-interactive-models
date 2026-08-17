import { describe, expect, it } from "vitest";
import {
  checkCurveAnswer,
  getCurveSnapshot,
} from "../../../models/03-membrane-potential-curve/simulation";

describe("membrane potential curve", () => {
  it("keeps threshold and strong peaks equal", () => {
    expect(getCurveSnapshot(3, "threshold").mv).toBe(30);
    expect(getCurveSnapshot(3, "strong").mv).toBe(30);
  });

  it("keeps weak stimulation subthreshold", () => {
    expect(getCurveSnapshot(3, "weak").mv).toBeLessThan(-55);
    expect(getCurveSnapshot(3, "weak").stage).toBe("local");
  });

  it("maps depolarization and repolarization to ions", () => {
    expect(getCurveSnapshot(2.5, "threshold").ionFlow).toBe("sodium-in");
    expect(getCurveSnapshot(4.2, "threshold").ionFlow).toBe("potassium-out");
  });

  it("derives membrane polarity from the voltage during phase transitions", () => {
    const earlyDepolarization = getCurveSnapshot(2.1, "threshold");
    const lateDepolarization = getCurveSnapshot(2.9, "threshold");
    const earlyRepolarization = getCurveSnapshot(4.1, "threshold");
    const lateRepolarization = getCurveSnapshot(4.9, "threshold");

    expect(earlyDepolarization.mv).toBeLessThan(0);
    expect(earlyDepolarization.insidePolarity).toBe("negative");
    expect(lateDepolarization.mv).toBeGreaterThan(0);
    expect(lateDepolarization.insidePolarity).toBe("positive");
    expect(earlyRepolarization.mv).toBeGreaterThan(0);
    expect(earlyRepolarization.insidePolarity).toBe("positive");
    expect(lateRepolarization.mv).toBeLessThan(0);
    expect(lateRepolarization.insidePolarity).toBe("negative");
  });

  it("treats both zero-millivolt crossings as membrane-inner-positive", () => {
    const depolarizationZero = getCurveSnapshot(2 + 55 / 85, "threshold");
    const repolarizationZero = getCurveSnapshot(4 + (30 / 100) * 0.8, "threshold");

    expect(depolarizationZero.mv).toBeCloseTo(0);
    expect(depolarizationZero.insidePolarity).toBe("positive");
    expect(repolarizationZero.mv).toBeCloseTo(0);
    expect(repolarizationZero.insidePolarity).toBe("positive");
  });

  it("opens the matching channel in each ion-flow stage", () => {
    expect(getCurveSnapshot(2.5, "threshold")).toMatchObject({
      sodiumOpen: true,
      potassiumOpen: false,
    });
    expect(getCurveSnapshot(4.2, "threshold")).toMatchObject({
      sodiumOpen: false,
      potassiumOpen: true,
    });
  });

  it("moves through the deterministic action-potential stages", () => {
    expect(getCurveSnapshot(0, "threshold").stage).toBe("resting");
    expect(getCurveSnapshot(1.5, "threshold").stage).toBe("threshold");
    expect(getCurveSnapshot(2.5, "threshold").stage).toBe("depolarization");
    expect(getCurveSnapshot(3, "threshold").stage).toBe("peak");
    expect(getCurveSnapshot(4.2, "threshold").stage).toBe("repolarization");
    expect(getCurveSnapshot(4.9, "threshold").stage).toBe("hyperpolarization");
    expect(getCurveSnapshot(5.6, "threshold").stage).toBe("recovery");
    expect(getCurveSnapshot(6, "threshold").stage).toBe("resting");
  });

  it("separates hyperpolarization from the return to resting potential", () => {
    const hyperpolarization = getCurveSnapshot(5.25, "threshold");
    const recovery = getCurveSnapshot(5.6, "threshold");

    expect(hyperpolarization).toMatchObject({
      stage: "hyperpolarization",
      ionFlow: "potassium-out",
      potassiumOpen: true,
    });
    expect(hyperpolarization.mv).toBeLessThan(-70);
    expect(recovery).toMatchObject({
      stage: "recovery",
      ionFlow: "potassium-out",
      potassiumOpen: true,
    });
    expect(recovery.mv).toBeGreaterThan(hyperpolarization.mv);
    expect(recovery.mv).toBeLessThan(-70);
  });

  it("checks stage, ion and polarity together", () => {
    expect(
      checkCurveAnswer("peak", {
        stage: "peak",
        ionFlow: "none",
        insidePolarity: "positive",
      }).correct,
    ).toBe(true);
    expect(
      checkCurveAnswer("peak", {
        stage: "repolarization",
        ionFlow: "potassium-out",
        insidePolarity: "negative",
      }).correct,
    ).toBe(false);
  });

  it("checks answers against the exact snapshot during depolarization", () => {
    const snapshot = getCurveSnapshot(2.1, "threshold");

    expect(
      checkCurveAnswer(snapshot, {
        stage: "depolarization",
        ionFlow: "sodium-in",
        insidePolarity: "negative",
      }),
    ).toMatchObject({
      correct: true,
      expected: {
        stage: "depolarization",
        ionFlow: "sodium-in",
        insidePolarity: "negative",
      },
    });
  });

  it("checks answers against the exact snapshot during repolarization", () => {
    const snapshot = getCurveSnapshot(4.1, "threshold");

    expect(
      checkCurveAnswer(snapshot, {
        stage: "repolarization",
        ionFlow: "potassium-out",
        insidePolarity: "positive",
      }),
    ).toMatchObject({
      correct: true,
      expected: {
        stage: "repolarization",
        ionFlow: "potassium-out",
        insidePolarity: "positive",
      },
    });
  });

  it("returns the expected answer and a biology explanation", () => {
    const result = checkCurveAnswer("repolarization", {
      stage: "repolarization",
      ionFlow: "potassium-out",
      insidePolarity: "negative",
    });

    expect(result.expected).toEqual({
      stage: "repolarization",
      ionFlow: "potassium-out",
      insidePolarity: "negative",
    });
    expect(result.explanation).toMatch(/复极化期.*K⁺外流.*膜内.*负.*膜外.*正/);
  });
});
