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

  it("describes an early matching target as pending recognition", () => {
    render(<CellularImmunityLab />);

    expect(screen.getByText(/尚未发生识别或接触/)).toBeInTheDocument();
    expect(screen.queryByText(/该靶细胞不能特异性识别/)).not.toBeInTheDocument();
  });

  it("protects an unmatched target", () => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "感染细胞 B" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "14" } });

    expect(screen.getByText(/不能特异性识别，因此不裂解/)).toBeInTheDocument();
    expect(screen.queryByText(/尚未发生识别或接触/)).not.toBeInTheDocument();
  });

  it.each([
    ["正常细胞", "normal target"],
    ["感染细胞 B", "infected target with an unmatched antigen"],
  ])("keeps the %s view at recognition at a late time", (target) => {
    render(<CellularImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: target }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "16" } });

    expect(screen.getByText("当前：特异性识别靶细胞")).toBeInTheDocument();
    expect(screen.queryByText("当前：靶细胞裂解")).not.toBeInTheDocument();
    expect(screen.queryByText("当前：保留免疫记忆")).not.toBeInTheDocument();
    expect(screen.getByText(/靶细胞 1，记忆 T 细胞 0/)).toBeInTheDocument();
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
    expect(cellularStyles).toMatch(
      /@media \(max-width: 720px\)\s*\{[\s\S]*?\.cellular-process-spine\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    );
    expect(cellularStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps live cell counts outside the polite stage announcer", () => {
    render(<CellularImmunityLab />);

    const explanation = screen.getByLabelText("当前阶段解释");
    const liveValues = screen.getByText(/当前：效应 T 细胞/);
    const announcer = screen.getByLabelText("阶段播报：抗原呈递");
    expect(explanation).not.toHaveAttribute("aria-live");
    expect(liveValues).not.toHaveAttribute("aria-live");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveTextContent("抗原呈递");

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "13" } });
    expect(announcer).toHaveTextContent("靶细胞裂解");
    expect(announcer).toHaveAccessibleName("阶段播报：靶细胞裂解");
  });
});
