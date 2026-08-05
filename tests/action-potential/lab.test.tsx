import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";
import { AxonView } from "../../components/action-potential/AxonView";
import type { ExperimentSettings, SimulationSnapshot } from "../../components/action-potential/types";
import { canvasContext, canvasStyles, resetCanvasContext } from "../setup";

const settings: ExperimentSettings = {
  intensity: "threshold",
  stimulusPosition: 0.5,
  electrodePosition: 0.72,
};

const restingSnapshot: SimulationSnapshot = {
  stage: "resting",
  ionFlow: "none",
  membranePotential: -70,
  propagating: true,
  wavefronts: [0.5, 0.5],
  arrivalTime: 1,
  localTime: 0,
};

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
    resetCanvasContext();
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
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "左侧刺激" }));
    expect(screen.getByLabelText("教学时间")).toHaveValue("0");
  });

  it("shows that a weak stimulus does not propagate", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.52" } });
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "0.5" } });
    expect(screen.getByText("局部电位")).toBeInTheDocument();
    expect(screen.getByText(/未形成可传导的动作电位/)).toBeInTheDocument();
  });

  it("moves one fixed step with the next button", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByLabelText("教学时间")).toHaveValue("0.5");
  });

  it("disables step controls at both bounds and clamps timeline time", () => {
    render(<ActionPotentialLab />);
    const previous = screen.getByRole("button", { name: "上一步" });
    const next = screen.getByRole("button", { name: "下一步" });

    expect(previous).toBeDisabled();
    expect(next).not.toBeDisabled();
    const timeline = screen.getByLabelText("教学时间");
    fireEvent.change(timeline, { target: { value: timeline.getAttribute("max") } });
    expect(timeline).toHaveValue(timeline.getAttribute("max"));
    expect(previous).not.toBeDisabled();
    expect(next).toBeDisabled();
  });

  it("keeps visual consumers and stage copy synchronized after timeline and electrode changes", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });
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
    expect(screen.getByLabelText(/膜电位曲线.*阈电位参考.*教学时间/)).toBeInTheDocument();
    expect(screen.getByText("中部刺激：兴奋向两侧传播")).toBeInTheDocument();
    expect(screen.getByText("横轴：教学时间（时间单位）")).toBeInTheDocument();
    expect(screen.getByText("阈电位参考：−55 mV")).toBeInTheDocument();
    expect(screen.getByText("当前阶段：静息状态")).toBeInTheDocument();
    expect(screen.getByText(/不对应真实生理秒数/)).toBeInTheDocument();
  });

  it("preserves wavefront DOM nodes as their positions update", () => {
    const { container, rerender } = render(
      <AxonView
        time={1}
        settings={settings}
        snapshot={restingSnapshot}
        playing={false}
        onElectrodeChange={() => undefined}
      />,
    );
    const initialWavefronts = container.querySelectorAll(".wavefront");

    rerender(
      <AxonView
        time={2}
        settings={settings}
        snapshot={{ ...restingSnapshot, wavefronts: [0.34, 0.66] }}
        playing={false}
        onElectrodeChange={() => undefined}
      />,
    );

    const updatedWavefronts = container.querySelectorAll(".wavefront");
    expect(updatedWavefronts[0]).toBe(initialWavefronts[0]);
    expect(updatedWavefronts[1]).toBe(initialWavefronts[1]);
  });

  it("draws reference levels, simulation trace, and the current-time cursor", () => {
    render(<ActionPotentialLab />);
    resetCanvasContext();
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });

    expect(canvasContext.moveTo).toHaveBeenCalledWith(88, expect.closeTo(166.08, 2));
    expect(canvasContext.lineTo).toHaveBeenCalledWith(622, expect.closeTo(166.08, 2));
    expect(canvasContext.lineTo.mock.calls.length).toBeGreaterThan(400);
    expect(canvasContext.lineTo.mock.calls.some(([x, y]) => (
      x > 200 && x < 450 && y < 80
    ))).toBe(true);
    expect(canvasStyles).toContainEqual(["strokeStyle", "rgba(255,209,102,.55)"]);
    expect(canvasStyles).toContainEqual(["strokeStyle", "#ff6b4a"]);
    expect(canvasStyles).toContainEqual(["strokeStyle", "#38d9ff"]);
    expect(canvasStyles).toContainEqual(["lineWidth", 3]);
    expect(canvasStyles).toContainEqual(["lineWidth", 1.5]);
    expect(canvasContext.fillText).toHaveBeenCalledWith(
      "阈电位 −55 mV",
      4,
      expect.closeTo(149.88, 2),
    );
    expect(canvasContext.fillText).toHaveBeenCalledWith("0", 80, 223);
    expect(canvasContext.fillText).toHaveBeenCalledWith("4.3", 347, 223);
    expect(canvasContext.fillText).toHaveBeenCalledWith("8.5", 610, 223);
    expect(canvasContext.moveTo).toHaveBeenCalledWith(expect.closeTo(339.29, 2), 18);
    expect(canvasContext.lineTo).toHaveBeenCalledWith(expect.closeTo(339.29, 2), 193);
  });

  it("redraws the chart at its new CSS size after observing a resize", () => {
    const observers: Array<{ callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn>; observe: ReturnType<typeof vi.fn> }> = [];
    vi.stubGlobal("ResizeObserver", class {
      callback: ResizeObserverCallback;
      disconnect = vi.fn();
      observe = vi.fn();

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
    });
    vi.stubGlobal("devicePixelRatio", 2);

    const { unmount } = render(<ActionPotentialLab />);
    const canvas = screen.getByLabelText(/膜电位曲线.*阈电位参考.*教学时间/) as HTMLCanvasElement;
    Object.defineProperty(canvas, "clientWidth", { configurable: true, value: 320 });
    Object.defineProperty(canvas, "clientHeight", { configurable: true, value: 120 });
    resetCanvasContext();
    expect(observers).toHaveLength(1);
    const [observer] = observers;

    act(() => observer.callback([], observer as unknown as ResizeObserver));

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(240);
    expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, 320, 120);
    expect(canvasContext.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(observer.observe).toHaveBeenCalledWith(canvas);
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("resets the experiment when the recording electrode moves", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.9" } });
    expect(screen.getByLabelText("教学时间")).toHaveValue("0");
  });

  it("advances experiment time while playing", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始刺激" }));
    act(() => runFrame(1_000));
    act(() => runFrame(1_500));
    expect(screen.getByLabelText("教学时间")).toHaveValue("0.5");
  });

  it("pauses playback and cancels further animation frames", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "开始刺激" }));
    act(() => runFrame(1_000));
    act(() => runFrame(5_000));
    expect(document.querySelectorAll(".ion.moving-in").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(frames).toHaveLength(0);
    expect(document.querySelectorAll(".ion.moving-in")).toHaveLength(0);
    act(() => runFrame(6_000));
    expect(screen.getByLabelText("教学时间")).toHaveValue("4");
  });

  it("stops playback at the experiment duration", () => {
    render(<ActionPotentialLab />);
    const timeline = screen.getByLabelText("教学时间");
    const duration = Number(timeline.getAttribute("max"));
    fireEvent.change(timeline, { target: { value: String(duration - 0.1) } });
    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    act(() => runFrame(1_000));
    act(() => runFrame(1_200));
    expect(screen.getByLabelText("教学时间")).toHaveValue(String(duration));
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
    expect(frames).toHaveLength(0);
  });

  it("expands the teaching timeline for an extreme recording distance", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "左侧刺激" }));
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "1" } });

    expect(Number(screen.getByLabelText("教学时间").getAttribute("max"))).toBeGreaterThan(12.5);
  });

  it("shows a weak local sodium-channel response near the stimulus with a distant electrode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.9" } });
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "0.5" } });

    expect(screen.getByText("静息状态")).toBeInTheDocument();
    expect(document.querySelectorAll(".sodium-channel.open").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".wavefront")).toHaveLength(0);
  });

  it("advances sodium-channel opening sequentially along the fiber", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "左侧刺激" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3" } });

    const sodiumChannels = document.querySelectorAll(".sodium-channel");
    expect(sodiumChannels[0]).toHaveClass("open");
    expect(sodiumChannels[1]).toHaveClass("closed");
  });

  it("keeps ion motion static while the timeline is scrubbed", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });

    expect(screen.getByText("去极化")).toBeInTheDocument();
    expect(document.querySelectorAll(".ion.moving-in")).toHaveLength(0);
  });
});
