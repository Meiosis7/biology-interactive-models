# 兴奋在突触处的传递 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可切换兴奋性/抑制性突触及三种干预条件的化学突触动态交互模型。

**Architecture:** `simulation.ts` 以教学时间、突触类型和实验条件派生唯一快照；`SynapseLab.tsx` 负责播放状态，结构视图、膜电位曲线和解释卡只消费同一快照。模型独立放在 `models/02-synapse-transmission/`，页面路由只负责装配。

**Tech Stack:** React、TypeScript、CSS、HTML Canvas、Vitest、Testing Library。

## Global Constraints

- 严格使用高中生物范围，不展开受体亚型和通道动力学方程。
- 正常顺序为动作电位到达、Ca²⁺内流、小泡融合、递质释放、受体结合、突触后效应、递质清除。
- 化学突触单向传递并存在突触延搁。
- 兴奋性与抑制性模式必须产生方向不同的突触后膜电位变化。
- 暂停后 Ca²⁺、小泡和递质动画全部停止。
- 时间、粒子和数量均标明为教学示意。

---

### Task 1: 突触状态机

**Files:**
- Create: `models/02-synapse-transmission/types.ts`
- Create: `models/02-synapse-transmission/simulation.ts`
- Create: `tests/models/synapse-transmission/simulation.test.ts`

**Interfaces:**
- Produces: `SynapseSettings`、`SynapseSnapshot`、`SYNAPSE_DURATION`、`getSynapseSnapshot(time, settings)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { getSynapseSnapshot } from "../../../models/02-synapse-transmission/simulation";

describe("synapse simulation", () => {
  const normal = { kind: "excitatory", condition: "normal" } as const;
  it("orders calcium, release, binding and response", () => {
    expect(getSynapseSnapshot(2, normal).stage).toBe("calcium-entry");
    expect(getSynapseSnapshot(3, normal).stage).toBe("vesicle-fusion");
    expect(getSynapseSnapshot(4, normal).stage).toBe("transmitter-release");
    expect(getSynapseSnapshot(5, normal).stage).toBe("receptor-binding");
    expect(getSynapseSnapshot(6, normal).stage).toBe("postsynaptic-response");
  });
  it("separates excitatory and inhibitory voltage effects", () => {
    expect(getSynapseSnapshot(6, normal).postsynapticMv).toBeGreaterThan(-70);
    expect(getSynapseSnapshot(6, { ...normal, kind: "inhibitory" }).postsynapticMv).toBeLessThan(-70);
  });
  it("blocks release when calcium channels are blocked", () => {
    const value = getSynapseSnapshot(5, { ...normal, condition: "calcium-blocked" });
    expect(value.calciumEntering).toBe(false);
    expect(value.transmitterReleased).toBe(false);
  });
  it("allows release but prevents response when receptors are blocked", () => {
    const value = getSynapseSnapshot(6, { ...normal, condition: "receptor-blocked" });
    expect(value.transmitterReleased).toBe(true);
    expect(value.receptorsActive).toBe(false);
    expect(value.postsynapticMv).toBe(-70);
  });
  it("extends the response when clearance is inhibited", () => {
    expect(getSynapseSnapshot(8, { ...normal, condition: "clearance-inhibited" }).postsynapticMv).toBeGreaterThan(-70);
    expect(getSynapseSnapshot(8, normal).postsynapticMv).toBe(-70);
  });
});
```

- [ ] **Step 2: 运行并确认因固定骨架返回值而产生断言失败**

Run: `npm test -- tests/models/synapse-transmission/simulation.test.ts`

Expected: 至少 4 项断言 FAIL，且不是导入或语法错误。

- [ ] **Step 3: 实现类型和状态机**

