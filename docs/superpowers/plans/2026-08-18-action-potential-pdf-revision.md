# 动作电位 PDF 批注修订 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按批准的 PDF 修订设计，精简动作电位页面、改正教学文案，并确保刺激、通道、电荷与离子在上下膜严格对齐。

**Architecture:** 保留现有 `ActionPotentialLab` 状态机与七膜段共享纤维，只在页面入口移除跨模型导航，在 `simulation.ts` 和 `modeData.ts` 统一教学用语，在场景 CSS 中收短刺激线并为离子流补充可验证的通道轴语义。使用现有 Vitest/Testing Library 测试覆盖文案、逐步传导、四层电荷原子切换和上下膜通道路径，最后在桌面与手机视口进行真实浏览器验收。

**Tech Stack:** Next.js 15、React 19、TypeScript、CSS、Vitest、Testing Library、GitHub Pages。

## Global Constraints

- 三模式、产生模式循环播放、传导模式手动下一步、开放式纤维两端全部保留。
- 不出现“中央、中央膜段、第一轮、第二轮、第三轮、mV、-70”等禁用文案。
- 未兴奋电荷从上到下为 `＋−−＋`；兴奋电荷从上到下为 `−＋＋−`，切换必须原子完成。
- 上下膜 Na⁺通道同步开放，Na⁺必须沿通道孔中心进入膜内。
- 手机端无横向滚动，控制按钮在场景与知识卡之间，点击尺寸不小于 44px。
- 不增加新依赖，不重构动作电位模型之外的页面。

---

### Task 1: 页面精简与教学文案统一

**Files:**
- Modify: `app/models/action-potential/page.tsx`
- Modify: `components/action-potential/modeData.ts`
- Modify: `components/action-potential/simulation.ts`
- Modify: `tests/action-potential/simulation.test.ts`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes: `getActionPotentialFrame(mode, progress)` 与 `getConductionStepFrame(step, progress)`。
- Produces: 精确的阶段提示和知识卡文案；动作电位页只渲染 `ActionPotentialLab`。

- [ ] **Step 1: 写入失败的文案与页面精简测试**

在 `simulation.test.ts` 增加精确阶段提示断言：

```ts
it("uses local rather than central generation copy", () => {
  expect(getActionPotentialFrame("generation", 0.05).instruction).toBe("刺激局部神经纤维");
  expect(getActionPotentialFrame("generation", 0.25).instruction).toBe("局部 Na⁺通道开放");
  expect(getActionPotentialFrame("generation", 0.55).instruction).toBe("Na⁺从膜外进入膜内");
  expect(getActionPotentialFrame("generation", 0.9).instruction).toBe(
    "受刺激部位兴奋，膜外为负、膜内为正",
  );
  expect(getConductionStepFrame(0, 1).instruction).toBe("受刺激部位已经形成动作电位");
  expect(JSON.stringify([
    getActionPotentialFrame("generation", 0.05),
    getActionPotentialFrame("generation", 0.25),
    getActionPotentialFrame("generation", 0.55),
    getActionPotentialFrame("generation", 0.9),
    getConductionStepFrame(0, 1),
  ])).not.toMatch(/中央/);
});
```

在 `mode-components.test.tsx` 更新知识卡断言，并在 `lab.test.tsx` 增加源页面合同：

```ts
expect(ACTION_POTENTIAL_MODES[1].summary).toBe(
  "刺激使局部 Na⁺通道开放，Na⁺内流，受刺激部位膜外为负、膜内为正。",
);
expect(ACTION_POTENTIAL_MODES[1].facts[2]).toEqual({
  label: "结果",
  value: "受刺激部位膜外为负、膜内为正",
});
expect(ACTION_POTENTIAL_MODES[2].facts[0]).toEqual({
  label: "原因",
  value: "兴奋部位与未兴奋部位之间形成局部电流",
});

const pageSource = readFileSync("app/models/action-potential/page.tsx", "utf8");
expect(pageSource).not.toMatch(/ModelNav|model-shell/);
```

- [ ] **Step 2: 运行聚焦测试并确认 RED**

