import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

describe("action-potential mode components", () => {
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

  it("renders local-current arrows and two wavefronts only for conduction", () => {
    const { rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );
    expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
    rerender(
      <ActionPotentialScene
        mode="conduction"
        frame={getActionPotentialFrame("conduction", 0.2)}
        playing
      />,
    );
    expect(screen.getByLabelText("局部电流方向")).toBeInTheDocument();
    expect(screen.getByLabelText("刺激点")).toBeInTheDocument();
    expect(screen.getAllByTestId("excited-zone")).toHaveLength(2);
  });

  it("renders the exact three knowledge facts", () => {
    render(
      <ActionPotentialKnowledgeCard content={ACTION_POTENTIAL_MODES[1]} />,
    );
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("Na⁺内流");
    expect(screen.getByLabelText("当前模式知识卡")).toHaveTextContent("K⁺外流");
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
