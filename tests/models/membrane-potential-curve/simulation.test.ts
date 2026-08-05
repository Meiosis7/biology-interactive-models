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
    expect(getCurveSnapshot(5, "threshold").stage).toBe("recovery");
    expect(getCurveSnapshot(6, "threshold").stage).toBe("resting");
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
