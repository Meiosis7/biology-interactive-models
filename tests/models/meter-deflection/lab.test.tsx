import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
