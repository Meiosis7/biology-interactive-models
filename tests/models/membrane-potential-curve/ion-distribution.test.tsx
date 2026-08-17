import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";

describe("membrane ion distribution", () => {
  it("shows more potassium inside while keeping extracellular potassium nonzero", () => {
    render(<MembraneCurveLab />);

    const view = screen.getByLabelText("膜两侧离子运动");
    const outside = view.querySelectorAll(
      ".membrane-extracellular .membrane-particle.potassium",
    );
    const inside = view.querySelectorAll(
      ".membrane-intracellular .membrane-particle.potassium",
    );

    expect(outside).toHaveLength(2);
    expect(inside).toHaveLength(5);
    expect(inside.length).toBeGreaterThan(outside.length);
  });

  it("shows more sodium outside while keeping intracellular sodium nonzero", () => {
    render(<MembraneCurveLab />);

    const view = screen.getByLabelText("膜两侧离子运动");
    const outside = view.querySelectorAll(
      ".membrane-extracellular .membrane-particle.sodium",
    );
    const inside = view.querySelectorAll(
      ".membrane-intracellular .membrane-particle.sodium",
    );

    expect(outside).toHaveLength(6);
    expect(inside).toHaveLength(2);
    expect(outside.length).toBeGreaterThan(inside.length);
  });
});
