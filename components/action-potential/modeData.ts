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
    summary: "刺激使局部Na⁺通道开放，Na⁺内流，局部变为外负内正。",
    facts: [
      { label: "原因", value: "刺激局部神经纤维" },
      { label: "通道与离子变化", value: "局部Na⁺通道开放，Na⁺内流" },
      { label: "结果", value: "局部变为外负内正" },
    ],
  },
  {
    id: "conduction",
    label: "动作电位传导",
    title: "相邻部位依次兴奋",
    summary:
      "兴奋区形成局部电流，使相邻Na⁺通道依次开放，兴奋由刺激点向两侧逐段传导。",
    facts: [
      { label: "原因", value: "兴奋区形成局部电流" },
      { label: "通道与离子变化", value: "相邻Na⁺通道依次开放" },
      { label: "结果", value: "兴奋由刺激点向两侧逐段传导" },
    ],
  },
];
