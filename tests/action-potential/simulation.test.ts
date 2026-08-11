import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";
import type { ActionPotentialMode } from "../../components/action-potential/types";

const excitedIds = (mode: ActionPotentialMode, progress: number) =>
  getActionPotentialFrame(mode, progress).segments
    .filter((segment) => segment.polarity === "excited")
    .map((segment) => segment.id);

describe("action-potential shared-fiber frames", () => {
  it("defines exactly the three requested modes", () => {
    expect(ACTION_POTENTIAL_MODES.map((item) => item.label)).toEqual([
      "静息电位",
      "动作电位产生",
      "动作电位传导",
    ]);
  });

  it("keeps all seven resting segments outside-positive", () => {
    const frame = getActionPotentialFrame("resting", 0.4);
    expect(frame.segments).toHaveLength(7);
    expect(frame.segments.every((segment) => segment.polarity === "resting")).toBe(true);
    expect(frame.segments.every((segment) => !segment.sodiumChannelOpen)).toBe(true);
    expect(frame.potassiumChannelOpen).toBe(true);
    expect(frame.potassiumOutflow).toBe(true);
  });

  it.each([
    [0.05, "stimulus", [], []],
    [0.25, "sodium-channel-opening", [], [3]],
    [0.55, "sodium-in", [], [3]],
    [0.9, "excited", [3], [3]],
  ] as const)("maps generation progress %s to %s", (progress, phase, excited, open) => {
    const frame = getActionPotentialFrame("generation", progress);
    expect(frame.phase).toBe(phase);
    expect(excitedIds("generation", progress)).toEqual(excited);
    expect(frame.segments.filter((item) => item.sodiumChannelOpen).map((item) => item.id)).toEqual(open);
    expect(frame.potassiumOutflow).toBe(false);
  });

  it.each([
    [0.05, "local-current", [3], 1, [], []],
    [0.16, "neighbor-sodium-in", [3], null, [2, 4], [2, 4]],
    [0.26, "neighbor-excited", [2, 3, 4], null, [], [2, 4]],
    [0.34, "local-current", [2, 3, 4], 2, [], []],
    [0.45, "neighbor-sodium-in", [2, 3, 4], null, [1, 5], [1, 5]],
    [0.56, "neighbor-excited", [1, 2, 3, 4, 5], null, [], [1, 5]],
    [0.64, "local-current", [1, 2, 3, 4, 5], 3, [], []],
    [0.75, "neighbor-sodium-in", [1, 2, 3, 4, 5], null, [0, 6], [0, 6]],
    [0.86, "neighbor-excited", [0, 1, 2, 3, 4, 5, 6], null, [], [0, 6]],
    [0.95, "conducted", [0, 1, 2, 3, 4, 5, 6], null, [], []],
  ] as const)(
    "maps conduction progress %s to %s",
    (progress, phase, excited, step, influx, open) => {
      const frame = getActionPotentialFrame("conduction", progress);
      expect(frame.phase).toBe(phase);
      expect(excitedIds("conduction", progress)).toEqual(excited);
      expect(frame.localCurrentStep).toBe(step);
      expect(
        frame.segments.filter((item) => item.sodiumInflux).map((item) => item.id),
      ).toEqual(influx);
      expect(
        frame.segments
          .filter((item) => item.sodiumChannelOpen)
          .map((item) => item.id),
      ).toEqual(open);
    },
  );

  it("forms each target action potential before starting the next local current", () => {
    const firstInflux = getActionPotentialFrame("conduction", 0.16);
    const firstExcited = getActionPotentialFrame("conduction", 0.26);
    const secondCurrent = getActionPotentialFrame("conduction", 0.34);

    expect(firstInflux.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([3]);
    expect(firstInflux.segments.filter((item) => item.sodiumInflux).map((item) => item.id)).toEqual([2, 4]);
    expect(firstExcited.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
    expect(firstExcited.segments.some((item) => item.sodiumInflux)).toBe(false);
    expect(firstExcited.localCurrentStep).toBeNull();
    expect(secondCurrent.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
    expect(secondCurrent.localCurrentStep).toBe(2);
  });

  it("only accumulates excited segments during conduction", () => {
    const counts = [0, 0.25, 0.5, 0.75, 1].map((progress) => excitedIds("conduction", progress).length);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(excitedIds("conduction", 0)).toEqual([3]);
    expect(excitedIds("conduction", 1)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 1))).not.toMatch(/voltage|mV/);
  });
});
