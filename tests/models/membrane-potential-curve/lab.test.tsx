import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";
import { canvasContext, resetCanvasContext } from "../../setup";

describe("MembraneCurveLab", () => {
  it("synchronizes cursor and ion explanation", () => {
    render(<MembraneCurveLab />);

    fireEvent.change(screen.getByLabelText("曲线游标"), {
      target: { value: "2.5" },
    });

    expect(screen.getByText("Na⁺ 内流")).toBeInTheDocument();
    expect(screen.getByText(/去极化/)).toBeInTheDocument();
  });

  it("overlays equal threshold and strong peaks", () => {
    render(<MembraneCurveLab />);

    fireEvent.click(screen.getByRole("button", { name: "对比模式" }));

    expect(screen.getByText(/峰值相同/)).toBeInTheDocument();
  });

  it("hides the threshold reference when requested", () => {
    render(<MembraneCurveLab />);
    resetCanvasContext();

    fireEvent.click(screen.getByLabelText("显示阈电位线"));

    expect(canvasContext.fillText).not.toHaveBeenCalledWith(
      "-55 mV",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("fills the full current stage while keeping a separate cursor line", () => {
    render(<MembraneCurveLab />);
    resetCanvasContext();

    fireEvent.change(screen.getByLabelText("曲线游标"), {
      target: { value: "2.5" },
    });

    const [fillStart, fillTop, fillWidth, fillHeight] = canvasContext.fillRect.mock.calls.at(-1) ?? [];
    const [cursorX, cursorY] = canvasContext.moveTo.mock.calls.at(-1) ?? [];
    expect(fillStart).toBeCloseTo(272);
    expect(fillTop).toBe(22);
    expect(fillWidth).toBeCloseTo(102);
    expect(fillHeight).toBe(270);
    expect(cursorX).toBeCloseTo(323);
    expect(cursorY).toBe(22);
  });

  it("uses the complete local-potential interval for weak stimulation", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    resetCanvasContext();

    fireEvent.change(screen.getByLabelText("曲线游标"), {
      target: { value: "2.5" },
    });

    const [fillStart, , fillWidth] = canvasContext.fillRect.mock.calls.at(-1) ?? [];
    expect(fillStart).toBeCloseTo(170);
    expect(fillWidth).toBeCloseTo(306);
  });

  it("hides the membrane ion hint when requested", () => {
    render(<MembraneCurveLab />);
    fireEvent.change(screen.getByLabelText("曲线游标"), {
      target: { value: "2.5" },
    });

    expect(screen.getByText("离子提示：Na⁺ 内流")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("显示离子提示"));
    expect(screen.queryByText("离子提示：Na⁺ 内流")).not.toBeInTheDocument();
  });

  it("shows the quiz controls", () => {
    render(<MembraneCurveLab />);

    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));

    expect(screen.getByRole("group", { name: "阶段选择" })).toBeInTheDocument();
  });

  it("grades quiz polarity from the live cursor snapshot", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));
    fireEvent.change(screen.getByLabelText("曲线游标"), {
      target: { value: "2.1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "去极化" }));
    fireEvent.click(screen.getByRole("button", { name: "Na⁺ 内流" }));
    fireEvent.click(screen.getByRole("button", { name: "膜内相对负" }));
    fireEvent.click(screen.getByRole("button", { name: "提交判断" }));

    expect(screen.getByText(/判断正确/)).toBeInTheDocument();
  });

  it("counts a correctly answered quiz location only once", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));
    fireEvent.change(screen.getByLabelText("曲线游标"), { target: { value: "2.1" } });
    fireEvent.click(screen.getByRole("button", { name: "去极化" }));
    fireEvent.click(screen.getByRole("button", { name: "Na⁺ 内流" }));
    fireEvent.click(screen.getByRole("button", { name: "膜内相对负" }));
    fireEvent.click(screen.getByRole("button", { name: "提交判断" }));
    fireEvent.click(screen.getByRole("button", { name: "提交判断" }));

    expect(screen.getByText(/已答对 1 题/)).toBeInTheDocument();
  });
});
