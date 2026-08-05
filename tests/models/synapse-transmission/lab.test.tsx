import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
