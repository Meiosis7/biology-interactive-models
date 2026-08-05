import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CellularImmunityLab } from "../../../models/06-cellular-immunity/CellularImmunityLab";

const cellularStyles = readFileSync("models/06-cellular-immunity/cellular-immunity.css", "utf8");

describe("CellularImmunityLab", () => {
  it("shows the ordered cellular process", () => {
    render(<CellularImmunityLab />);

    expect(screen.getByText("细胞毒性 T 细胞活化")).toBeInTheDocument();
    expect(screen.getByText("特异性识别靶细胞")).toBeInTheDocument();
    expect(screen.getByText("靶细胞裂解")).toBeInTheDocument();
  });

  it("protects an unmatched target", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "感染细胞 B" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "14" } });

    expect(screen.getByText(/不能特异性识别，因此不裂解/)).toBeInTheDocument();
  });

  it("explains missing cytotoxic T cells", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "缺少细胞毒性 T 细胞" }));

    expect(screen.getByText(/不能执行靶细胞裂解/)).toBeInTheDocument();
  });

  it("distinguishes normal and infected targets with text and shape", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "正常细胞" }));
    expect(screen.getByLabelText("正常细胞：方形，无病毒抗原标志")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "感染细胞 A" }));
    expect(screen.getByLabelText("感染细胞 A：圆形，抗原 A 标志")).toBeInTheDocument();
  });

  it("holds at recognition when the marker mismatches", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "标志不匹配" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "14" } });

    expect(screen.getByText(/受体与展示标志不匹配，停留在识别阶段/)).toBeInTheDocument();
  });

  it("overlays primary comparison for a matched secondary response", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));

    expect(screen.getByText(/初次反应（对照虚线）/)).toBeInTheDocument();
    expect(screen.getByText("记忆匹配：更快、更强的应答")).toBeInTheDocument();
  });

  it("stacks the process view on small screens and supports reduced motion", () => {
    expect(cellularStyles).toMatch(/@media \(max-width: 720px\).*?\.cellular-process-spine \{ grid-template-columns: 1fr;/s);
    expect(cellularStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
