# 细胞免疫 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建能演示细胞毒性 T 细胞特异性识别、克隆扩增、靶细胞裂解及记忆效应的细胞免疫动态交互模型。

**Architecture:** `simulation.ts` 根据靶细胞类型、免疫记忆、实验条件和教学时间计算唯一快照；识别视图、效应细胞/靶细胞曲线和因果解释共同消费该快照，保证“不匹配或正常细胞不被裂解”的特异性约束贯穿全模型。

**Tech Stack:** React、TypeScript、CSS、SVG、HTML Canvas、Vitest、Testing Library。

## Global Constraints

- 主线为抗原呈递、辅助性 T 细胞活化、细胞毒性 T 细胞活化、克隆增殖、识别靶细胞、靶细胞裂解、记忆 T 细胞形成。
- 靶细胞必须带有匹配的抗原标志才能被识别；正常细胞和标志不匹配的感染细胞不被裂解。
- 二次免疫只对同一抗原产生更快、更强的细胞毒性 T 细胞反应。
- 细胞毒性 T 细胞导致靶细胞裂解，但抗原清除仍需其他免疫环节参与，不展示“直接吞噬病毒”的错误表述。
- 时间和细胞数量均为教学示意；暂停后迁移、结合、裂解和曲线游标停止。

---

### Task 1: 识别、扩增与裂解状态机

**Files:**
- Create: `models/06-cellular-immunity/types.ts`
- Create: `models/06-cellular-immunity/simulation.ts`
- Create: `tests/models/cellular-immunity/simulation.test.ts`

**Interfaces:**
- Produces: `CellularSettings`、`CellularSnapshot`、`CELLULAR_DURATION`、`getCellularSnapshot(time, settings)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { getCellularSnapshot } from "../../../models/06-cellular-immunity/simulation";

describe("cellular immunity simulation", () => {
  const normal = {
    target: "infected-a",
    tCellSpecificity: "A",
    exposure: "primary",
    condition: "normal",
  } as const;

  it("orders activation, expansion, recognition and lysis", () => {
    expect(getCellularSnapshot(3, normal).stage).toBe("helper-activation");
    expect(getCellularSnapshot(5, normal).stage).toBe("cytotoxic-activation");
    expect(getCellularSnapshot(8, normal).stage).toBe("clonal-expansion");
    expect(getCellularSnapshot(11, normal).stage).toBe("target-recognition");
    expect(getCellularSnapshot(13, normal).stage).toBe("target-lysis");
  });
  it("lyses only a matching infected target", () => {
    expect(getCellularSnapshot(14, normal).targetLysed).toBe(true);
    expect(getCellularSnapshot(14, { ...normal, target: "infected-b" }).targetLysed).toBe(false);
    expect(getCellularSnapshot(14, { ...normal, target: "normal" }).targetLysed).toBe(false);
  });
  it("makes a matched secondary response faster", () => {
    const primary = getCellularSnapshot(9, normal);
    const secondary = getCellularSnapshot(9, { ...normal, exposure: "secondary", memorySpecificity: "A" });
    expect(secondary.effectorCount).toBeGreaterThan(primary.effectorCount);
    expect(secondary.memoryMatched).toBe(true);
  });
  it.each([
    ["presentation-blocked", "presentation"],
    ["helper-t-blocked", "helper-activation"],
    ["cytotoxic-t-missing", "cytotoxic-activation"],
  ] as const)("blocks %s at %s", (condition, stage) => {
    const value = getCellularSnapshot(14, { ...normal, condition });
    expect(value.blockedAt).toBe(stage);
    expect(value.targetLysed).toBe(false);
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/cellular-immunity/simulation.test.ts`

Expected: 行为断言 FAIL。

- [ ] **Step 3: 实现确定性状态机**

