# 膜电位变化曲线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建探究、对比和阶段辨析三种模式的膜电位曲线交互模型。

**Architecture:** 复用动作电位模型经过验证的典型曲线纯函数，但在独立文件夹中增加曲线模式、游标派生和题目生成；Canvas、膜剖面和答题区只消费同一 `CurveSnapshot`。

**Tech Stack:** React、TypeScript、CSS、Canvas、Vitest、Testing Library。

## Global Constraints

- 静息约 −70 mV、阈电位约 −55 mV、峰值约 +30 mV。
- 阈刺激与强刺激的单个动作电位峰值相同；弱刺激只产生局部电位。
- 去极化对应 Na⁺内流，复极化对应 K⁺外流。
- 使用教学时间单位，不模拟频率编码。
- 游标、膜剖面、通道、解释和答题反馈必须同步。

---

### Task 1: 曲线逻辑与辨析题

**Files:**
- Create: `models/03-membrane-potential-curve/types.ts`
- Create: `models/03-membrane-potential-curve/simulation.ts`
- Create: `tests/models/membrane-potential-curve/simulation.test.ts`

**Interfaces:**
- Produces: `CurveIntensity`、`CurveStage`、`CurveSnapshot`、`getCurveSnapshot(time, intensity)`、`checkCurveAnswer(stage, answer)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { checkCurveAnswer, getCurveSnapshot } from "../../../models/03-membrane-potential-curve/simulation";

describe("membrane potential curve", () => {
  it("keeps threshold and strong peaks equal", () => {
    expect(getCurveSnapshot(3, "threshold").mv).toBe(30);
    expect(getCurveSnapshot(3, "strong").mv).toBe(30);
  });
  it("keeps weak stimulation subthreshold", () => {
    expect(getCurveSnapshot(3, "weak").mv).toBeLessThan(-55);
    expect(getCurveSnapshot(3, "weak").stage).toBe("local");
  });
  it("maps depolarization and repolarization to ions", () => {
    expect(getCurveSnapshot(2.5, "threshold").ionFlow).toBe("sodium-in");
    expect(getCurveSnapshot(4.2, "threshold").ionFlow).toBe("potassium-out");
  });
  it("checks stage, ion and polarity together", () => {
    expect(checkCurveAnswer("peak", { stage: "peak", ionFlow: "none", insidePolarity: "positive" }).correct).toBe(true);
    expect(checkCurveAnswer("peak", { stage: "repolarization", ionFlow: "potassium-out", insidePolarity: "negative" }).correct).toBe(false);
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/membrane-potential-curve/simulation.test.ts`

Expected: 行为断言 FAIL。

- [ ] **Step 3: 实现纯函数**

```ts
export type CurveIntensity = "weak" | "threshold" | "strong";
export type CurveStage = "resting" | "local" | "threshold" | "depolarization" | "peak" | "repolarization" | "recovery";
export type CurveAnswer = { stage: CurveStage; ionFlow: "none" | "sodium-in" | "potassium-out"; insidePolarity: "negative" | "positive" };
export type CurveSnapshot = CurveAnswer & { mv: number; sodiumOpen: boolean; potassiumOpen: boolean; };
```

曲线阶段和电位采用独立确定性分段函数。`checkCurveAnswer()` 返回 `{ correct, expected, explanation }`，解释必须说明阶段、主要离子运动和膜内外相对电性。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/models/membrane-potential-curve/simulation.test.ts`

Expected: 4 tests PASS。

```bash
git add models/03-membrane-potential-curve tests/models/membrane-potential-curve
git commit -m "feat: add membrane curve simulation"
```

---

### Task 2: 曲线实验台和三种模式

**Files:**
- Create: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`
- Create: `models/03-membrane-potential-curve/CurveCanvas.tsx`
- Create: `models/03-membrane-potential-curve/MembraneView.tsx`
- Create: `models/03-membrane-potential-curve/QuizPanel.tsx`
- Create: `models/03-membrane-potential-curve/membrane-curve.css`
- Create: `app/models/membrane-potential-curve/page.tsx`
- Create: `tests/models/membrane-potential-curve/lab.test.tsx`

**Interfaces:**
- Consumes: Task 1 纯函数。
- Produces: `<MembraneCurveLab />`。

- [ ] **Step 1: 写交互失败测试**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";

describe("MembraneCurveLab", () => {
  it("synchronizes cursor and ion explanation", () => {
    render(<MembraneCurveLab />);
    fireEvent.change(screen.getByLabelText("曲线游标"), { target: { value: "2.5" } });
    expect(screen.getByText("Na⁺ 内流")).toBeInTheDocument();
    expect(screen.getByText(/去极化/)).toBeInTheDocument();
  });
  it("overlays equal threshold and strong peaks", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "对比模式" }));
    expect(screen.getByText(/峰值相同/)).toBeInTheDocument();
  });
  it("gives quiz feedback", () => {
    render(<MembraneCurveLab />);
    fireEvent.click(screen.getByRole("button", { name: "辨析模式" }));
    expect(screen.getByRole("group", { name: "阶段选择" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现组件**

`MembraneCurveLab` 维护 `mode: "explore" | "compare" | "quiz"`、强度、游标、播放状态和答题状态。`CurveCanvas` 绘制坐标、−70/−55/0/+30 mV 文字线、当前阶段区间和游标；对比模式叠加三条可区分线型。`MembraneView` 展示通道和离子跨膜方向，暂停时静止。`QuizPanel` 使用固定阶段题库轮换，不随机依赖网络。

- [ ] **Step 4: 页面、样式和验证**

创建独立路由与局部样式；小屏单列，Canvas 固定响应式高度，按钮具有焦点和禁用状态。

Run: `npm test -- tests/models/membrane-potential-curve && npm run lint && npm run build`

Expected: 全部通过。

```bash
git add models/03-membrane-potential-curve app/models/membrane-potential-curve tests/models/membrane-potential-curve
git commit -m "feat: add membrane potential curve model"
```

