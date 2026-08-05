import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HumoralImmunityLab } from "../../../models/05-humoral-immunity/HumoralImmunityLab";

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
});
