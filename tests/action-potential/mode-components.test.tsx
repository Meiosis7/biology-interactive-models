import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential shared-fiber components", () => {
  it("uses the approved ion and relay teaching summaries", () => {
    expect(ACTION_POTENTIAL_MODES[0].summary).toContain("K⁺外流");
    expect(ACTION_POTENTIAL_MODES[1].summary).toContain("局部Na⁺通道开放");
    expect(ACTION_POTENTIAL_MODES[2].summary).toContain(
      "相邻Na⁺通道依次开放",
    );
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(
      /曲线|mV|−70|-70|复极化|超极化|恢复/,
    );
  });

  it("announces the selected mode and reports clicks", () => {
    const onModeChange = vi.fn();
    render(
      <ActionPotentialModeNav mode="resting" onModeChange={onModeChange} />,
    );
    expect(screen.getByRole("button", { name: "静息电位" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "动作电位产生" }));
    expect(onModeChange).toHaveBeenCalledWith("generation");
  });

  it("preserves one shared fiber node while mode overlays change", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );
    const sharedFiber = screen.getByTestId("shared-fiber");
    const centralSegment = container.querySelector('[data-segment-id="3"]');
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 1)}
        playing={false}
      />,
    );
    expect(screen.getByTestId("shared-fiber")).toBe(sharedFiber);
    expect(container.querySelector('[data-segment-id="3"]')).toBe(
      centralSegment,
    );
    expect(screen.getByLabelText("第4膜段外负内正")).toBeInTheDocument();
    expect(screen.queryByText("K⁺外流")).not.toBeInTheDocument();
    expect(screen.queryByText(/恢复/)).not.toBeInTheDocument();
  });

  it("renders seven semantic segments inside one shared fiber", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0)}
        playing
      />,
    );
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    expect(container.querySelectorAll("[data-segment-id]")).toHaveLength(7);
    expect(
      container.querySelectorAll('[data-segment-polarity="resting"]'),
    ).toHaveLength(7);
    expect(
      container.querySelectorAll('[data-channel-species="sodium"]'),
    ).toHaveLength(7);
  });

  it("opens and excites only the central segment during generation", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.25)}
        playing
      />,
    );
    expect(
      container.querySelectorAll(
        '[data-channel-species="sodium"][data-open="true"]',
      ),
    ).toHaveLength(1);
    expect(
      container.querySelector(
        '[data-segment-id="3"] [data-channel-species="sodium"]',
      ),
    ).toHaveAttribute("data-open", "true");
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.9)}
        playing={false}
      />,
    );
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(1);
    expect(container.querySelector('[data-segment-id="3"]')).toHaveAttribute(
      "data-segment-polarity",
      "excited",
    );
  });

  it("builds every ion channel from left and right petals around one pore", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.25)}
        playing
      />,
    );

    const channel = container.querySelector(
      '[data-segment-id="3"] [data-channel-species="sodium"]',
    );
    expect(channel).toHaveAttribute("data-open", "true");
    expect(channel?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
    expect(channel?.querySelector('[data-channel-petal="left"]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-petal="right"]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-pore]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-petal="top"]')).toBeNull();
    expect(channel?.querySelector('[data-channel-petal="bottom"]')).toBeNull();
  });

  it("uses the same horizontal-petal channel structure for potassium", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    const potassium = container.querySelector(
      '[data-channel-species="potassium"]',
    );
    expect(potassium).toHaveAttribute("data-open", "true");
    expect(potassium?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
    expect(
      potassium?.querySelector('[data-channel-petal="left"]'),
    ).toBeTruthy();
    expect(
      potassium?.querySelector('[data-channel-petal="right"]'),
    ).toBeTruthy();
  });

  it("positions the potassium channel away from the sodium channel", () => {
    const stylesheet = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );

    expect(stylesheet).toMatch(
      /\.ap-ion-channel--potassium\s*\{[^}]*left:\s*76%;/s,
    );
  });

  it("shows a potassium gate and potassium flow only while resting", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    expect(
      container.querySelector('[data-channel-species="potassium"]'),
    ).toHaveAttribute("data-open", "true");
    expect(screen.getByLabelText("K⁺外流")).toBeInTheDocument();

    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );
    expect(
      container.querySelector('[data-channel-species="potassium"]'),
    ).toBeNull();
    expect(screen.queryByLabelText("K⁺外流")).not.toBeInTheDocument();
  });

  it("renders three staggerable sodium particles through the active pore", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );

    const stream = screen.getByLabelText("Na⁺进入第4膜段");
    expect(stream).toHaveAttribute("data-ion-direction", "inward");
    expect(stream).toHaveAttribute("data-ion-species", "sodium");
    expect(
      stream.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-ion-particle="potassium"]'),
    ).toHaveLength(0);
  });

  it("renders three outward potassium particles only in resting mode", () => {
    render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    const stream = screen.getByLabelText("K⁺外流");
    expect(stream).toHaveAttribute("data-ion-direction", "outward");
    expect(
      stream.querySelectorAll('[data-ion-particle="potassium"]'),
    ).toHaveLength(3);
  });

  it("renders opposite animated paths for intracellular and extracellular current", () => {
    render(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", 0.05)}
        playing
      />,
    );

    const inside = screen.getByLabelText("膜内局部电流向两侧未兴奋区");
    const outside = screen.getByLabelText("膜外局部电流返回兴奋区");
    expect(inside).toHaveAttribute("data-current-direction", "outward");
    expect(outside).toHaveAttribute("data-current-direction", "inward");
    expect(inside.querySelectorAll("[data-current-branch]")).toHaveLength(2);
    expect(outside.querySelectorAll("[data-current-branch]")).toHaveLength(2);
    expect(inside).toHaveTextContent("膜内局部电流");
    expect(outside).toHaveTextContent("膜外回流");
  });

  it("shows the approved conduction statement and the active phase caption", () => {
    const firstFrame = getActionPotentialFrame("conduction", 0.05);
    const { rerender } = render(
      <ActionPotentialScene mode="conduction" frame={firstFrame} playing />,
    );

    expect(
      screen.getByText("兴奋由刺激点向两侧逐段传导"),
    ).toBeInTheDocument();
    expect(screen.getByText(firstFrame.instruction)).toBeInTheDocument();
    expect(screen.queryByText("兴奋区移动")).not.toBeInTheDocument();
    expect(screen.queryByText("动作电位整体平移")).not.toBeInTheDocument();

    const nextFrame = getActionPotentialFrame("conduction", 0.18);
    rerender(
      <ActionPotentialScene mode="conduction" frame={nextFrame} playing />,
    );
    expect(screen.getByText(nextFrame.instruction)).toBeInTheDocument();
    expect(screen.queryByText(firstFrame.instruction)).not.toBeInTheDocument();
  });

  it("shows the completed conduction state without unexcited regions", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", 1)}
        playing={false}
      />,
    );

    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(7);
    expect(screen.queryAllByText("未兴奋区")).toHaveLength(0);
    expect(screen.getByText("全部膜段已兴奋")).toBeInTheDocument();
  });

  it("renders the exact generation knowledge facts without recovery", () => {
    render(
      <ActionPotentialKnowledgeCard content={ACTION_POTENTIAL_MODES[1]} />,
    );
    const card = screen.getByLabelText("当前模式知识卡");
    expect(card).toHaveTextContent("Na⁺通道开放");
    expect(card).toHaveTextContent("Na⁺内流");
    expect(card).toHaveTextContent("外负内正");
    expect(card).not.toHaveTextContent(/K⁺|恢复/);
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
