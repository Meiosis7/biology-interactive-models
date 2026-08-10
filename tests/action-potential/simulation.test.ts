import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential three-mode frames", () => {
  it("defines exactly the three requested modes", () => {
    expect(ACTION_POTENTIAL_MODES.map((item) => item.label)).toEqual([
      "静息电位",
      "动作电位产生",
      "动作电位传导",
    ]);
  });

  it("keeps resting mode outside-positive with potassium moving out", () => {
    expect(getActionPotentialFrame("resting", 0.4)).toMatchObject({
      phase: "resting",
      polarity: "outside-positive",
      ionMotion: "potassium-out",
    });
  });

  it.each([
    [0.12, "sodium-in", "outside-positive"],
    [0.38, "polarity-reversed", "inside-positive"],
    [0.68, "potassium-out", "inside-positive"],
    [0.92, "recovered", "outside-positive"],
  ] as const)("maps generation progress %s to %s", (progress, phase, polarity) => {
    expect(getActionPotentialFrame("generation", progress)).toMatchObject({
      phase,
      polarity,
    });
  });

  it("moves two excited regions away from the stimulus point", () => {
    const early = getActionPotentialFrame("conduction", 0.2).excitedCenters;
    const late = getActionPotentialFrame("conduction", 0.8).excitedCenters;
    expect(late[0]).toBeLessThan(early[0]);
    expect(late[1]).toBeGreaterThan(early[1]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 0.5))).not.toMatch(
      /voltage|mV/,
    );
  });
});