Run: `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: FAIL，旧文案仍含“中央膜段/中央 Na⁺通道”，知识卡仍用“外负内正”，页面仍导入 `ModelNav`。

- [ ] **Step 3: 最小实现页面与文案修订**

`app/models/action-potential/page.tsx` 只保留：

```tsx
import { ActionPotentialLab } from "../../../components/action-potential/ActionPotentialLab";
import "../../../components/action-potential/action-potential.css";

export default function ActionPotentialPage() {
  return <ActionPotentialLab />;
}
```

将 `modeData.ts` 的产生模式和传导原因改成批准文案，将 `simulation.ts` 的五处阶段提示改成 Step 1 的精确字符串，并把传导阶段提示改为：

```ts
instruction: "局部电流使相邻部位 Na⁺通道开放"
instruction: "Na⁺从上下通道进入相邻部位膜内"
instruction: "相邻部位形成动作电位"
```

- [ ] **Step 4: 运行聚焦测试并确认 GREEN**

Run: `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: PASS，且无控制台错误或 React 警告。

- [ ] **Step 5: 提交文案与页面精简**

```bash
git add app/models/action-potential/page.tsx components/action-potential/modeData.ts components/action-potential/simulation.ts tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
git commit -m "fix: align action potential teaching copy"
```

---

### Task 2: 通道轴、刺激线和离子穿膜路径

**Files:**
- Modify: `components/action-potential/IonStream.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/visual-contracts.test.ts`

**Interfaces:**
- Consumes: `IonStream` 的 `surface`、`species`、`direction` 属性。
- Produces: `data-stream-axis="channel-pore"` 浏览器验收标记；通道、电荷、离子流共用 `left: 50%`；刺激线终点停在上膜通道外侧。

- [ ] **Step 1: 写入失败的通道轴与刺激线测试**

在 `mode-components.test.tsx` 的上下膜 Na⁺测试中增加：

```ts
for (const stream of container.querySelectorAll('[data-ion-species="sodium"]')) {
  expect(stream).toHaveAttribute("data-stream-axis", "channel-pore");
}
```

在 `visual-contracts.test.ts` 增加：

```ts
it("aligns charges, channels, sodium streams, and stimulus without blocking the pore", () => {
  expect(ruleBody(".ap-segment-charge")).toMatch(/left:\s*50%/);
  expect(ruleBody(".ap-ion-channel")).toMatch(/left:\s*50%/);
  expect(ruleBody(".ap-ion-stream")).toMatch(/left:\s*50%/);
  const stimulus = ruleBody(".ap-stimulus");
  expect(stimulus).toMatch(/left:\s*50%/);
  expect(stimulus).toMatch(/top:\s*-82px/);
  expect(stimulus).toMatch(/height:\s*64px/);
  expect(stylesheet).toMatch(/@keyframes ap-ion-cross/);
  expect(stylesheet).not.toMatch(/ion-bypass|translateX\(var\(--ion-bypass/);
});
```

- [ ] **Step 2: 运行聚焦测试并确认 RED**

Run: `npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts`

Expected: FAIL，离子流缺少 `data-stream-axis`，刺激线仍为 `top: -68px; height: 72px`。

- [ ] **Step 3: 最小实现轴标记和不遮挡刺激线**

在 `IonStream.tsx` 根节点加入：

```tsx
data-stream-axis="channel-pore"
```

将刺激线修改为：

```css
.ap-stimulus {
  position: absolute;
  z-index: 8;
  left: 50%;
  top: -82px;
  width: 3px;
  height: 64px;
  background: var(--ap-red);
  transform: translateX(-50%);
}
```

保留 `ap-ion-cross` 纵向动画，不添加任何绕行横向位移。

- [ ] **Step 4: 运行聚焦测试并确认 GREEN**