```ts
export type SynapseKind = "excitatory" | "inhibitory";
export type SynapseCondition = "normal" | "calcium-blocked" | "receptor-blocked" | "clearance-inhibited";
export type SynapseStage = "resting" | "arrival" | "calcium-entry" | "vesicle-fusion" | "transmitter-release" | "receptor-binding" | "postsynaptic-response" | "clearance";
export interface SynapseSettings { kind: SynapseKind; condition: SynapseCondition; }
export interface SynapseSnapshot {
  stage: SynapseStage;
  calciumEntering: boolean;
  vesiclesFusing: boolean;
  transmitterReleased: boolean;
  receptorsActive: boolean;
  postsynapticMv: number;
  transmitterLevel: number;
}
```

`getSynapseSnapshot()` 使用 0–9 教学时间单位，阶段边界依次为 1、2、3、4、5、6、7；正常模式在 8 时恢复静息。`calcium-blocked` 从 Ca²⁺环节起阻止释放；`receptor-blocked` 保留释放但固定 −70 mV；`clearance-inhibited` 将清除延长到 9。

- [ ] **Step 4: 运行测试并提交**

Run: `npm test -- tests/models/synapse-transmission/simulation.test.ts`

Expected: 5 tests PASS。

```bash
git add models/02-synapse-transmission tests/models/synapse-transmission
git commit -m "feat: add synapse transmission simulation"
```

---

### Task 2: 突触实验台、曲线和页面

**Files:**
- Create: `models/02-synapse-transmission/SynapseLab.tsx`
- Create: `models/02-synapse-transmission/SynapseView.tsx`
- Create: `models/02-synapse-transmission/SynapseChart.tsx`
- Create: `models/02-synapse-transmission/synapse.css`
- Create: `app/models/synapse-transmission/page.tsx`
- Create: `tests/models/synapse-transmission/lab.test.tsx`

**Interfaces:**
- Consumes: `getSynapseSnapshot()`。
- Produces: `<SynapseLab />` 独立页面实验组件。

- [ ] **Step 1: 写真实组件失败测试**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SynapseLab } from "../../../models/02-synapse-transmission/SynapseLab";

describe("SynapseLab", () => {
  it("switches between excitatory and inhibitory effects", () => {
    render(<SynapseLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    expect(screen.getByText(/突触后膜电位升高/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "抑制性突触" }));
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "6" } });
    expect(screen.getByText(/突触后膜电位降低/)).toBeInTheDocument();
  });
  it("resets after an intervention changes", () => {
    render(<SynapseLab />);
    fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "阻断 Ca²⁺通道" }));
    expect(screen.getByLabelText("教学时间")).toHaveValue("0");
  });
  it("exposes the chemical-synapse direction", () => {
    render(<SynapseLab />);
    expect(screen.getByText(/化学突触主要由突触前膜传向突触后膜/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行并确认组件缺失或行为断言失败**

Run: `npm test -- tests/models/synapse-transmission/lab.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现实验台**

`SynapseLab` 默认设置为 `{ kind: "excitatory", condition: "normal" }`，统一维护 `time`、`playing`、`speed`。设置改变时停止并归零。`SynapseView` 使用 DOM/CSS 形状展示上下膜、Ca²⁺、小泡、递质和受体；只有 `playing` 为真时添加运动类。`SynapseChart` 使用 Canvas 绘制 −70 mV 基线及兴奋/抑制方向曲线。解释卡按阶段显示事件、位置、原因和结果。

- [ ] **Step 4: 完成独立页面和样式**

`app/models/synapse-transmission/page.tsx` 导入 `SynapseLab` 与 `synapse.css`。样式复用现有设计令牌，760 px 以下单列，所有按钮最小高度 44 px，提供 `:focus-visible` 与 `prefers-reduced-motion`。

- [ ] **Step 5: 验证并提交**

Run: `npm test -- tests/models/synapse-transmission && npm run lint && npm run build`

Expected: 全部通过。

```bash
git add models/02-synapse-transmission app/models/synapse-transmission tests/models/synapse-transmission
git commit -m "feat: add synapse transmission interactive model"
```

