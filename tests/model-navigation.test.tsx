import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelNav } from "../components/model-shell/ModelNav";

describe("ModelNav", () => {
  it("links back to the hub and adjacent models", () => {
    render(<ModelNav currentSlug="action-potential" />);

    expect(screen.getByRole("link", { name: "全部模型" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /上一个：细胞免疫/ })).toHaveAttribute(
      "href",
      "/models/cellular-immunity",
    );
    expect(screen.getByRole("link", { name: /下一个：突触传递/ })).toHaveAttribute(
      "href",
      "/models/synapse-transmission",
    );
  });
});
