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
