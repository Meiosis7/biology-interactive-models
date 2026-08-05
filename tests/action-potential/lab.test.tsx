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

  it("preserves wavefront DOM nodes as their positions update", () => {
    const { container, rerender } = render(
      <AxonView
        time={1}
        settings={settings}
        snapshot={restingSnapshot}
        onElectrodeChange={() => undefined}
      />,
    );
    const initialWavefronts = container.querySelectorAll(".wavefront");

    rerender(
      <AxonView
        time={2}
        settings={settings}
        snapshot={{ ...restingSnapshot, wavefronts: [0.34, 0.66] }}
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
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "4" } });

    expect(canvasContext.moveTo).toHaveBeenCalledWith(48, expect.closeTo(177.92, 2));
    expect(canvasContext.lineTo).toHaveBeenCalledWith(622, expect.closeTo(177.92, 2));
    expect(canvasContext.lineTo.mock.calls.length).toBeGreaterThan(400);
    expect(canvasContext.lineTo.mock.calls.some(([x, y]) => (
      x > 200 && x < 450 && y < 80
    ))).toBe(true);
    expect(canvasStyles).toContainEqual(["strokeStyle", "rgba(255,209,102,.55)"]);
    expect(canvasStyles).toContainEqual(["strokeStyle", "#ff6b4a"]);
    expect(canvasStyles).toContainEqual(["strokeStyle", "#38d9ff"]);
    expect(canvasStyles).toContainEqual(["lineWidth", 3]);
    expect(canvasStyles).toContainEqual(["lineWidth", 1.5]);
    expect(canvasContext.moveTo).toHaveBeenCalledWith(expect.closeTo(277.6, 2), 18);
    expect(canvasContext.lineTo).toHaveBeenCalledWith(expect.closeTo(277.6, 2), 207);
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
    const canvas = screen.getByLabelText("膜电位曲线") as HTMLCanvasElement;
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
