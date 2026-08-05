import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";

vi.mock("../../components/action-potential/AxonView", () => ({
  AxonView: ({ snapshot, onElectrodeChange }: {
    snapshot: { stage: string };
    onElectrodeChange: (position: number) => void;
  }) => (
    <div>
      <div data-testid="axon-stage">{snapshot.stage}</div>
      <input
        aria-label="记录电极位置"
        type="range"
        min="0"
        max="1"
        step="0.01"
        onChange={(event) => onElectrodeChange(Number(event.target.value))}
      />
    </div>
  ),
}));

vi.mock("../../components/action-potential/PotentialChart", () => ({
  PotentialChart: ({ snapshot }: { snapshot: { membranePotential: number } }) => (
    <div data-testid="chart-value">{Math.round(snapshot.membranePotential)}</div>
  ),
}));

describe("ActionPotentialLab", () => {
  it("starts with the resting state", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByText("静息状态")).toBeInTheDocument();
    expect(screen.getByTestId("chart-value")).toHaveTextContent("-70");
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
});
