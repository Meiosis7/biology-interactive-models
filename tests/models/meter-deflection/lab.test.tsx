import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MeterDeflectionLab } from "../../../models/04-meter-deflection/MeterDeflectionLab";

describe("MeterDeflectionLab", () => {
  it("shows the voltage subtraction rule", () => {
    render(<MeterDeflectionLab />);

    expect(screen.getByText(/U = V_A − V_B/)).toBeInTheDocument();
  });

  it("reverses the displayed sign when leads are swapped", () => {
    render(<MeterDeflectionLab />);

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3.5" } });
    const before = screen.getByTestId("meter-difference").textContent;
    fireEvent.click(screen.getByRole("button", { name: "交换导线" }));

    expect(screen.getByTestId("meter-difference").textContent).not.toBe(before);
  });

  it("loads an equidistant preset", () => {
    render(<MeterDeflectionLab />);

    fireEvent.click(screen.getByRole("button", { name: "等距同时到达" }));

    expect(screen.getByText(/同时到达.*接近 0/)).toBeInTheDocument();
  });

  it("labels the chart with the swapped lead subtraction and its live value", () => {
    render(<MeterDeflectionLab />);
    const chart = screen.getByText("电极电位与差值").closest("figure");
    expect(chart).not.toBeNull();

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3.5" } });
    expect(within(chart!).getByText("V_A − V_B")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "交换导线" }));

    expect(within(chart!).getByText("V_B − V_A")).toBeInTheDocument();
    expect(within(chart!).getByText("三条曲线共用同一教学时间轴；橙线：V_B − V_A = 20 mV，是检流计当前的输入差值。")).toBeInTheDocument();
  });

  it("shows a passed-wave explanation at the end of the equal-arrival run", () => {
    render(<MeterDeflectionLab />);

    fireEvent.click(screen.getByRole("button", { name: "等距同时到达" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "10" } });

    expect(within(screen.getByLabelText("四步解释链")).getAllByText(/已通过两电极/)).toHaveLength(2);
  });

  it("cancels the shared animation frame when paused", () => {
    const callbacks = new Map<number, FrameRequestCallback>();
    let nextId = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      nextId += 1;
      callbacks.set(nextId, callback);
      return nextId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => callbacks.delete(id)));

    try {
      render(<MeterDeflectionLab />);
      fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3.5" } });
      fireEvent.click(screen.getByRole("button", { name: "播放" }));
      const first = callbacks.entries().next().value as [number, FrameRequestCallback];
      callbacks.delete(first[0]);
      act(() => first[1](0));
      const second = callbacks.entries().next().value as [number, FrameRequestCallback];
      callbacks.delete(second[0]);
      act(() => second[1](1000));

      const beforePause = screen.getByText("4.5 时间单位");
      const meterBeforePause = screen.getByTestId("meter-difference").textContent;
      fireEvent.click(screen.getByRole("button", { name: "暂停" }));

      expect(callbacks.size).toBe(0);
      expect(screen.getByText("4.5 时间单位")).toBe(beforePause);
      expect(screen.getByTestId("meter-difference").textContent).toBe(meterBeforePause);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
