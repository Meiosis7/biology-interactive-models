# 体液免疫 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建能演示初次/二次免疫、抗原特异性和关键环节受阻的体液免疫动态交互模型。

**Architecture:** `simulation.ts` 由抗原、暴露次数、实验条件和教学时间生成免疫快照；流程视图、抗体/抗原曲线、细胞数量与结论卡均由该快照驱动，二次免疫通过同抗原记忆匹配改变阶段时序和峰值。

**Tech Stack:** React、TypeScript、CSS、SVG、HTML Canvas、Vitest、Testing Library。

## Global Constraints

- 主线为抗原进入、抗原呈递、辅助性 T 细胞活化、B 细胞活化、克隆增殖、浆细胞/记忆 B 细胞形成、抗体产生、抗原清除。
- 抗体和记忆细胞都具有抗原特异性；换用另一抗原不得获得同样的二次反应优势。
- 二次免疫应表现为潜伏期更短、抗体峰值更高、维持更久。
- 干预条件必须在准确环节停止下游过程，并解释“缺少谁，所以后面什么不能发生”。
- 数量、浓度与时间均为教学示意，不表示临床数值。

---

### Task 1: 体液免疫状态机

**Files:**
- Create: `models/05-humoral-immunity/types.ts`
- Create: `models/05-humoral-immunity/simulation.ts`
- Create: `tests/models/humoral-immunity/simulation.test.ts`

**Interfaces:**
- Produces: `AntigenType`、`HumoralSettings`、`HumoralSnapshot`、`HUMORAL_DURATION`、`getHumoralSnapshot(time, settings)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { getHumoralSnapshot } from "../../../models/05-humoral-immunity/simulation";

describe("humoral immunity simulation", () => {
  const normal = { antigen: "A", exposure: "primary", condition: "normal" } as const;

  it("orders presentation, activation, expansion and antibody release", () => {
    expect(getHumoralSnapshot(2, normal).stage).toBe("presentation");
    expect(getHumoralSnapshot(4, normal).stage).toBe("helper-activation");
    expect(getHumoralSnapshot(6, normal).stage).toBe("b-activation");
    expect(getHumoralSnapshot(8, normal).stage).toBe("clonal-expansion");
    expect(getHumoralSnapshot(11, normal).stage).toBe("antibody-release");
  });
  it("makes a matched secondary response faster and stronger", () => {
    const primary = getHumoralSnapshot(10, normal);
    const secondary = getHumoralSnapshot(10, { ...normal, exposure: "secondary", memoryAntigen: "A" });
    expect(secondary.antibodyLevel).toBeGreaterThan(primary.antibodyLevel);
    expect(secondary.memoryMatched).toBe(true);
  });
  it("does not transfer memory advantage to another antigen", () => {
    const value = getHumoralSnapshot(10, { ...normal, antigen: "B", exposure: "secondary", memoryAntigen: "A" });
    expect(value.memoryMatched).toBe(false);
    expect(value.antibodyLevel).toBe(getHumoralSnapshot(10, { ...normal, antigen: "B" }).antibodyLevel);
  });
  it.each([
    ["presentation-blocked", "presentation"],
    ["helper-t-blocked", "helper-activation"],
    ["b-cell-missing", "b-activation"],
  ] as const)("blocks %s at %s", (condition, stage) => {
    const value = getHumoralSnapshot(14, { ...normal, condition });
    expect(value.blockedAt).toBe(stage);
    expect(value.antibodyLevel).toBe(0);
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts`

Expected: 行为断言 FAIL。

- [ ] **Step 3: 实现纯状态机**

```ts
export type AntigenType = "A" | "B";
export type HumoralCondition = "normal" | "presentation-blocked" | "helper-t-blocked" | "b-cell-missing";
export interface HumoralSettings {
  antigen: AntigenType;
  exposure: "primary" | "secondary";
  memoryAntigen?: AntigenType;
  condition: HumoralCondition;
}
export interface HumoralSnapshot {
  stage: "entry" | "presentation" | "helper-activation" | "b-activation" | "clonal-expansion" | "differentiation" | "antibody-release" | "clearance" | "memory";
  blockedAt: HumoralSnapshot["stage"] | null;
  helperActive: boolean;
  bCellActive: boolean;
  plasmaCount: number;
  memoryCount: number;
  antibodyLevel: number;
  antigenLevel: number;
  memoryMatched: boolean;
}
```

初次反应使用 0–16 教学时间单位；同抗原二次反应把活化和分化阶段前移，并提高抗体峰值。抗体只降低当前匹配抗原。每个干预条件返回固定 `blockedAt` 并冻结后续指标。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts`

Expected: 全部通过。

```bash
git add models/05-humoral-immunity tests/models/humoral-immunity
git commit -m "feat: add humoral immunity simulation"
```

---

### Task 2: 体液免疫流程实验台

**Files:**
- Create: `models/05-humoral-immunity/HumoralImmunityLab.tsx`
- Create: `models/05-humoral-immunity/HumoralProcessView.tsx`
- Create: `models/05-humoral-immunity/AntibodyChart.tsx`
- Create: `models/05-humoral-immunity/humoral-immunity.css`
- Create: `app/models/humoral-immunity/page.tsx`
- Create: `tests/models/humoral-immunity/lab.test.tsx`

**Interfaces:**
- Consumes: `getHumoralSnapshot()`。
- Produces: `<HumoralImmunityLab />`。

- [ ] **Step 1: 写真实组件失败测试**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HumoralImmunityLab } from "../../../models/05-humoral-immunity/HumoralImmunityLab";

describe("HumoralImmunityLab", () => {
  it("shows the ordered immune-process spine", () => {
    render(<HumoralImmunityLab />);
    expect(screen.getByText("抗原呈递")).toBeInTheDocument();
    expect(screen.getByText("B 细胞克隆增殖")).toBeInTheDocument();
    expect(screen.getByText("浆细胞产生抗体")).toBeInTheDocument();
  });
  it("compares primary and matched secondary responses", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));
    expect(screen.getByText(/更快、更强、更持久/)).toBeInTheDocument();
  });
  it("explains a blocked helper T-cell condition", () => {
    render(<HumoralImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "辅助性 T 细胞受阻" }));
    expect(screen.getByText(/B 细胞不能充分活化/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现流程、曲线和控制**

`HumoralImmunityLab` 维护抗原、暴露次数、记忆抗原、干预条件、时间、播放和速度；切换关键条件时停止并归零。`HumoralProcessView` 用从左到右的固定流程骨架显示当前步骤、受阻节点、细胞增殖和抗体结合。`AntibodyChart` 同时绘制抗体与抗原水平，二次免疫模式保留初次反应虚线供对比。

- [ ] **Step 4: 页面、样式和可访问性**

解释卡按当前阶段显示“识别对象、参与细胞、产生结果、形成记忆”。颜色之外同时使用标签和图形区分抗原 A/B。暂停后细胞和抗体粒子静止；小屏流程改为纵向；所有控制可通过键盘使用。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- tests/models/humoral-immunity && npm run lint && npm run build`

Expected: 全部通过。

```bash
git add models/05-humoral-immunity app/models/humoral-immunity tests/models/humoral-immunity
git commit -m "feat: add humoral immunity interactive model"
```
