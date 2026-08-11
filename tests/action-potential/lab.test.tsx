import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";

describe("ActionPotentialLab", () => {
  let callbacks = new Map<number, FrameRequestCallback>();
  let id = 0;
  const runNextFrame = (now: number) => {
    const [frameId, callback] = callbacks.entries().next().value!;
    callbacks.delete(frameId);
    act(() => callback(now));
  };

  beforeEach(() => {
    callbacks = new Map();
    id = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        id += 1;
        callbacks.set(id, callback);
        return id;
      }),
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((frameId: number) => callbacks.delete(frameId)),
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("starts in resting mode with exactly three mode buttons", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByRole("button", { name: /静息电位/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByLabelText("动作电位三个模式").querySelectorAll("button"),
    ).toHaveLength(3);
  });

  it("switches the scene and knowledge card for every mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    expect(screen.getByLabelText("动作电位产生动态示意")).toBeInTheDocument();
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("Na⁺内流");
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute(
      "data-phase",
      "excited",
    );
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
  });

  it("loops generation from the excited hold back to stimulus", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));

    runNextFrame(0);
    runNextFrame(5999);
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
      "data-phase",
      "excited",
    );

    runNextFrame(6001);
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
      "data-phase",
      "stimulus",
    );
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(callbacks.size).toBe(1);
    expect(screen.getByLabelText("当前模式知识卡")).not.toHaveTextContent(
      /K⁺|恢复/,
    );
  });

  it("continues the next generation cycle after wrapping", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));

    runNextFrame(0);
    runNextFrame(6001);
    runNextFrame(7001);

    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
      "data-phase",
      "sodium-channel-opening",
    );
    expect(callbacks.size).toBe(1);
  });

  it("waits for next-step clicks between conduction macro steps", () => {
    const { container } = render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));

    expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute(
      "data-phase",
      "excited",
    );
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(1);
    expect(callbacks.size).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute(
      "data-phase",
      "local-current",
    );
    expect(screen.getByRole("button", { name: "下一步" })).toBeDisabled();
    runNextFrame(0);
    runNextFrame(700);
    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
    expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);
    expect(callbacks.size).toBe(0);
  });

  it("plays one adjacent action potential and stops", () => {
    const { container } = render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    runNextFrame(0);
    runNextFrame(700);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    runNextFrame(0);
    runNextFrame(300);
    expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute(
      "data-phase",
      "neighbor-sodium-in",
    );
    expect(
      container.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(12);
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(1);

    runNextFrame(1150);
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(3);
    runNextFrame(1400);
    expect(screen.getByRole("button", { name: "下一步" })).toBeEnabled();
    expect(callbacks.size).toBe(0);
  });

  it("resets generation progress when the user returns to that mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    runNextFrame(0);
    runNextFrame(3000);
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
      "data-phase",
      "sodium-in",
    );
    fireEvent.click(screen.getByRole("button", { name: /静息电位/ }));
    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    expect(screen.getByLabelText("动作电位产生动态示意")).toHaveAttribute(
      "data-phase",
      "stimulus",
    );
  });

  it("pauses and replays the current mode", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "暂停" }));
    expect(callbacks.size).toBe(0);
    expect(screen.getByLabelText("静息电位动态示意")).toHaveAttribute(
      "data-playing",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "重新播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.getByLabelText("静息电位动态示意")).toHaveAttribute(
      "data-playing",
      "true",
    );
  });

  it("restarts mounted potassium and current animations without remounting the fiber", () => {
    const { container } = render(<ActionPotentialLab />);
    const fiber = screen.getByTestId("shared-fiber");
    const segments = Array.from(
      container.querySelectorAll("[data-segment-id]"),
    );
    const potassiumStreams = Array.from(
      container.querySelectorAll('[data-ion-species="potassium"]'),
    );
    const potassiumChannels = Array.from(
      container.querySelectorAll('[data-channel-species="potassium"]'),
    );

    expect(potassiumStreams).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "重新播放" }));
    expect(screen.getByTestId("shared-fiber")).toBe(fiber);
    const replayedSegments = Array.from(
      container.querySelectorAll("[data-segment-id]"),
    );
    expect(replayedSegments).toHaveLength(segments.length);
    replayedSegments.forEach((segment, index) =>
      expect(segment).toBe(segments[index]),
    );
    const replayedPotassiumChannels = Array.from(
      container.querySelectorAll('[data-channel-species="potassium"]'),
    );
    expect(replayedPotassiumChannels).toHaveLength(2);
    expect(replayedPotassiumChannels[0]).toBe(potassiumChannels[0]);
    expect(replayedPotassiumChannels[1]).toBe(potassiumChannels[1]);
    const replayedPotassiumStreams = Array.from(
      container.querySelectorAll('[data-ion-species="potassium"]'),
    );
    expect(replayedPotassiumStreams).toHaveLength(2);
    expect(replayedPotassiumStreams[0]).not.toBe(potassiumStreams[0]);
    expect(replayedPotassiumStreams[1]).not.toBe(potassiumStreams[1]);

    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    const currentArc = container.querySelector("[data-current-arc]");
    fireEvent.click(screen.getByRole("button", { name: "重新演示" }));
    expect(screen.getByTestId("shared-fiber")).toBe(fiber);
    const conductionSegments = Array.from(
      container.querySelectorAll("[data-segment-id]"),
    );
    expect(conductionSegments).toHaveLength(segments.length);
    conductionSegments.forEach((segment, index) =>
      expect(segment).toBe(segments[index]),
    );
    expect(currentArc).toBeTruthy();
    expect(container.querySelector("[data-current-arc]")).toBeNull();
  });

  it("removes all voltage and advanced experiment UI", () => {
    render(<ActionPotentialLab />);
    expect(document.body).not.toHaveTextContent(/mV|−70|-70/);
    expect(screen.queryByText(/膜电位曲线/)).not.toBeInTheDocument();
    for (const name of [
      "打开进阶模式",
      "弱刺激",
      "教学时间",
      "记录电极位置",
      "上一步",
    ]) {
      expect(screen.queryByText(name)).not.toBeInTheDocument();
    }
  });

  it("uses representative static ion frames with disabled playback for reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    render(<ActionPotentialLab />);
    expect(callbacks.size).toBe(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(screen.getByLabelText("静息电位动态示意")).toHaveAttribute(
      "data-playing",
      "false",
    );
    expect(
      screen.getByText("K⁺外流，膜两侧保持外正内负"),
    ).toHaveAttribute("aria-live", "polite");
    const playButton = screen.getByRole("button", { name: "播放" });
    const replayButton = screen.getByRole("button", { name: "重新播放" });
    expect(playButton).toBeDisabled();
    expect(replayButton).toBeDisabled();
    fireEvent.click(playButton);
    fireEvent.click(replayButton);
    expect(callbacks.size).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /动作电位产生/ }));
    const generationScene = screen.getByLabelText("动作电位产生动态示意");
    expect(generationScene).toHaveAttribute("data-phase", "sodium-in");
    expect(
      generationScene.querySelectorAll(
        '[data-channel-species="sodium"][data-open="true"]',
      ),
    ).toHaveLength(2);
    expect(
      generationScene.querySelectorAll('[data-ion-species="sodium"]'),
    ).toHaveLength(2);
    expect(
      generationScene.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(6);
    expect(
      screen.getByLabelText("Na⁺经第4膜段上膜进入膜内"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Na⁺经第4膜段下膜进入膜内"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "播放" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "重新播放" })).toBeDisabled();
    expect(callbacks.size).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    const conductionScene = screen.getByLabelText("动作电位传导动态示意");
    expect(conductionScene).toHaveAttribute("data-phase", "excited");
    expect(
      Array.from(
        conductionScene.querySelectorAll('[data-segment-polarity="excited"]'),
      ).map((segment) => segment.getAttribute("data-segment-id")),
    ).toEqual(["3"]);
    const nextButton = screen.getByRole("button", { name: "下一步" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(screen.getByLabelText("局部电流方向")).toBeInTheDocument();
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(conductionScene).toHaveAttribute("data-phase", "neighbor-excited");
    expect(
      Array.from(
        conductionScene.querySelectorAll('[data-segment-polarity="excited"]'),
      ).map((segment) => segment.getAttribute("data-segment-id")),
    ).toEqual(["2", "3", "4"]);
    expect(
      conductionScene.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(0);
    expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
    expect(nextButton).toBeEnabled();
    expect(screen.getByRole("button", { name: "重新演示" })).toBeEnabled();
    expect(callbacks.size).toBe(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
