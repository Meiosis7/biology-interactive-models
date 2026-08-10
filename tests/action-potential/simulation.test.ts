import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential shared-fiber frames", () => {
  it("defines exactly the three requested modes", () => {
    expect(ACTION_POTENTIAL_MODES.map((item) => item.label)).toEqual([
      "静息电位",
      "动作电位产生",
      "动作电位传导",
    ]);
  });

  it("keeps resting outside-positive with an open potassium channel", () => {
    expect(getActionPotentialFrame("resting", 0.4)).toMatchObject({
      phase: "resting",
      polarity: "outside-positive",
      ionMotion: "potassium-out",
      openChannel: "potassium",
      stimulusVisible: false,
      excitedCenters: [],
    });
  });

  it.each([
    [0.05, "stimulus", "none", "outside-positive"],
    [0.35, "sodium-in", "sodium-in", "outside-positive"],
    [0.8, "excited", "none", "inside-positive"],
    [1, "excited", "none", "inside-positive"],
  ] as const)("maps generation progress %s to %s", (progress, phase, ionMotion, polarity) => {
    expect(getActionPotentialFrame("generation", progress)).toMatchObject({
      phase,
      ionMotion,
      polarity,
      stimulusVisible: true,
    });
  });

  it("never adds potassium recovery to generation", () => {
    const generation = ACTION_POTENTIAL_MODES.find((item) => item.id === "generation")!;
    expect(JSON.stringify(generation)).not.toMatch(/K⁺|恢复|静息状态/);
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      expect(getActionPotentialFrame("generation", progress).ionMotion).not.toBe("potassium-out");
    }
  });

  it("moves two conduction fronts away from the central stimulus", () => {
    const early = getActionPotentialFrame("conduction", 0.2).excitedCenters;
    const late = getActionPotentialFrame("conduction", 0.8).excitedCenters;
    expect(early).toHaveLength(2);
    expect(late[0]).toBeLessThan(early[0]);
    expect(late[1]).toBeGreaterThan(early[1]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 1))).not.toMatch(/voltage|mV/);
  });
});
