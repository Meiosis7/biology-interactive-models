import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IonDistribution } from "../../components/action-potential/IonDistribution";

describe("action-potential free-ion distribution", () => {
  it("shows sodium-rich outside lanes and a potassium-rich inside lane", () => {
    const { container } = render(<IonDistribution />);
    const region = (name: string) =>
      container.querySelector(`[data-free-ion-region="${name}"]`)!;
    const count = (name: string, species: string) =>
      region(name).querySelectorAll(
        `[data-free-ion-species="${species}"]`,
      ).length;

    expect(screen.getByTestId("free-ion-distribution")).toBeInTheDocument();
    expect(count("outside-top", "sodium")).toBe(6);
    expect(count("outside-top", "potassium")).toBe(2);
    expect(count("outside-bottom", "sodium")).toBe(6);
    expect(count("outside-bottom", "potassium")).toBe(2);
    expect(count("inside", "potassium")).toBe(8);
    expect(count("inside", "sodium")).toBe(2);
  });

  it("uses complete deterministic position variables for every ion", () => {
    const { container, rerender } = render(<IonDistribution />);
    const distribution = screen.getByTestId("free-ion-distribution");
    const before = Array.from(
      container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
    ).map((ion) => [ion.dataset.freeIonSpecies, ion.getAttribute("style")]);

    expect(before).toHaveLength(26);
    expect(before.every(([, style]) => style?.includes("--free-ion-x"))).toBe(true);
    expect(before.every(([, style]) => style?.includes("--free-ion-y"))).toBe(true);

    rerender(<IonDistribution />);
    expect(screen.getByTestId("free-ion-distribution")).toBe(distribution);
    expect(
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
      ).map((ion) => [ion.dataset.freeIonSpecies, ion.getAttribute("style")]),
    ).toEqual(before);
  });

  it("assigns bounded deterministic drift profiles to every free ion", () => {
    const { container, rerender } = render(<IonDistribution />);
    const readMotion = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
      ).map((ion) => ({
        profile: ion.dataset.motionProfile,
        desktopX: ion.style.getPropertyValue("--free-ion-drift-x"),
        desktopY: ion.style.getPropertyValue("--free-ion-drift-y"),
        mobileX: ion.style.getPropertyValue("--free-ion-mobile-drift-x"),
        mobileY: ion.style.getPropertyValue("--free-ion-mobile-drift-y"),
        duration: ion.style.getPropertyValue("--free-ion-drift-duration"),
        delay: ion.style.getPropertyValue("--free-ion-drift-delay"),
      }));

    const before = readMotion();
    expect(before).toHaveLength(26);
    expect(new Set(before.map((motion) => motion.profile)).size).toBe(6);
    for (const motion of before) {
      expect(Math.abs(Number.parseFloat(motion.desktopX))).toBeLessThanOrEqual(3);
      expect(Math.abs(Number.parseFloat(motion.desktopY))).toBeLessThanOrEqual(3);
      expect(Math.abs(Number.parseFloat(motion.mobileX))).toBeLessThanOrEqual(2);
      expect(Math.abs(Number.parseFloat(motion.mobileY))).toBeLessThanOrEqual(2);
      expect(Number.parseFloat(motion.duration)).toBeGreaterThanOrEqual(7);
      expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(11);
      expect(Number.parseFloat(motion.delay)).toBeLessThan(0);
    }

    rerender(<IonDistribution />);
    expect(readMotion()).toEqual(before);
  });

  it("adds a stable unique effective motion phase to all six bounded profiles", () => {
    const { container, rerender } = render(<IonDistribution />);
    const readMotion = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-free-ion-species]"),
      ).map((ion) => {
        const baseDelay = Number.parseFloat(
          ion.style.getPropertyValue("--free-ion-drift-delay"),
        );
        const phaseOffset = Number.parseFloat(
          ion.style.getPropertyValue("--free-ion-phase-offset"),
        );

        return {
          profile: ion.dataset.motionProfile,
          desktopX: Number.parseFloat(
            ion.style.getPropertyValue("--free-ion-drift-x"),
          ),
          desktopY: Number.parseFloat(
            ion.style.getPropertyValue("--free-ion-drift-y"),
          ),
          mobileX: Number.parseFloat(
            ion.style.getPropertyValue("--free-ion-mobile-drift-x"),
          ),
          mobileY: Number.parseFloat(
            ion.style.getPropertyValue("--free-ion-mobile-drift-y"),
          ),
          duration: Number.parseFloat(
            ion.style.getPropertyValue("--free-ion-drift-duration"),
          ),
          baseDelay,
          phaseOffset,
          effectiveDelay: Number.parseFloat(
            (baseDelay + phaseOffset).toFixed(2),
          ),
        };
      });

    const before = readMotion();
    expect(before).toHaveLength(26);
    expect(new Set(before.map(({ profile }) => profile)).size).toBe(6);
    expect(new Set(before.map(({ effectiveDelay }) => effectiveDelay)).size).toBe(
      26,
    );
    const phasesByProfile = new Map<string, number[]>();
    for (const motion of before) {
      const normalizedPhase = Number(
        (
          ((motion.effectiveDelay % motion.duration) + motion.duration) %
          motion.duration
        ).toFixed(2),
      );
      const phases = phasesByProfile.get(motion.profile) ?? [];
      phases.push(normalizedPhase);
      phasesByProfile.set(motion.profile, phases);
    }
    expect(phasesByProfile).toHaveLength(6);
    for (const phases of phasesByProfile.values()) {
      expect(new Set(phases).size).toBe(phases.length);
    }
    expect(
      new Set(
        before.map(
          ({
            profile,
            desktopX,
            desktopY,
            mobileX,
            mobileY,
            duration,
            effectiveDelay,
          }) =>
            JSON.stringify([
              profile,
              desktopX,
              desktopY,
              mobileX,
              mobileY,
              duration,
              effectiveDelay,
            ]),
        ),
      ).size,
    ).toBe(26);

    for (const motion of before) {
      expect(Math.abs(motion.desktopX)).toBeLessThanOrEqual(3);
      expect(Math.abs(motion.desktopY)).toBeLessThanOrEqual(3);
      expect(Math.abs(motion.mobileX)).toBeLessThanOrEqual(2);
      expect(Math.abs(motion.mobileY)).toBeLessThanOrEqual(2);
      expect(motion.duration).toBeGreaterThanOrEqual(7);
      expect(motion.duration).toBeLessThanOrEqual(11);
      expect(motion.baseDelay).toBeLessThan(0);
      expect(motion.phaseOffset).toBeLessThan(0);
      expect(motion.effectiveDelay).toBeLessThan(0);
    }

    rerender(<IonDistribution />);
    expect(readMotion()).toEqual(before);
  });

  it("marks the collision-safe mobile lane with a stable semantic identity", () => {
    const { container, rerender } = render(<IonDistribution />);
    const readLane = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>("[data-mobile-lane]"),
      ).map((ion) => ({
        lane: ion.dataset.mobileLane,
        region: ion.parentElement?.dataset.freeIonRegion,
        species: ion.dataset.freeIonSpecies,
        x: ion.style.getPropertyValue("--free-ion-x"),
        y: ion.style.getPropertyValue("--free-ion-y"),
      }));

    expect(readLane()).toEqual([
      {
        lane: "inside-channel-clear",
        region: "inside",
        species: "potassium",
        x: "14%",
        y: "12%",
      },
    ]);

    rerender(<IonDistribution />);
    expect(readLane()).toEqual([
      {
        lane: "inside-channel-clear",
        region: "inside",
        species: "potassium",
        x: "14%",
        y: "12%",
      },
    ]);
  });

  it("places inside ions on deterministic lanes clear of overlays and streams", () => {
    const { container } = render(<IonDistribution />);
    const insideIons = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-free-ion-region="inside"] [data-free-ion-species]',
      ),
    ).map((ion) => ({
      species: ion.dataset.freeIonSpecies,
      x: ion.style.getPropertyValue("--free-ion-x"),
      y: ion.style.getPropertyValue("--free-ion-y"),
    }));

    expect(insideIons).toEqual([
      { species: "potassium", x: "14%", y: "12%" },
      { species: "potassium", x: "14%", y: "38%" },
      { species: "potassium", x: "43%", y: "12%" },
      { species: "potassium", x: "43%", y: "38%" },
      { species: "potassium", x: "57%", y: "12%" },
      { species: "potassium", x: "57%", y: "38%" },
      { species: "potassium", x: "86%", y: "12%" },
      { species: "potassium", x: "86%", y: "38%" },
      { species: "sodium", x: "71%", y: "12%" },
      { species: "sodium", x: "71%", y: "38%" },
    ]);
  });
});
