import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(
      within(screen.getByLabelText("当前阶段解释")).getByRole("heading", {
        name: "去极化",
      }),
    ).toBeInTheDocument();
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

  it("includes a weak-stimulus local-potential question in the quiz sequence", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));
    fireEvent.click(screen.getByRole("button", { name: "下一题位置" }));

    expect(screen.getByText(/观察弱刺激曲线/)).toBeInTheDocument();
    expect(screen.getByLabelText("阶段播报：局部电位")).toHaveTextContent("局部电位");

    fireEvent.click(screen.getByRole("button", { name: "局部电位" }));
    fireEvent.click(screen.getByRole("button", { name: "提交判断" }));
    expect(screen.getByText(/判断正确/)).toBeInTheDocument();
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

  it("announces only submitted quiz feedback as a polite status", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));

    const quizPanel = screen.getByText(/辨析模式 · 已答对/).closest("section");
    expect(quizPanel).not.toBeNull();
    const quiz = within(quizPanel!);
    const score = quiz.getByText(/辨析模式 · 已答对/);
    const voltagePrompt = quiz.getByText(/当前游标.*mV/);
    const numericExplanation = within(screen.getByLabelText("当前阶段解释"))
      .getByText(/mV；膜内相对/);

    expect(quizPanel).not.toHaveAttribute("aria-live");
    expect(score.closest("[aria-live]")).toBeNull();
    expect(voltagePrompt.closest("[aria-live]")).toBeNull();
    expect(numericExplanation.closest("[aria-live]")).toBeNull();
    expect(quiz.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(quiz.getByRole("button", { name: "提交判断" }));

    const statuses = quiz.getAllByRole("status");
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute("aria-live", "polite");
    expect(statuses[0]).toHaveAttribute("aria-atomic", "true");
    expect(statuses[0]).toHaveTextContent(/^判断正确。/);
    expect(quizPanel?.querySelectorAll("[aria-live]")).toHaveLength(1);
  });

  it("announces only stage transitions instead of live voltage and quiz counts", () => {
    render(<MembraneCurveLab />);

    const explanation = screen.getByLabelText("当前阶段解释");
    const announcer = screen.getByLabelText("阶段播报：静息期");
    expect(explanation).not.toHaveAttribute("aria-live");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveTextContent("静息期");

    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));
    const quizPanel = screen.getByText(/辨析模式 · 已答对/).closest("section");
    expect(quizPanel).not.toHaveAttribute("aria-live");

    fireEvent.change(screen.getByLabelText("曲线游标"), { target: { value: "2.5" } });
    expect(announcer).toHaveTextContent("去极化");
    expect(announcer).toHaveAccessibleName("阶段播报：去极化");
  });
});