```ts
export type TargetType = "infected-a" | "infected-b" | "normal";
export type AntigenSpecificity = "A" | "B";
export type CellularCondition = "normal" | "presentation-blocked" | "helper-t-blocked" | "cytotoxic-t-missing" | "marker-mismatch";
export interface CellularSettings {
  target: TargetType;
  tCellSpecificity: AntigenSpecificity;
  exposure: "primary" | "secondary";
  memorySpecificity?: AntigenSpecificity;
  condition: CellularCondition;
}
export interface CellularSnapshot {
  stage: "presentation" | "helper-activation" | "cytotoxic-activation" | "clonal-expansion" | "target-recognition" | "target-lysis" | "memory";
  blockedAt: CellularSnapshot["stage"] | null;
  helperActive: boolean;
  cytotoxicActive: boolean;
  effectorCount: number;
  targetCount: number;
  targetRecognized: boolean;
  targetLysed: boolean;
  memoryCount: number;
  memoryMatched: boolean;
}
```

初次反应使用 0–16 教学时间单位；匹配二次反应前移活化、扩增和识别边界。`targetRecognized` 必须同时满足：感染靶细胞、标志与 T 细胞特异性匹配、无 `marker-mismatch`。任一上游干预都阻止裂解。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/models/cellular-immunity/simulation.test.ts`

Expected: 全部通过。

```bash
git add models/06-cellular-immunity tests/models/cellular-immunity
git commit -m "feat: add cellular immunity simulation"
```

---

### Task 2: 细胞免疫流程实验台

**Files:**
- Create: `models/06-cellular-immunity/CellularImmunityLab.tsx`
- Create: `models/06-cellular-immunity/CellularProcessView.tsx`
- Create: `models/06-cellular-immunity/CellularChart.tsx`
- Create: `models/06-cellular-immunity/cellular-immunity.css`
- Create: `app/models/cellular-immunity/page.tsx`
- Create: `tests/models/cellular-immunity/lab.test.tsx`

**Interfaces:**
- Consumes: `getCellularSnapshot()`。
- Produces: `<CellularImmunityLab />`。

- [ ] **Step 1: 写真实交互失败测试**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CellularImmunityLab } from "../../../models/06-cellular-immunity/CellularImmunityLab";

describe("CellularImmunityLab", () => {
  it("shows the ordered cellular process", () => {
    render(<CellularImmunityLab />);
    expect(screen.getByText("细胞毒性 T 细胞活化")).toBeInTheDocument();
    expect(screen.getByText("特异性识别靶细胞")).toBeInTheDocument();
    expect(screen.getByText("靶细胞裂解")).toBeInTheDocument();
  });
  it("protects an unmatched target", () => {
    render(<CellularImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "感染细胞 B" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "14" } });
    expect(screen.getByText(/不能特异性识别，因此不裂解/)).toBeInTheDocument();
  });
  it("explains missing cytotoxic T cells", () => {
    render(<CellularImmunityLab />);
    fireEvent.click(screen.getByRole("button", { name: "缺少细胞毒性 T 细胞" }));
    expect(screen.getByText(/不能执行靶细胞裂解/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/cellular-immunity/lab.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现流程和靶细胞交互**

`CellularImmunityLab` 维护靶细胞、T 细胞特异性、暴露次数、记忆特异性、干预条件、时间、播放和速度。`CellularProcessView` 显示辅助性 T 细胞、细胞毒性 T 细胞、匹配受体/抗原标志、克隆扩增、接触和裂解；不匹配时保留距离并显示原因。`CellularChart` 绘制效应细胞增殖与靶细胞数量变化，二次反应叠加初次反应虚线。

- [ ] **Step 4: 页面、样式和教学解释**

阶段卡使用“发生了什么、为什么能识别、结果是什么”结构；正常细胞和感染细胞除颜色外还用形状/标签区分。暂停时所有运动停止；小屏流程纵向排列；提供可见焦点和减少动态效果支持。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- tests/models/cellular-immunity && npm run lint && npm run build`

Expected: 全部通过。

```bash
git add models/06-cellular-immunity app/models/cellular-immunity tests/models/cellular-immunity
git commit -m "feat: add cellular immunity interactive model"
```
