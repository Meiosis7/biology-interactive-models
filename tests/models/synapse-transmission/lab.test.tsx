import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SynapseLab } from "../../../models/02-synapse-transmission/SynapseLab";

describe("SynapseLab", () => {
  it("switches between excitatory and inhibitory effects", () => {
    render(<SynapseLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    expect(screen.getByText(/突触后膜电位升高/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "抑制性突触" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    expect(screen.getByText(/突触后膜电位降低/)).toBeInTheDocument();
  });

  it("resets after an intervention changes", () => {
    render(<SynapseLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "阻断 Ca²⁺通道" }));
    expect(screen.getByLabelText("教学时间")).toHaveValue("0");
  });

  it("uses calcium-blocked stage copy without describing downstream events", () => {
    render(<SynapseLab />);
    fireEvent.click(screen.getByRole("button", { name: "阻断 Ca²⁺通道" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });

    const explanation = within(screen.getByLabelText("当前阶段解释"));
    expect(explanation.getByRole("heading")).toHaveTextContent("Ca²⁺通道被阻断");
    expect(explanation.getByText(/未发生 Ca²⁺ 内流/)).toBeInTheDocument();
    expect(explanation.queryByText(/递质与特异性受体结合/)).not.toBeInTheDocument();
    expect(explanation.queryByText(/突触后膜电位改变/)).not.toBeInTheDocument();
  });

  it("uses receptor-blocked copy without claiming a postsynaptic response", () => {
    render(<SynapseLab />);
    fireEvent.click(screen.getByRole("button", { name: "阻断受体" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });

    const explanation = within(screen.getByLabelText("当前阶段解释"));
    expect(explanation.getByRole("heading")).toHaveTextContent("突触后受体被阻断");
    expect(explanation.getByText(/递质已经释放/)).toBeInTheDocument();
    expect(explanation.getByText(/维持约 −70 mV/)).toBeInTheDocument();
    expect(explanation.queryByText(/突触后膜电位改变/)).not.toBeInTheDocument();
  });

  it("exposes the chemical-synapse direction", () => {
    render(<SynapseLab />);
    expect(screen.getByText(/化学突触主要由突触前膜传向突触后膜/)).toBeInTheDocument();
  });

  it("keeps the current particles visible but static when paused", () => {
    const { container } = render(<SynapseLab />);

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "2" } });
    expect(container.querySelectorAll(".synapse-calcium")).toHaveLength(3);
    expect(container.querySelector(".synapse-calcium")?.classList).not.toContain("is-moving");

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3" } });
    expect(container.querySelectorAll(".synapse-vesicle")).toHaveLength(3);
    expect(container.querySelector(".synapse-vesicle")?.classList).not.toContain("is-fusing");

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });
    expect(container.querySelectorAll(".synapse-transmitter")).toHaveLength(4);
    expect(container.querySelector(".synapse-transmitter")?.classList).not.toContain("is-releasing");
  });

  it("removes every particle motion class after direct start and pause", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextId = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      nextId += 1;
      callbacks.set(nextId, callback);
      return nextId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => callbacks.delete(id)));

    const takeNextFrame = () => {
      const next = callbacks.entries().next().value as [number, FrameRequestCallback];
      callbacks.delete(next[0]);
      return next[1];
    };

    try {
      const { container } = render(<SynapseLab />);
      const cases = [
        [2500, ".synapse-calcium", "is-moving"],
        [3500, ".synapse-vesicle", "is-fusing"],
        [4500, ".synapse-transmitter", "is-releasing"],
      ] as const;

      for (const [timestamp, selector, motionClass] of cases) {
        fireEvent.click(screen.getByRole("button", { name: "开始刺激" }));
        act(() => takeNextFrame()(0));
        act(() => takeNextFrame()(timestamp));
        expect(container.querySelector(selector)).toHaveClass(motionClass);

        fireEvent.click(screen.getByRole("button", { name: "暂停" }));
        expect(callbacks.size).toBe(0);
        expect(container.querySelector(".synapse-calcium.is-moving")).not.toBeInTheDocument();
        expect(container.querySelector(".synapse-vesicle.is-fusing")).not.toBeInTheDocument();
        expect(container.querySelector(".synapse-transmitter.is-releasing")).not.toBeInTheDocument();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("resets and stops when switching to reverse postsynaptic stimulation", () => {
    const { container } = render(<SynapseLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "刺激突触后膜（反向）" }));

    expect(screen.getByLabelText("教学时间")).toHaveValue("0");
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(container.querySelector(".synapse-transmitter.is-releasing")).not.toBeInTheDocument();
  });

  it("explains that a postsynaptic stimulus cannot cross backward", () => {
    const { container } = render(<SynapseLab />);
    fireEvent.click(screen.getByRole("button", { name: "刺激突触后膜（反向）" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "2" } });

    expect(screen.getByText(/化学突触具有单向传递性/)).toBeInTheDocument();
    expect(screen.getByText(/不会反向传到突触前末梢/)).toBeInTheDocument();
    expect(container.querySelector(".synapse-calcium.is-moving")).not.toBeInTheDocument();
    expect(container.querySelector(".synapse-vesicle.is-fusing")).not.toBeInTheDocument();
    expect(container.querySelector(".synapse-transmitter.is-releasing")).not.toBeInTheDocument();
  });
});
