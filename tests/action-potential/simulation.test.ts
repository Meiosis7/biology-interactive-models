import { describe, expect, it } from "vitest";
import {
  getArrivalTime,
  getExperimentDuration,
  getMembranePotential,
  getSimulationSnapshot,
} from "../../components/action-potential/simulation";
import type { ExperimentSettings } from "../../components/action-potential/types";

describe("action-potential simulation", () => {
  it("keeps subthreshold stimulation local", () => {
    const result = getSimulationSnapshot(0.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.52,
    });
    expect(result.propagating).toBe(false);
    expect(result.stage).toBe("local");
    expect(result.membranePotential).toBeLessThan(-55);
  });

  it("does not record a weak local potential at a distant electrode", () => {
    const result = getSimulationSnapshot(0.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.8,
    });
    expect(result.stage).toBe("resting");
    expect(result.membranePotential).toBe(-70);
  });

  it("gives threshold and strong stimuli the same action-potential peak", () => {
    const threshold = getMembranePotential(3, "threshold");
    const strong = getMembranePotential(3, "strong");
    expect(threshold).toBe(30);
    expect(strong).toBe(30);
  });

  it("delays the recording when the electrode is farther away", () => {
    expect(getArrivalTime(0.1, 0.8)).toBeGreaterThan(
      getArrivalTime(0.1, 0.3),
    );
  });

  it("keeps the electrode at rest until the wavefront arrives", () => {
    const result = getSimulationSnapshot(2.5, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.8,
    });
    expect(result.stage).toBe("resting");
    expect(result.membranePotential).toBe(-70);
  });

  it("reports sodium influx during depolarization", () => {
    const result = getSimulationSnapshot(2.4, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    expect(result.stage).toBe("depolarization");
    expect(result.ionFlow).toBe("sodium-in");
  });

  it("reports sodium influx for local and threshold sodium-channel opening", () => {
    const local = getSimulationSnapshot(0.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    const threshold = getSimulationSnapshot(1.5, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });

    expect(local.stage).toBe("local");
    expect(local.ionFlow).toBe("sodium-in");
    expect(threshold.stage).toBe("threshold");
    expect(threshold.ionFlow).toBe("sodium-in");
  });

  it("reports potassium efflux during repolarization", () => {
    const result = getSimulationSnapshot(5.2, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    expect(result.stage).toBe("repolarization");
    expect(result.ionFlow).toBe("potassium-out");
  });

  it("propagates in both directions from a middle stimulus", () => {
    const result = getSimulationSnapshot(5, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.7,
    });
    expect(result.wavefronts).toHaveLength(2);
    expect(result.wavefronts[0]).toBeLessThan(0.5);
    expect(result.wavefronts[1]).toBeGreaterThan(0.5);
  });

  it("keeps both wavefronts from a left-side stimulus while the shorter path clamps", () => {
    const result = getSimulationSnapshot(2, {
      intensity: "threshold",
      stimulusPosition: 0.1,
      electrodePosition: 0.5,
    });
    expect(result.wavefronts).toHaveLength(2);
    expect(result.wavefronts[0]).toBe(0);
    expect(result.wavefronts[1]).toBeGreaterThan(0.1);
  });

  it("keeps both wavefronts from a right-side stimulus while the shorter path clamps", () => {
    const result = getSimulationSnapshot(2, {
      intensity: "threshold",
      stimulusPosition: 0.9,
      electrodePosition: 0.5,
    });
    expect(result.wavefronts).toHaveLength(2);
    expect(result.wavefronts[0]).toBeLessThan(0.9);
    expect(result.wavefronts[1]).toBe(1);
  });

  it("derives enough experiment time for a distant recording to recover", () => {
    const settings: ExperimentSettings = {
      intensity: "threshold",
      stimulusPosition: 0.1,
      electrodePosition: 1,
    };
    const arrivalTime = getArrivalTime(
      settings.stimulusPosition,
      settings.electrodePosition,
    );
    const duration = getExperimentDuration(settings);

    expect(duration).toBeGreaterThanOrEqual(arrivalTime + 6);
    expect(getSimulationSnapshot(arrivalTime + 4, settings).stage).toBe("repolarization");
    expect(getSimulationSnapshot(arrivalTime + 5.5, settings).stage).toBe("recovery");
    expect(arrivalTime + 5.5).toBeLessThan(duration);
    expect(getSimulationSnapshot(duration, settings).stage).toBe("resting");
  });

  it("uses a sensible minimum duration for weak and nearby recordings", () => {
    const weakDuration = getExperimentDuration({
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    const nearDuration = getExperimentDuration({
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });

    expect(weakDuration).toBeGreaterThanOrEqual(7);
    expect(nearDuration).toBe(weakDuration);
  });
});
