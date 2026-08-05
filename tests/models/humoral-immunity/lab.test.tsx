import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HumoralImmunityLab } from "../../../models/05-humoral-immunity/HumoralImmunityLab";

const humoralStyles = readFileSync("models/05-humoral-immunity/humoral-immunity.css", "utf8");

describe("HumoralImmunityLab", () => {
  it("shows the ordered immune-process spine", () => {
    render(<HumoralImmunityLab />);

    expect(screen.getByText("抗原呈递")).toBeInTheDocument();
    expect(screen.getByText("B 细胞克隆增殖")).toBeInTheDocument();
    expect(screen.getByText("浆细胞产生抗体")).toBeInTheDocument();
  });

  it("keeps antigen entry and immune memory as explicit spine endpoints", () => {
    render(<HumoralImmunityLab />);

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

    const spine = within(screen.getByLabelText("体液免疫有序流程"));
    expect(spine.getByText("抗原进入")).toBeInTheDocument();
    expect(spine.getByText("保留免疫记忆")).toBeInTheDocument();
    expect(screen.getByText("当前：保留免疫记忆")).toBeInTheDocument();
  });

  it("keeps the desktop spine in nine columns and stacks it on small screens", () => {
    expect(humoralStyles).toContain("grid-template-columns: repeat(9, minmax(72px, 1fr))");
    expect(humoralStyles).toMatch(/@media \(max-width: 720px\).*?\.humoral-process-spine \{ grid-template-columns: 1fr;/s);
  });

  it("compares primary and matched secondary responses", () => {
    render(<HumoralImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));

    expect(screen.getByText(/更快、更强、更持久/)).toBeInTheDocument();
    expect(screen.getByText(/初次反应（对照虚线）/)).toBeInTheDocument();
  });

  it("explains a blocked helper T-cell condition", () => {
    render(<HumoralImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "辅助性 T 细胞受阻" }));

    expect(screen.getByText(/B 细胞不能充分活化/)).toBeInTheDocument();
    expect(screen.getByText(/缺少辅助性 T 细胞的激活信号/)).toBeInTheDocument();
  });

  it("uses a blocked-response chart caption when an intervention stops antibody production", () => {
    render(<HumoralImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "辅助性 T 细胞受阻" }));

    const chart = screen.getByText("抗体与抗原的相对变化").closest("figure");
    expect(chart).not.toBeNull();
    expect(within(chart!).getByText(/所选干预阻断下游抗体产生，抗体保持 0，抗原不下降/)).toBeInTheDocument();
  });

  it("hides secondary-response comparison when a matched response is blocked", () => {
    render(<HumoralImmunityLab />);

    fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));
    fireEvent.click(screen.getByRole("button", { name: "辅助性 T 细胞受阻" }));

    expect(screen.getByText(/缺少辅助性 T 细胞的激活信号/)).toBeInTheDocument();
    expect(screen.queryByText(/初次反应（对照虚线）/)).not.toBeInTheDocument();
    expect(screen.queryByText(/更快、更强、更持久/)).not.toBeInTheDocument();
  });

  it("resets teaching time when a key condition changes", () => {
    render(<HumoralImmunityLab />);

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "抗原 B" }));

    expect(screen.getByText("0.0 时间单位")).toBeInTheDocument();
  });

  it("distinguishes antigens by named shape as well as label", () => {
    render(<HumoralImmunityLab />);

    expect(screen.getAllByLabelText(/抗原 A：圆形标记/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "抗原 B" }));
    expect(screen.getAllByLabelText(/抗原 B：三角形标记/).length).toBeGreaterThan(0);
    expect(screen.getByText(/时间、浓度和细胞数量均为教学示意/)).toBeInTheDocument();
  });

  it("keeps live quantities outside the polite stage announcer", () => {
    render(<HumoralImmunityLab />);

    const explanation = screen.getByLabelText("当前阶段解释");
    const liveValues = within(explanation).getByText(/当前：浆细胞/);
    const announcer = screen.getByLabelText("阶段播报：抗原进入");
    expect(explanation).not.toHaveAttribute("aria-live");
    expect(liveValues).not.toHaveAttribute("aria-live");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveTextContent("抗原进入");

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "11" } });
    expect(announcer).toHaveTextContent("浆细胞产生抗体");
    expect(announcer).toHaveAccessibleName("阶段播报：浆细胞产生抗体");
  });
});
