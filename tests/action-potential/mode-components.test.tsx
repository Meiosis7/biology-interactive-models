import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential shared-fiber components", () => {
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

  it("shows opposite extracellular and intracellular current directions", () => {
    render(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", 0.05)}
        playing
      />,
    );
    expect(
      screen.getByLabelText("膜内局部电流向两侧未兴奋区"),
    ).toHaveTextContent("←膜内局部电流→");
    expect(screen.getByLabelText("膜外局部电流返回兴奋区")).toHaveTextContent(
      "→膜外回流←",
    );
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
