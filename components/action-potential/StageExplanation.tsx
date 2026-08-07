import type { ActionPotentialStage, IonFlow } from "./types";

export const STAGE_COPY: Record<
  ActionPotentialStage,
  { title: string; simple: string; voltage: string; ions: string; cause: string }
> = {
  resting: { title: "静息状态", simple: "还没有刺激，膜内比膜外更负。", voltage: "膜电位约为 −70 mV", ions: "无明显的跨膜离子流动画", cause: "膜外相对为正，膜内相对为负。" },
  local: { title: "局部电位", simple: "刺激太弱，只在原地轻微变化，不会传远。", voltage: "膜电位小幅升高后恢复", ions: "少量 Na⁺ 内流（示意）", cause: "刺激未达到阈值，未形成可传导的动作电位。" },
  threshold: { title: "达到阈值", simple: "刺激强度够了，动作电位开始形成。", voltage: "膜电位接近阈电位", ions: "Na⁺ 通道开始开放", cause: "阈上刺激触发动作电位。" },
  depolarization: { title: "去极化", simple: "Na⁺ 进入，膜内电位快速升高。", voltage: "膜电位快速升高", ions: "Na⁺ 内流", cause: "Na⁺ 通道开放使膜内电位升高。" },
  peak: { title: "反极化", simple: "膜内短暂变得比膜外更正。", voltage: "膜电位约为 +30 mV", ions: "Na⁺ 通道逐渐关闭，K⁺ 通道随后开放", cause: "膜内电位短暂高于膜外。" },
  repolarization: { title: "复极化", simple: "K⁺ 离开，膜内电位开始下降。", voltage: "膜电位快速下降", ions: "K⁺ 外流", cause: "K⁺ 通道开放使膜内电位降低。" },
  recovery: { title: "恢复静息", simple: "膜电位回到刺激前的状态。", voltage: "膜电位回到约 −70 mV", ions: "K⁺ 外流逐渐结束", cause: "膜恢复静息状态的离子分布。" },
};

export interface StageExplanationProps {
  stage: ActionPotentialStage;
  ionFlow: IonFlow;
}

export function StageExplanation({ stage, ionFlow }: StageExplanationProps) {
  const copy = STAGE_COPY[stage];
  return (
    <section className="stage-card" aria-live="polite" aria-label="当前阶段解释">
      <p className="stage-kicker">当前阶段</p>
      <h2>{copy.title}</h2>
      <p className="stage-simple"><strong>先记这一句：</strong>{copy.simple}</p>
      <dl>
        <div><dt>电位变化</dt><dd>{copy.voltage}</dd></div>
        <div><dt>主要离子运动</dt><dd>{copy.ions}</dd></div>
        <div><dt>形成原因</dt><dd>{copy.cause}</dd></div>
      </dl>
      <p className="flow-code" data-flow={ionFlow}>粒子与通道数量均为教学示意</p>
    </section>
  );
}
