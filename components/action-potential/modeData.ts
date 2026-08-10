import type { ModeContent } from "./types";

export const MODE_DURATION_MS = 6000;

export const ACTION_POTENTIAL_MODES: readonly ModeContent[] = [
  {
    id: "resting",
    label: "静息电位",
    title: "静息电位：外正内负",
    summary: "神经纤维未兴奋时，K⁺外流使膜两侧形成外正内负的静息状态。",
    facts: [
      { label: "膜两侧电性", value: "外正内负" },
      { label: "主要离子运动", value: "K⁺外流" },
      { label: "结果", value: "形成并维持静息电位" },
    ],
  },
  {
    id: "generation",
    label: "动作电位产生",
    title: "动作电位在局部产生",
    summary: "Na⁺先内流，随后K⁺外流，使局部膜经历兴奋并恢复静息状态。",
    facts: [
      { label: "兴奋形成", value: "Na⁺内流" },
      { label: "恢复过程", value: "K⁺外流" },
      { label: "结果", value: "局部产生一次动作电位" },
    ],
  },
  {
    id: "conduction",
    label: "动作电位传导",
    title: "相邻部位依次兴奋",
    summary:
      "兴奋区与相邻未兴奋区之间形成局部电流；离体神经纤维的刺激点两侧都可发生传导。",
    facts: [
      { label: "传导基础", value: "相邻部位形成局部电流" },
      { label: "传导方式", value: "相邻部位依次兴奋" },
      { label: "结果", value: "动作电位沿神经纤维传导" },
    ],
  },
];
