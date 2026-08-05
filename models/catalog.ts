export interface ModelCatalogItem {
  slug: string;
  order: number;
  title: string;
  shortLabel: string;
  description: string;
  keyPoints: readonly [string, string, string];
  href: string;
  themeColor: string;
}

export const MODEL_CATALOG = [
  {
    slug: "action-potential",
    order: 1,
    title: "动作电位",
    shortLabel: "ACTION POTENTIAL",
    description: "通过刺激与记录，观察神经纤维上动作电位的形成和传导。",
    keyPoints: ["阈值与全或无", "Na⁺内流和K⁺外流", "兴奋沿神经纤维传导"],
    href: "/models/action-potential",
    themeColor: "#35d3f5",
  },
  {
    slug: "synapse-transmission",
    order: 2,
    title: "突触传递",
    shortLabel: "SYNAPTIC TRANSMISSION",
    description: "沿着化学突触的事件链，理解兴奋如何跨越突触间隙。",
    keyPoints: ["Ca²⁺内流", "神经递质释放", "突触后膜反应"],
    href: "/models/synapse-transmission",
    themeColor: "#8b7cff",
  },
  {
    slug: "membrane-potential-curve",
    order: 3,
    title: "膜电位变化曲线",
    shortLabel: "MEMBRANE POTENTIAL",
    description: "将膜电位曲线与离子通道状态对应起来，辨认动作电位各阶段。",
    keyPoints: ["静息电位与阈电位", "去极化和复极化", "局部电位与动作电位"],
    href: "/models/membrane-potential-curve",
    themeColor: "#ff8a5c",
  },
  {
    slug: "meter-deflection",
    order: 4,
    title: "电表指针偏转",
    shortLabel: "GALVANOMETER",
    description: "调整刺激点和记录电极的位置，解释检流计指针偏转的原因。",
    keyPoints: ["兴奋处膜外相对为负", "两电极的电势差", "记录方式与偏转方向"],
    href: "/models/meter-deflection",
    themeColor: "#f7c948",
  },
  {
    slug: "humoral-immunity",
    order: 5,
    title: "体液免疫",
    shortLabel: "HUMORAL IMMUNITY",
    description: "追踪抗原识别、B细胞活化和抗体产生的特异性免疫过程。",
    keyPoints: ["抗原呈递与辅助性T细胞", "B细胞克隆增殖", "抗体与免疫记忆"],
    href: "/models/humoral-immunity",
    themeColor: "#45d6a6",
  },
  {
    slug: "cellular-immunity",
    order: 6,
    title: "细胞免疫",
    shortLabel: "CELLULAR IMMUNITY",
    description: "观察细胞毒性T细胞识别并清除被抗原入侵的靶细胞。",
    keyPoints: ["靶细胞抗原识别", "效应T细胞克隆增殖", "靶细胞裂解与记忆"],
    href: "/models/cellular-immunity",
    themeColor: "#e76df3",
  },
] as const satisfies readonly ModelCatalogItem[];

export function getAdjacentModels(slug: string): {
  previous: ModelCatalogItem;
  next: ModelCatalogItem;
} {
  const currentIndex = MODEL_CATALOG.findIndex((item) => item.slug === slug);

  if (currentIndex === -1) {
    throw new Error(`Unknown model slug: ${slug}`);
  }

  return {
    previous: MODEL_CATALOG[(currentIndex - 1 + MODEL_CATALOG.length) % MODEL_CATALOG.length],
    next: MODEL_CATALOG[(currentIndex + 1) % MODEL_CATALOG.length],
  };
}
