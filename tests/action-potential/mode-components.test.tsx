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
    const { rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );
    const sharedFiber = screen.getByTestId("shared-fiber");
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 1)}
        playing={false}
      />,
    );
    expect(screen.getByTestId("shared-fiber")).toBe(sharedFiber);
    expect(screen.getByLabelText("兴奋区外负内正")).toBeInTheDocument();
    expect(screen.getByText("Na⁺内流")).toBeInTheDocument();
    expect(screen.queryByText("K⁺外流")).not.toBeInTheDocument();
    expect(screen.queryByText(/恢复/)).not.toBeInTheDocument();
  });

  it("renders two wavefronts and local-current arrows for conduction", () => {
    render(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", 0.35)}
        playing
      />,
    );
    expect(screen.getByLabelText("刺激点")).toBeInTheDocument();
    expect(screen.getByLabelText("局部电流方向")).toHaveTextContent("局部电流");
    expect(screen.getAllByTestId("excited-zone")).toHaveLength(2);
    expect(screen.getAllByText("未兴奋区")).toHaveLength(2);
    expect(screen.getByText("双向传导")).toBeInTheDocument();
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
