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
    expect(screen.getByLabelText("局部电流方向")).toBeInTheDocument();
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

  it("stops conduction with all seven segments excited", () => {
    const { container } = render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    runNextFrame(0);
    runNextFrame(7000);
    expect(screen.getByLabelText("动作电位传导动态示意")).toHaveAttribute(
      "data-phase",
      "conducted",
    );
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(7);
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(callbacks.size).toBe(0);
  });

  it("restarts completed conduction from the central excited segment", () => {
    const { container } = render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    runNextFrame(0);
    runNextFrame(7000);
    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(1);
    expect(container.querySelector('[data-segment-id="3"]')).toHaveAttribute(
      "data-segment-polarity",
      "excited",
    );
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
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
      "下一步",
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
    ).toHaveLength(1);
    expect(
      generationScene.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(3);
    expect(screen.getByLabelText("Na⁺进入第4膜段")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "播放" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "重新播放" })).toBeDisabled();
    expect(callbacks.size).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /动作电位传导/ }));
    const conductionScene = screen.getByLabelText("动作电位传导动态示意");
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
    expect(screen.getByRole("button", { name: "播放" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "重新播放" })).toBeDisabled();
    expect(callbacks.size).toBe(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
