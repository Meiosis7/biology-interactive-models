import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AnalogMeter } from "../../../models/04-meter-deflection/AnalogMeter";
import { MeterDeflectionLab } from "../../../models/04-meter-deflection/MeterDeflectionLab";

function openAdvancedMode() {
  fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
}

describe("MeterDeflectionLab", () => {
  it("starts with a simple judgement chain and moves through examples", () => {
    render(<MeterDeflectionLab />);

    expect(screen.getByLabelText("基础判断链")).toHaveTextContent("谁先兴奋");
    expect(screen.queryByRole("button", { name: "交换导线" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一个示例" }));
    expect(screen.getByText(/B 距刺激点更近/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
    expect(screen.getByRole("button", { name: "交换导线" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重置" }));
    expect(screen.queryByRole("button", { name: "交换导线" })).not.toBeInTheDocument();
  });

  it("serializes meter coordinates at a fixed precision for hydration", () => {
    const markup = renderToString(<AnalogMeter differenceMv={12} pointerAngle={17} leadsReversed={false} />);
    const coordinates = Array.from(markup.matchAll(/(?:x1|y1|x2|y2|x|y)="([^"]+)"/g), ([, value]) => value);

    expect(coordinates).not.toHaveLength(0);
    expect(coordinates.every((value) => {
      const decimal = value.split(".")[1];
      return !decimal || decimal.length <= 4;
    })).toBe(true);
  });

  it("shows the voltage subtraction rule", () => {
    render(<MeterDeflectionLab />);

    expect(screen.getByText(/U = V_A − V_B/)).toBeInTheDocument();
  });

  it("reverses the displayed sign when leads are swapped", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3.5" } });
    const before = screen.getByTestId("meter-difference").textContent;
    fireEvent.click(screen.getByRole("button", { name: "交换导线" }));

    expect(screen.getByTestId("meter-difference").textContent).not.toBe(before);
  });

  it("loads an equidistant preset", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();

    fireEvent.click(screen.getByRole("button", { name: "等距验证" }));

    expect(screen.getByText(/同时到达.*接近 0/)).toBeInTheDocument();
  });

  it("offers four accessible presets and resets time for each", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();
    const presets = [
      "膜外双电极（A 先到）",
      "膜外双电极（B 先到）",
      "膜内外跨膜",
      "等距验证",
    ];

    for (const preset of presets) {
      fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "4" } });
      fireEvent.click(screen.getByRole("button", { name: preset }));
      expect(screen.getByLabelText("教学时间")).toHaveValue("0");
    }
  });

  it("makes B arrive first in the B-first extracellular preset", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();
    fireEvent.click(screen.getByRole("button", { name: "膜外双电极（B 先到）" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3" } });

    expect(within(screen.getByLabelText("四步解释链")).getAllByText(/兴奋到达 B/).length).toBeGreaterThan(0);
  });

  it("never describes B as changing in transmembrane mode", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();
    fireEvent.click(screen.getByRole("button", { name: "膜内外跨膜" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "5.2" } });

    const explanation = within(screen.getByLabelText("四步解释链"));
    expect(explanation.getByText(/B 是膜外参考电位，始终保持 0 mV/)).toBeInTheDocument();
    expect(explanation.queryByText(/兴奋到达 B|B 位置发生电位改变/)).not.toBeInTheDocument();
  });

  it("shows and hides the four-step reasoning chain itself", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();
    const explanation = within(screen.getByLabelText("四步解释链"));

    expect(explanation.getByRole("list")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "隐藏四步推理" }));
    expect(explanation.queryByRole("list")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "显示四步推理" }));
    expect(explanation.getByRole("list")).toBeInTheDocument();
  });

  it("labels the chart with the swapped lead subtraction and its live value", () => {
    render(<MeterDeflectionLab />);
    openAdvancedMode();
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
    openAdvancedMode();

    fireEvent.click(screen.getByRole("button", { name: "等距验证" }));
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
      openAdvancedMode();
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
