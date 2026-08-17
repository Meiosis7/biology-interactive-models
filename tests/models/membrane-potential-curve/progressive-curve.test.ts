import { describe, expect, it } from "vitest";
import { getVisibleCurveTimes } from "../../../models/03-membrane-potential-curve/CurveCanvas";

describe("progressive membrane-potential curve", () => {
  it("reveals samples only through the current time", () => {
    expect(getVisibleCurveTimes(0)).toEqual([0]);

    const partialCurve = getVisibleCurveTimes(2);
    expect(partialCurve.at(-1)).toBe(2);
    expect(partialCurve.every((pointTime) => pointTime <= 2)).toBe(true);
    expect(partialCurve.length).toBeLessThan(241);

    expect(getVisibleCurveTimes(6)).toHaveLength(241);
  });

  it("clamps reveal progress to the experiment duration", () => {
    expect(getVisibleCurveTimes(-1)).toEqual([0]);
    const completedCurve = getVisibleCurveTimes(8);
    expect(completedCurve.at(-1)).toBe(6);
    expect(completedCurve).toHaveLength(241);
  });
});
