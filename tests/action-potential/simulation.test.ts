import { describe, expect, it } from "vitest";
import {
  getArrivalTime,
  getMembranePotential,
  getSimulationSnapshot,
} from "../../components/action-potential/simulation";

describe("action-potential simulation", () => {
  it("keeps subthreshold stimulation local", () => {
    const result = getSimulationSnapshot(1.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.52,
    });
    expect(result.propagating).toBe(false);
    expect(result.stage).toBe("local");
    expect(result.membranePotential).toBeLessThan(-55);
  });

  it("does not record a weak local potential at a distant electrode", () => {
    const result = getSimulationSnapshot(1.5, {
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

  it("propagates rightward only from the left end", () => {
    const result = getSimulationSnapshot(2, {
      intensity: "threshold",
      stimulusPosition: 0.1,
      electrodePosition: 0.5,
    });
    expect(result.wavefronts).toHaveLength(1);
    expect(result.wavefronts[0]).toBeGreaterThan(0.1);
  });

  it("propagates leftward only from the right end", () => {
    const result = getSimulationSnapshot(2, {
      intensity: "threshold",
      stimulusPosition: 0.9,
      electrodePosition: 0.5,
    });
    expect(result.wavefronts).toHaveLength(1);
    expect(result.wavefronts[0]).toBeLessThan(0.9);
  });
});
