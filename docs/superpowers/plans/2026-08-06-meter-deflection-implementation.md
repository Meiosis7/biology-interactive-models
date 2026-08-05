# 电表指针偏转 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可移动刺激点和电极、可交换导线并能解释偏转方向的电表动态交互模型。

**Architecture:** `simulation.ts` 根据记录方式、电极位置、刺激位置和教学时间计算 A/B 电极电位及电势差；实验台、神经纤维图、电表和双通道曲线共同消费同一 `MeterSnapshot`，确保“波到哪里—两极各测到什么—指针为何偏转”完全同步。

**Tech Stack:** React、TypeScript、CSS、SVG、HTML Canvas、Vitest、Testing Library。

## Global Constraints

- 电表读数统一定义为 `U = V_A − V_B`，交换导线只改变读数符号，不改变兴奋传导。
- 双侧细胞外记录中，两电极状态相同时电势差接近 0；兴奋先后到达时产生方向相反的两次偏转。
- 等距布置时兴奋同时到达两电极，电势差接近 0。
- 跨膜记录与双侧细胞外记录必须明确区分，不能混用结论。
- 所有距离、电压和时间均为教学示意；暂停时波前、曲线游标和指针同时停止。

---

### Task 1: 电极电位与指针状态机

**Files:**
- Create: `models/04-meter-deflection/types.ts`
- Create: `models/04-meter-deflection/simulation.ts`
- Create: `tests/models/meter-deflection/simulation.test.ts`

**Interfaces:**
- Produces: `RecordingMode`、`MeterSettings`、`MeterSnapshot`、`METER_DURATION`、`getMeterSnapshot(time, settings)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { getMeterSnapshot } from "../../../models/04-meter-deflection/simulation";

describe("meter deflection simulation", () => {
  const normal = {
    mode: "extracellular",
    stimulusPosition: 10,
    electrodeA: 35,
    electrodeB: 70,
    leadsReversed: false,
  } as const;

  it("deflects in opposite directions when excitation reaches A then B", () => {
    expect(getMeterSnapshot(3.5, normal).differenceMv).toBeLessThan(0);
    expect(getMeterSnapshot(6.5, normal).differenceMv).toBeGreaterThan(0);
  });
  it("reverses only the pointer sign after swapping leads", () => {
    const original = getMeterSnapshot(3.5, normal);
    const reversed = getMeterSnapshot(3.5, { ...normal, leadsReversed: true });
    expect(reversed.differenceMv).toBe(-original.differenceMv);
    expect(reversed.wavefronts).toEqual(original.wavefronts);
  });
  it("stays near zero for equidistant simultaneous arrival", () => {
    const value = getMeterSnapshot(5, {
      ...normal,
      mode: "equidistant",
      stimulusPosition: 50,
      electrodeA: 30,
      electrodeB: 70,
    });
    expect(Math.abs(value.differenceMv)).toBeLessThan(0.01);
  });
  it("keeps extracellular difference near zero when both sites share a state", () => {
    expect(getMeterSnapshot(0, normal).differenceMv).toBe(0);
    expect(getMeterSnapshot(9, normal).differenceMv).toBe(0);
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/meter-deflection/simulation.test.ts`

Expected: 行为断言 FAIL，且无导入或语法错误。

- [ ] **Step 3: 实现确定性计算**

```ts
export type RecordingMode = "extracellular" | "transmembrane" | "equidistant";
export interface MeterSettings {
  mode: RecordingMode;
  stimulusPosition: number;
  electrodeA: number;
  electrodeB: number;
  leadsReversed: boolean;
}
export interface MeterSnapshot {
  stage: "resting" | "approaching-a" | "at-a" | "between" | "at-b" | "passed" | "simultaneous";
  voltageA: number;
  voltageB: number;
  differenceMv: number;
  pointerAngle: number;
  arrivalA: number;
  arrivalB: number;
  wavefronts: number[];
}
```

用刺激点到电极的距离计算到达时间。细胞外兴奋点相对静息点取负向变化；跨膜记录使用典型动作电位快照；`differenceMv` 先计算 A−B，再根据 `leadsReversed` 反号；指针角度限制在 −42° 至 +42°。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/models/meter-deflection/simulation.test.ts`

Expected: 4 tests PASS。

```bash
git add models/04-meter-deflection tests/models/meter-deflection
git commit -m "feat: add meter deflection simulation"
```

---

### Task 2: 电表实验台、预设与解释链

**Files:**
- Create: `models/04-meter-deflection/MeterDeflectionLab.tsx`
- Create: `models/04-meter-deflection/NerveElectrodeView.tsx`
- Create: `models/04-meter-deflection/AnalogMeter.tsx`
- Create: `models/04-meter-deflection/ElectrodeChart.tsx`
- Create: `models/04-meter-deflection/meter-deflection.css`
- Create: `app/models/meter-deflection/page.tsx`
- Create: `tests/models/meter-deflection/lab.test.tsx`

**Interfaces:**
- Consumes: `getMeterSnapshot()`。
- Produces: `<MeterDeflectionLab />` 独立页面实验组件。

- [ ] **Step 1: 写真实交互失败测试**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeterDeflectionLab } from "../../../models/04-meter-deflection/MeterDeflectionLab";

describe("MeterDeflectionLab", () => {
  it("shows the voltage subtraction rule", () => {
    render(<MeterDeflectionLab />);
    expect(screen.getByText(/U = V_A − V_B/)).toBeInTheDocument();
  });
  it("reverses the displayed sign when leads are swapped", () => {
    render(<MeterDeflectionLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "3.5" } });
    const before = screen.getByTestId("meter-difference").textContent;
    fireEvent.click(screen.getByRole("button", { name: "交换导线" }));
    expect(screen.getByTestId("meter-difference").textContent).not.toBe(before);
  });
  it("loads an equidistant preset", () => {
    render(<MeterDeflectionLab />);
    fireEvent.click(screen.getByRole("button", { name: "等距同时到达" }));
    expect(screen.getByText(/同时到达.*接近 0/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/models/meter-deflection/lab.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现实验台与可视化**

`MeterDeflectionLab` 维护记录方式、三个位置、导线方向、时间、播放和速度。提供“双侧细胞外”“跨膜记录”“等距同时到达”预设；参数改变后停止并归零。`NerveElectrodeView` 用位置滑杆和 SVG 同时显示刺激点、A/B 电极及波前。`AnalogMeter` 用 SVG 绘制表盘和指针。`ElectrodeChart` 绘制 `V_A`、`V_B`、`V_A−V_B` 三条同步曲线。

- [ ] **Step 4: 完成解释链、页面和样式**

解释区固定展示“兴奋到达位置 → A/B 电位 → 电势差计算 → 指针方向”四步，并提供可关闭提示。小屏改为单列；位置控件需有可见数值和键盘操作；降低动态效果时关闭波前拖影。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- tests/models/meter-deflection && npm run lint && npm run build`

Expected: 全部通过。

```bash
git add models/04-meter-deflection app/models/meter-deflection tests/models/meter-deflection
git commit -m "feat: add meter deflection interactive model"
```
