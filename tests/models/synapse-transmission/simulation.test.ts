import { describe, expect, it } from "vitest";
import { getSynapseSnapshot } from "../../../models/02-synapse-transmission/simulation";

describe("synapse simulation", () => {
  const normal = { kind: "excitatory", condition: "normal" } as const;

  it("orders calcium, release, binding and response", () => {
    expect(getSynapseSnapshot(2, normal).stage).toBe("calcium-entry");
    expect(getSynapseSnapshot(3, normal).stage).toBe("vesicle-fusion");
    expect(getSynapseSnapshot(4, normal).stage).toBe("transmitter-release");
    expect(getSynapseSnapshot(5, normal).stage).toBe("receptor-binding");
    expect(getSynapseSnapshot(6, normal).stage).toBe("postsynaptic-response");
  });

  it("separates excitatory and inhibitory voltage effects", () => {
    expect(getSynapseSnapshot(6, normal).postsynapticMv).toBeGreaterThan(-70);
    expect(
      getSynapseSnapshot(6, { ...normal, kind: "inhibitory" }).postsynapticMv,
    ).toBeLessThan(-70);
  });

  it("blocks release when calcium channels are blocked", () => {
    const value = getSynapseSnapshot(5, {
      ...normal,
      condition: "calcium-blocked",
    });
    expect(value.calciumEntering).toBe(false);
    expect(value.transmitterReleased).toBe(false);
  });

  it("allows release but prevents response when receptors are blocked", () => {
    const value = getSynapseSnapshot(6, {
      ...normal,
      condition: "receptor-blocked",
    });
    expect(value.transmitterReleased).toBe(true);
    expect(value.receptorsActive).toBe(false);
    expect(value.postsynapticMv).toBe(-70);
  });

  it("extends the response when clearance is inhibited", () => {
    expect(
      getSynapseSnapshot(8, {
        ...normal,
        condition: "clearance-inhibited",
      }).postsynapticMv,
    ).toBeGreaterThan(-70);
    expect(getSynapseSnapshot(8, normal).postsynapticMv).toBe(-70);
  });
});
