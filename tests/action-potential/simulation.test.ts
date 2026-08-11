import { describe, expect, it } from "vitest";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import {
  CONDUCTION_ACTION_POTENTIAL_MS,
  CONDUCTION_LOCAL_CURRENT_MS,
  getActionPotentialFrame,
  getConductionStepFrame,
} from "../../components/action-potential/simulation";
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

  it("defines exact manual conduction durations", () => {
    expect(CONDUCTION_LOCAL_CURRENT_MS).toBe(700);
    expect(CONDUCTION_ACTION_POTENTIAL_MS).toBe(1400);
  });

  it.each([
    [0, 1, "excited", [3], null],
    [1, 0, "local-current", [3], 1],
    [2, 1, "neighbor-excited", [2, 3, 4], null],
    [3, 0, "local-current", [2, 3, 4], 2],
    [4, 1, "neighbor-excited", [1, 2, 3, 4, 5], null],
    [5, 0, "local-current", [1, 2, 3, 4, 5], 3],
    [6, 1, "conducted", [0, 1, 2, 3, 4, 5, 6], null],
  ] as const)(
    "maps manual step %s to %s",
    (step, progress, phase, excited, current) => {
      const frame = getConductionStepFrame(step, progress);
      expect(frame.phase).toBe(phase);
      expect(
        frame.segments
          .filter((item) => item.polarity === "excited")
          .map((item) => item.id),
      ).toEqual(excited);
      expect(frame.localCurrentStep).toBe(current);
    },
  );

  it("opens channels, sends sodium, then flips all target charges", () => {
    const opening = getConductionStepFrame(2, 0.1);
    const influx = getConductionStepFrame(2, 0.5);
    const flipped = getConductionStepFrame(2, 1150 / 1400);

    expect(opening.phase).toBe("sodium-channel-opening");
    expect(
      opening.segments
        .filter((item) => item.sodiumChannelOpen)
        .map((item) => item.id),
    ).toEqual([2, 4]);
    expect(influx.phase).toBe("neighbor-sodium-in");
    expect(
      influx.segments
        .filter((item) => item.sodiumInflux)
        .map((item) => item.id),
    ).toEqual([2, 4]);
    expect(
      influx.segments
        .filter((item) => item.polarity === "excited")
        .map((item) => item.id),
    ).toEqual([3]);
    expect(
      flipped.segments
        .filter((item) => item.polarity === "excited")
        .map((item) => item.id),
    ).toEqual([2, 3, 4]);
  });

  it("forms each target action potential before starting the next local current", () => {
    const firstInflux = getConductionStepFrame(2, 0.5);
    const firstExcited = getConductionStepFrame(2, 1);
    const secondCurrent = getConductionStepFrame(3, 0);

    expect(firstInflux.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([3]);
    expect(firstInflux.segments.filter((item) => item.sodiumInflux).map((item) => item.id)).toEqual([2, 4]);
    expect(firstExcited.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
    expect(firstExcited.segments.some((item) => item.sodiumInflux)).toBe(false);
    expect(firstExcited.localCurrentStep).toBeNull();
    expect(secondCurrent.segments.filter((item) => item.polarity === "excited").map((item) => item.id)).toEqual([2, 3, 4]);
    expect(secondCurrent.localCurrentStep).toBe(2);
  });

  it("only accumulates excited segments during conduction", () => {
    const frames = [
      getConductionStepFrame(0, 1),
      getConductionStepFrame(2, 1),
      getConductionStepFrame(4, 1),
      getConductionStepFrame(6, 1),
    ];
    const counts = frames.map(
      (frame) =>
        frame.segments.filter((segment) => segment.polarity === "excited").length,
    );
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(counts).toEqual([1, 3, 5, 7]);
  });

  it("never exposes voltage values", () => {
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(/mV|−70|-70/);
    expect(JSON.stringify(getActionPotentialFrame("generation", 1))).not.toMatch(/voltage|mV/);
  });
});
