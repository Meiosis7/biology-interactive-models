import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HumoralImmunityLab } from "../../../models/05-humoral-immunity/HumoralImmunityLab";

const humoralStyles = readFileSync("models/05-humoral-immunity/humoral-immunity.css", "utf8");

describe("HumoralImmunityLab", () => {
  it("shows the aligned seven-stage process", () => {
    render(<HumoralImmunityLab />);
    const spine = within(screen.getByLabelText("体液免疫有序流程"));

    expect(spine.getAllByText(/抗原呈递|辅助性 T 细胞活化|B 细胞活化|克隆增殖|分化|抗体产生与结合|免疫记忆/)).toHaveLength(7);
    expect(screen.queryByText("抗原进入")).not.toBeInTheDocument();
    expect(screen.queryByText("抗体结合并清除抗原")).not.toBeInTheDocument();
  });

  it("renders the four focused humoral scene regions", () => {
    render(<HumoralImmunityLab />);

    const scene = screen.getByLabelText("B 细胞与抗原的体液免疫相互作用示意");
    expect(within(scene).getByText("辅助性 T 细胞")).toBeInTheDocument();
    expect(within(scene).getByText("B 细胞")).toBeInTheDocument();
    expect(within(scene).queryByText("匹配 B 细胞")).not.toBeInTheDocument();
    expect(within(scene).getByText("克隆与分化")).toBeInTheDocument();
    expect(within(scene).getByText("抗体—抗原结合")).toBeInTheDocument();
    expect(within(scene).getByLabelText("B 细胞受体：特异识别抗原 A")).toBeInTheDocument();
    expect(scene).toHaveClass("is-paused");

    fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(scene).toHaveClass("is-playing");
  });

  it("marks an unmatched B-cell step without marking it as experimentally blocked", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

    const spine = within(screen.getByLabelText("体液免疫有序流程"));
    expect(spine.getByText("未匹配")).toBeInTheDocument();
    expect(spine.queryByText("受阻")).not.toBeInTheDocument();
    expect(spine.getByText("未匹配").closest(".humoral-process-step")).toHaveClass(
      "is-unmatched",
    );
    expect(spine.getByText("未匹配").closest(".humoral-process-step")).not.toHaveClass(
      "is-blocked",
    );
  });

  it("reveals a BCR mismatch only when B-cell activation is reached", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
    const slider = screen.getByLabelText("教学时间");
    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });
    const chart = screen.getByText("抗体与抗原的相对变化").closest("figure")!;
    const assertPending = () => {
      expect(screen.queryByRole("heading", { name: "未匹配" })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/阶段播报/)).not.toHaveTextContent("未匹配");
      expect(within(screen.getByLabelText("体液免疫有序流程")).queryByText("未匹配")).not.toBeInTheDocument();
      expect(within(scene).queryByText(/BCR 与抗原不匹配/)).not.toBeInTheDocument();
      expect(scene.querySelector(".humoral-cell.b-cell")).not.toHaveClass("is-unmatched");
      expect(within(chart).queryByText(/BCR 与抗原不匹配/)).not.toBeInTheDocument();
    };

    assertPending();
    fireEvent.change(slider, { target: { value: "4.9" } });
    assertPending();

    fireEvent.change(slider, { target: { value: "5" } });
    expect(screen.getByRole("heading", { name: "未匹配" })).toBeInTheDocument();
    expect(screen.getByLabelText(/阶段播报/)).toHaveTextContent("未匹配：B 细胞活化");
    expect(within(scene).getAllByText(/BCR 与抗原不匹配/).length).toBeGreaterThan(0);
    expect(scene.querySelector(".humoral-cell.b-cell")).toHaveClass("is-unmatched");
    expect(within(chart).getByText(/BCR 与抗原不匹配，抗体保持 0/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "18" } });
    expect(screen.getByRole("heading", { name: "未匹配" })).toBeInTheDocument();
    expect(screen.getByLabelText(/阶段播报/)).toHaveTextContent("未匹配：B 细胞活化");
  });

  it("offers independent antigen and BCR controls", () => {
    render(<HumoralImmunityLab />);

    expect(screen.getByRole("button", { name: "抗原 A" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "BCR A" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "BCR B" })).toHaveAttribute("aria-pressed", "false");
  });

  it("labels a BCR mismatch as unmatched", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

    expect(screen.getByRole("heading", { name: "未匹配" })).toBeInTheDocument();
    expect(screen.getByText(/BCR B 只能特异识别抗原 B/)).toBeInTheDocument();
    expect(screen.getByText(/浆细胞 0，记忆 B 细胞 0，抗体相对量 0，抗原相对量 100/)).toBeInTheDocument();
  });

  it("distinguishes a missing B cell from a receptor mismatch", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "缺少 B 细胞" }));

    expect(screen.getByRole("heading", { name: "过程受阻" })).toBeInTheDocument();
    expect(screen.getByText(/没有执行特异性应答的 B 细胞/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "未匹配" })).not.toBeInTheDocument();
    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });
    expect(within(scene).getByText("B 细胞缺失")).toBeInTheDocument();
    expect(within(scene).queryByLabelText(/B 细胞受体/)).not.toBeInTheDocument();
    expect(
      within(scene).getByText(/缺少可接触并接收第二信号的 B 细胞/),
    ).toBeInTheDocument();
  });

  it.each([
    "抗原呈递受阻",
    "辅助性 T 细胞受阻",
    "缺少 B 细胞",
  ])("keeps %s authoritative when the configured BCR also mismatches", (condition) => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
    fireEvent.click(screen.getByRole("button", { name: condition }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

    expect(screen.getByRole("heading", { name: "过程受阻" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "未匹配" })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("体液免疫有序流程")).getByText("受阻")).toBeInTheDocument();
    expect(within(screen.getByLabelText("体液免疫有序流程")).queryByText("未匹配")).not.toBeInTheDocument();
    expect(screen.queryByText(/BCR 与抗原不匹配/)).not.toBeInTheDocument();
    expect(screen.getByText(/所选干预阻断下游抗体产生/)).toBeInTheDocument();
  });

  it("does not claim a first signal when a mismatched BCR is masked by helper-T blockade", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
    fireEvent.click(screen.getByRole("button", { name: "辅助性 T 细胞受阻" }));

    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });
    expect(within(scene).getByText(/第二信号被阻断/)).toBeInTheDocument();
    expect(within(scene).queryByText(/第一信号可建立/)).not.toBeInTheDocument();
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

  it("explains a BCR-mismatched flat antibody curve", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));
    fireEvent.click(screen.getByRole("button", { name: "BCR B" }));

    const chart = screen.getByText("抗体与抗原的相对变化").closest("figure");
    expect(chart).not.toBeNull();
    expect(within(chart!).getByText(/流程尚未到达特异性检验环节/)).toBeInTheDocument();
    expect(within(chart!).queryByText(/BCR 与抗原不匹配/)).not.toBeInTheDocument();
    expect(within(chart!).queryByText(/初次反应（对照虚线）/)).not.toBeInTheDocument();
    expect(screen.getByText(/将在 B 细胞活化阶段检验 BCR 与抗原是否匹配/)).toBeInTheDocument();
    expect(screen.queryByText(/记忆不匹配：按初次反应/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "5" } });
    expect(within(chart!).getByText(/BCR 与抗原不匹配，抗体保持 0，抗原不下降/)).toBeInTheDocument();
    expect(screen.getByText(/BCR 未匹配：流程已在 B 细胞活化阶段停止/)).toBeInTheDocument();
  });

  it("teaches the textbook two-signal mechanism across explanations and the scene", () => {
    render(<HumoralImmunityLab />);
    const slider = screen.getByLabelText("教学时间");
    const explanation = screen.getByLabelText("当前阶段解释");
    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });

    expect(within(explanation).getByText(/病原体可直接接触 B 细胞并提供第一信号/)).toBeInTheDocument();
    expect(within(explanation).getByText(/树突状细胞、B 细胞等抗原呈递细胞/)).toBeInTheDocument();
    expect(within(explanation).getByText(/将处理后的抗原呈递给辅助性 T 细胞/)).toBeInTheDocument();
    expect(within(scene).getByText(/第一信号；等待辅助性 T 细胞的第二信号/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "3" } });
    expect(within(explanation).getByText(/增殖、分化并分泌细胞因子/)).toBeInTheDocument();
    expect(within(scene).getByText(/提供第二信号并分泌细胞因子/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "5" } });
    expect(within(explanation).getByText(/只有同时获得第一、第二信号/)).toBeInTheDocument();
    expect(within(scene).getByText(/获得两个信号，B 细胞已活化/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "9" } });
    expect(within(explanation).getByText(/大部分分化为浆细胞，少部分成为记忆 B 细胞/)).toBeInTheDocument();
    expect(within(scene).getByText(/多数成为浆细胞，少数成为记忆 B 细胞/)).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: "11" } });
    expect(within(explanation).getByText(/将抗体分泌到体液中/)).toBeInTheDocument();
    expect(within(explanation).getByText(/抑制病原体增殖或对人体细胞的黏附/)).toBeInTheDocument();
    expect(within(scene).getByText(/抗体进入体液并特异性结合抗原/)).toBeInTheDocument();
  });

  it("describes a completed antibody response during the primary memory stage", () => {
    render(<HumoralImmunityLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "16" } });

    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });
    expect(within(scene).getByText(/抗体已完成特异性结合，抗原已清除/)).toBeInTheDocument();
    expect(within(scene).queryByText(/尚未向体液分泌/)).not.toBeInTheDocument();
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

  it("keeps live quantities outside the explanation card", () => {
    render(<HumoralImmunityLab />);

    const explanation = screen.getByLabelText("当前阶段解释");
    const liveValues = screen.getByText(/当前：浆细胞/);
    const announcer = screen.getByLabelText("阶段播报：抗原呈递");
    expect(explanation).not.toHaveAttribute("aria-live");
    expect(explanation).not.toContainElement(liveValues);
    expect(liveValues).not.toHaveAttribute("aria-live");
    expect(liveValues).not.toHaveAttribute("aria-atomic");
    expect(announcer).toHaveAttribute("aria-live", "polite");
    expect(announcer).toHaveTextContent("抗原呈递");

    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "11" } });
    expect(announcer).toHaveTextContent("抗体产生与结合");
    expect(announcer).toHaveAccessibleName("阶段播报：抗体产生与结合");
  });

  it("uses seven desktop process columns and keeps the process accessible on small screens", () => {
    expect(humoralStyles).toContain(
      "grid-template-columns: repeat(7, minmax(78px, 1fr))",
    );
    expect(humoralStyles).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.humoral-process-spine\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    );
    expect(humoralStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps scene semantics and decorative tokens accessible", () => {
    render(<HumoralImmunityLab />);

    const scene = screen.getByRole("group", {
      name: "B 细胞与抗原的体液免疫相互作用示意",
    });
    const decorativeTokens = scene.querySelectorAll(
      ".humoral-clone-token, .humoral-antibody",
    );
    expect(decorativeTokens.length).toBeGreaterThan(0);
    decorativeTokens.forEach((token) => {
      expect(token).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("keeps mobile visual order aligned with process, chart, explanation, quantities DOM order", () => {
    const mobileRule = humoralStyles.match(
      /@media \(max-width: 980px\) \{([\s\S]*?)@media \(max-width: 720px\)/,
    )?.[1];

    expect(mobileRule).toBeDefined();
    expect(mobileRule).not.toContain("order:");
  });
});
