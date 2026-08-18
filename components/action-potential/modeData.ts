import type { ModeContent } from "./types";

export const MODE_DURATION_MS = 6000;

export const ACTION_POTENTIAL_MODES: readonly ModeContent[] = [
  {
    id: "resting",
    label: "静息电位",
    title: "静息电位：外正内负",
    summary: "K⁺外流，膜两侧保持外正内负。",
    facts: [
      { label: "原因", value: "静息状态下K⁺通道开放" },
      { label: "通道与离子变化", value: "K⁺外流" },
      { label: "结果", value: "膜两侧保持外正内负" },
    ],
  },
  {
    id: "generation",
    label: "动作电位产生",
    title: "局部动作电位产生",
    summary:
      "刺激使局部 Na⁺通道开放，Na⁺内流，受刺激部位膜外为负、膜内为正。",
    facts: [
      { label: "原因", value: "刺激局部神经纤维" },
      { label: "通道与离子变化", value: "局部 Na⁺通道开放，Na⁺内流" },
      { label: "结果", value: "受刺激部位膜外为负、膜内为正" },
    ],
  },
  {
    id: "conduction",
    label: "动作电位传导",
    title: "相邻部位依次兴奋",
    summary: "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
    facts: [
      {
        label: "原因",
        value: "兴奋部位与未兴奋部位之间形成局部电流",
      },
      { label: "通道与离子变化", value: "相邻Na⁺通道依次开放" },
      {
        label: "结果",
        value: "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
      },
    ],
  },
];
