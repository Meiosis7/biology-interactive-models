import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";

describe("MembraneCurveLab", () => {
  it("keeps every essential experiment control visible", () => {
    render(<MembraneCurveLab />);

    const controls = screen.getByLabelText("实验控制台");
    expect(within(controls).getByRole("button", { name: "弱刺激" })).toBeVisible();
    expect(within(controls).getByRole("button", { name: "阈刺激" })).toBeVisible();
    expect(within(controls).getByRole("button", { name: "强刺激" })).toBeVisible();
    expect(within(controls).getByRole("button", { name: "开始" })).toBeVisible();
    expect(within(controls).getByLabelText("时间轴")).toBeVisible();
    expect(within(controls).getByLabelText("对比曲线")).toBeVisible();
  });

  it("removes the old guidance and quiz surfaces", () => {
    render(<MembraneCurveLab />);

    expect(screen.queryByText("基础引导")).not.toBeInTheDocument();
    expect(screen.queryByText("辨析模式")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "打开进阶模式" })).not.toBeInTheDocument();
    expect(screen.queryByText(/PDF|教材|根据资料/)).not.toBeInTheDocument();
  });

  it("synchronizes the time scrubber with stage and sodium flow", () => {
    render(<MembraneCurveLab />);

    fireEvent.change(screen.getByLabelText("时间轴"), {
      target: { value: "2.5" },
    });

    expect(screen.getByLabelText("当前阶段")).toHaveTextContent("去极化");
    expect(screen.getByLabelText("主要离子运动")).toHaveTextContent("Na⁺ 内流");
    expect(screen.getByLabelText("Na⁺ 通道")).toHaveAttribute("data-open", "true");
    expect(screen.getByLabelText("K⁺ 通道")).toHaveAttribute("data-open", "false");
  });

  it("synchronizes the time scrubber with potassium flow", () => {
    render(<MembraneCurveLab />);

    fireEvent.change(screen.getByLabelText("时间轴"), {
      target: { value: "4.5" },
    });

    expect(screen.getByLabelText("当前阶段")).toHaveTextContent("复极化");
    expect(screen.getByLabelText("主要离子运动")).toHaveTextContent("K⁺ 外流");
    expect(screen.getByLabelText("Na⁺ 通道")).toHaveAttribute("data-open", "false");
    expect(screen.getByLabelText("K⁺ 通道")).toHaveAttribute("data-open", "true");
  });

  it("keeps a clear sodium influx path visible after scrubbing pauses playback", () => {
    render(<MembraneCurveLab />);

    fireEvent.change(screen.getByLabelText("时间轴"), {
      target: { value: "2.5" },
    });

    const sodiumPath = screen.getByLabelText("Na⁺ 内流路径");
    expect(sodiumPath).toBeVisible();
    expect(sodiumPath).toHaveTextContent("Na⁺ 内流");
    expect(sodiumPath.querySelectorAll(".membrane-flow-dot")).toHaveLength(3);
    expect(screen.queryByLabelText("K⁺ 外流路径")).not.toBeInTheDocument();
    expect(sodiumPath.closest(".membrane-scene")).not.toHaveClass("is-playing");
  });

  it("keeps a clear potassium efflux path visible after scrubbing pauses playback", () => {
    render(<MembraneCurveLab />);

    fireEvent.change(screen.getByLabelText("时间轴"), {
      target: { value: "4.5" },
    });

    const potassiumPath = screen.getByLabelText("K⁺ 外流路径");
    expect(potassiumPath).toBeVisible();
    expect(potassiumPath).toHaveTextContent("K⁺ 外流");
    expect(potassiumPath.querySelectorAll(".membrane-flow-dot")).toHaveLength(3);
    expect(screen.queryByLabelText("Na⁺ 内流路径")).not.toBeInTheDocument();
    expect(potassiumPath.closest(".membrane-scene")).not.toHaveClass("is-playing");
  });

  it("shows a subthreshold local potential for weak stimulation", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    fireEvent.change(screen.getByLabelText("时间轴"), {
      target: { value: "2.5" },
    });

    expect(screen.getByLabelText("当前阶段")).toHaveTextContent("局部电位");
    expect(screen.getByLabelText("当前膜电位")).toHaveTextContent("-60 mV");
  });

  it("turns on comparison without leaving the experiment", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByLabelText("对比曲线"));

    expect(screen.getByLabelText("曲线图例")).toHaveTextContent("弱刺激");
    expect(screen.getByLabelText("曲线图例")).toHaveTextContent("阈刺激");
    expect(screen.getByLabelText("曲线图例")).toHaveTextContent("强刺激");
    expect(screen.getByLabelText("对比结论")).toHaveTextContent("峰值相同");
  });

  it("starts and pauses the animation from one control", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(screen.getByRole("button", { name: "继续" })).toBeInTheDocument();
  });

  it("advances the curve after playback starts", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const { unmount } = render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始" }));

    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(frames).toHaveLength(1);

    act(() => frames.shift()!(1000));
    act(() => frames.shift()!(2000));

    expect(screen.getByText("1.0")).toBeVisible();

    unmount();
    vi.unstubAllGlobals();
  });

  it("provides a clickable explanation for every action-potential step", () => {
    render(<MembraneCurveLab />);

    const guide = screen.getByLabelText("分步过程解释");
    expect(within(guide).getAllByRole("button")).toHaveLength(7);
    expect(within(guide).getByRole("button", { name: "步骤 3 去极化" })).toBeVisible();
    expect(within(guide).getByRole("button", { name: "步骤 5 复极化" })).toBeVisible();
    expect(within(guide).getByRole("button", { name: "步骤 6 超极化" })).toBeVisible();
    expect(within(guide).getByRole("button", { name: "步骤 7 恢复静息" })).toBeVisible();
  });

  it("jumps to hyperpolarization and explains its cause", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "步骤 6 超极化" }));

    expect(screen.getByLabelText("当前阶段")).toHaveTextContent("超极化");
    expect(screen.getByLabelText("当前步骤解释")).toHaveTextContent("K⁺ 通道关闭较慢");
    expect(screen.getByLabelText("当前步骤解释")).toHaveTextContent("K⁺ 继续外流");
    expect(screen.getByLabelText("当前步骤解释")).toHaveTextContent("低于静息电位");
  });

  it("jumps to recovery and explains the return to resting potential", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "步骤 7 恢复静息" }));

    expect(screen.getByLabelText("当前阶段")).toHaveTextContent("恢复静息");
    expect(screen.getByLabelText("当前步骤解释")).toHaveTextContent("逐渐关闭");
    expect(screen.getByLabelText("当前步骤解释")).toHaveTextContent("−70 mV");
  });

  it("exposes the curve as a direct time interaction surface", () => {
    render(<MembraneCurveLab />);

    expect(screen.getByLabelText("在曲线上拖动时间")).toHaveAttribute("data-interactive", "true");
  });

  it("tells learners that playback forms the curve progressively", () => {
    render(<MembraneCurveLab />);

    expect(screen.getByText("播放形成曲线，也可拖动回看")).toBeVisible();
  });
});
