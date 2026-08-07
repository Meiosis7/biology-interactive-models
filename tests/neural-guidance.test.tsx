import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AdvancedPanel,
  NeuralLearningGuide,
} from "../components/neural-guidance/NeuralLearningGuide";

describe("neural learning guidance", () => {
  it("marks the current plain-language learning step", () => {
    render(
      <NeuralLearningGuide
        goal="看懂信号变化"
        steps={["操作", "观察", "结论"]}
        currentStep={1}
        takeaway="信号会传递"
      />,
    );

    expect(screen.getByText("本页只需看懂：看懂信号变化")).toBeInTheDocument();
    expect(screen.getByText("观察")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("一句话结论：信号会传递")).toBeInTheDocument();
  });

  it("keeps advanced controls out of the page until requested", () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <AdvancedPanel
        id="demo-advanced"
        expanded={false}
        onExpandedChange={onExpandedChange}
      >
        <p>复杂控制</p>
      </AdvancedPanel>,
    );

    expect(screen.queryByText("复杂控制")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);

    rerender(
      <AdvancedPanel
        id="demo-advanced"
        expanded
        onExpandedChange={onExpandedChange}
      >
        <p>复杂控制</p>
      </AdvancedPanel>,
    );
    expect(screen.getByText("复杂控制")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "收起进阶模式" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
