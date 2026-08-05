import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";

describe("ActionPotentialLab", () => {
  let animationFrameId = 0;
  let frames = new Map<number, FrameRequestCallback>();

  const runFrame = (time: number) => {
    const frame = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
    if (!frame) return;
    frames.delete(frame[0]);
    frame[1](time);
  };

  beforeEach(() => {
    animationFrameId = 0;
    frames = new Map();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrameId += 1;
      frames.set(animationFrameId, callback);
      return animationFrameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts with the resting state", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByText("静息状态")).toBeInTheDocument();
    expect(screen.getByText("-70 mV")).toBeInTheDocument();
  });

  it("resets time when experiment settings change", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "左侧刺激" }));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0");
  });

  it("shows that a weak stimulus does not propagate", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.52" } });
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "0.5" } });
    expect(screen.getByText("局部电位")).toBeInTheDocument();
    expect(screen.getByText(/未形成可传导的动作电位/)).toBeInTheDocument();
  });

  it("moves one fixed step with the next button", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0.5");
  });

  it("disables step controls at both bounds and clamps timeline time", () => {
    render(<ActionPotentialLab />);
    const previous = screen.getByRole("button", { name: "上一步" });
    const next = screen.getByRole("button", { name: "下一步" });

    expect(previous).toBeDisabled();
    expect(next).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "11" } });
    expect(screen.getByLabelText("实验时间")).toHaveValue("10");
    expect(previous).not.toBeDisabled();
    expect(next).toBeDisabled();
  });

  it("keeps visual consumers and stage copy synchronized after timeline and electrode changes", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "4" } });
    expect(screen.getByRole("img", { name: /当前为depolarization阶段/ })).toBeInTheDocument();
    expect(screen.getByText("-61 mV")).toBeInTheDocument();
    expect(screen.getByText("去极化")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.5" } });
    expect(screen.getByRole("img", { name: /当前为resting阶段/ })).toBeInTheDocument();
    expect(screen.getByText("-70 mV")).toBeInTheDocument();
    expect(screen.getByText("静息状态")).toBeInTheDocument();
  });

  it("labels the experiment condition and synchronized views", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByRole("img", { name: /离体神经纤维/ })).toBeInTheDocument();
    expect(screen.getByLabelText("膜电位曲线")).toBeInTheDocument();
    expect(screen.getByText("中部刺激：兴奋向两侧传播")).toBeInTheDocument();
  });

  it("resets the experiment when the recording electrode moves", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.9" } });
    expect(screen.getByLabelText("实验时间")).toHaveValue("0");
  });

  it("advances experiment time while playing", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始刺激" }));
    act(() => runFrame(1_000));
    act(() => runFrame(1_500));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0.5");
  });

  it("pauses playback and cancels further animation frames", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始刺激" }));
    act(() => runFrame(1_000));
    act(() => runFrame(1_500));
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(frames).toHaveLength(0);
    act(() => runFrame(2_000));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0.5");
  });

  it("stops playback at the experiment duration", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "9.9" } });
    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    act(() => runFrame(1_000));
    act(() => runFrame(1_200));
    expect(screen.getByLabelText("实验时间")).toHaveValue("10");
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
    expect(frames).toHaveLength(0);
  });
});
