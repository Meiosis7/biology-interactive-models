import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelHub } from "../components/model-shell/ModelHub";

describe("ModelHub", () => {
  it("renders six accessible model links", () => {
    render(<ModelHub />);

    expect(screen.getAllByRole("link", { name: /进入模型/ })).toHaveLength(6);
  });

  it("shows all model titles", () => {
    render(<ModelHub />);

    for (const title of [
      "动作电位",
      "突触传递",
      "膜电位变化曲线",
      "电表指针偏转",
      "体液免疫",
      "细胞免疫",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