Run: `npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交通道对齐修订**

```bash
git add components/action-potential/IonStream.tsx components/action-potential/action-potential.css tests/action-potential/mode-components.test.tsx tests/action-potential/visual-contracts.test.ts
git commit -m "fix: align ions with membrane channels"
```

---

### Task 3: 传导步骤、电荷原子切换与回归保护

**Files:**
- Modify: `tests/action-potential/simulation.test.ts`
- Modify: `tests/action-potential/mode-components.test.tsx`
- Modify: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes: 现有七步手动传导状态机与 `nextConductionStep()`。
- Produces: 对“局部电流 / 相邻动作电位”交替停留、四层电荷原子切换和终态停止的回归合同。

- [ ] **Step 1: 写入传导序列与禁用词回归测试**

在 `simulation.test.ts` 增加：

```ts
it("alternates local current and adjacent action potential until conducted", () => {
  expect([0, 1, 2, 3, 4, 5, 6].map((step) =>
    getConductionStepFrame(step as ConductionStep, 1).phase,
  )).toEqual([
    "excited",
    "local-current",
    "neighbor-excited",
    "local-current",
    "neighbor-excited",
    "local-current",
    "conducted",
  ]);
  expect(JSON.stringify([0, 1, 2, 3, 4, 5, 6].map((step) =>
    getConductionStepFrame(step as ConductionStep, 1).instruction,
  ))).not.toMatch(/中央|第[一二三123]轮|第\d+步/);
});
```

更新现有场景断言，将旧的“相邻膜段形成动作电位”改为“相邻部位形成动作电位”，并保留以下已有合同：

```ts
expect(chargesAt(2)).toEqual(["＋", "−", "−", "＋"]); // Na⁺内流时
expect(chargesAt(2)).toEqual(["−", "＋", "＋", "−"]); // 动作电位形成后
expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);
```

- [ ] **Step 2: 运行传导聚焦测试并确认 RED**

Run: `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: 若 Task 1 文案已正确，新增序列测试直接保护现状；为验证测试有效性，临时把一个期望阶段改成错误值观察 FAIL，恢复正确值后再继续。

- [ ] **Step 3: 运行传导聚焦测试并确认 GREEN**

Run: `npm test -- tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx`

Expected: PASS；七个宏步骤交替正确，传导终态为 `conducted`，没有轮次或步数文案。

- [ ] **Step 4: 提交传导回归合同**

```bash
git add tests/action-potential/simulation.test.ts tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
git commit -m "test: protect action potential relay sequence"
```

---

### Task 4: 完整验证与真实浏览器验收

**Files:**
- Modify only if a defect is reproduced with a failing regression test.

**Interfaces:**
- Consumes: Tasks 1–3 的完整实现。
- Produces: 自动化、构建、桌面/手机视觉与交互证据。

- [ ] **Step 1: 运行动作电位聚焦测试**

Run: `npm test -- tests/action-potential`

Expected: 所有动作电位测试 PASS，0 failures。

- [ ] **Step 2: 运行完整自动验证链**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: 全量测试、代码检查、生产构建和差异检查全部 exit 0。

- [ ] **Step 3: 在真实浏览器验收桌面端**

在 `1280×720` 视口逐项确认：

```text
无上一个/下一个导航；三模式按钮存在；七个膜段完整；产生模式四阶段循环；
上下膜 Na⁺通道同步开放；六个 Na⁺沿通道中心进入；电荷只出现 ＋−−＋ 或 −＋＋−；
传导每次点击只推进一个宏步骤；局部电流每次四条短弧由尾端向箭头端绘制；终态停止。
```

- [ ] **Step 4: 在真实浏览器验收手机端**

在 `390×844` 视口确认：

```text
document.scrollWidth === document.clientWidth；七段全部可见；开放端没有竖直封口；
刺激线、四层电荷、上下通道和离子流均在各段竖直中心线上；
下一步和重新演示紧邻场景且按钮高度不小于 44px；无文字、粒子、通道或局部电流重叠。
```

- [ ] **Step 5: 检查控制台与 reduced-motion**

确认控制台 error/warning 为 0；运行：

`npm test -- tests/action-potential/lab.test.tsx -t "reduced motion"`

Expected: reduced-motion 专项 PASS，0 RAF，播放控件禁用，模式与传导步骤仍可切换。

- [ ] **Step 6: 提交浏览器验收中产生的回归修复（如有）**

每个实际缺陷必须先补失败测试，再做最小修复；若没有缺陷，不创建空提交。

---

## 自审结果

- Spec coverage：页面精简、全部批准文案、上下膜通道、直线离子路径、四层电荷、逐步传导、移动端控件、reduced-motion 与发布前验证均已映射到任务。
- Placeholder scan：计划中不存在 TBD、TODO 或未定义实现步骤。
- Type consistency：沿用现有 `ActionPotentialFrame`、`ActionPotentialMode`、`ConductionStep`、`MembraneSurface` 与组件属性，不新增不匹配接口。
