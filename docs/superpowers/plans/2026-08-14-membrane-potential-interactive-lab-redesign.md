# 膜电位动态交互模型重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将膜电位页面重做为无资料来源文案、所有核心操作始终可见的一页式动态实验台。

**Architecture:** 保留 `getCurveSnapshot(time, intensity)` 作为唯一状态源；`MembraneCurveLab` 管理播放、刺激与对比状态；`CurveCanvas` 和 `MembraneView` 分别渲染曲线与膜部位。不增加数据库、网络请求或新依赖。

**Tech Stack:** React 19、TypeScript、Canvas、CSS、Vitest、Testing Library。

## Global Constraints

- 成品不出现“PDF”、“教材”、“根据资料”。
- 静息电位约 -70 mV，阈电位约 -55 mV，峰值约 +30 mV。
- 阈刺激与强刺激的单次动作电位峰值相同。
- 去极化联动 Na⁺ 内流，复极化和恢复期联动 K⁺ 外流。
- 核心控件始终可见，支持键盘和触摸操作。

---

### Task 1: 实验台行为契约

**Files:**
- Modify: `tests/models/membrane-potential-curve/lab.test.tsx`
- Modify: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`

**Interfaces:**
- Consumes: `getCurveSnapshot(time: number, intensity: CurveIntensity): CurveSnapshot`
- Produces: 始终可见的刺激、播放、时间和对比控件。

- [ ] **Step 1: Write failing interaction tests**

测试直接查找“弱刺激”、“阈刺激”、“强刺激”、“时间轴”、“对比曲线”，并断言页面不含“基础引导”和“辨析模式”。拖动到 2.5 后断言显示“去极化”和“Na⁺ 内流”。

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: FAIL because the existing model hides controls in an advanced panel and still renders the old guidance flow.

- [ ] **Step 3: Implement the compact lab shell**

移除问答和引导状态，保留 `intensity`、`time`、`playing`、`speed`、`compare`；将所有控件放在一个始终可见的 `section[aria-label="实验控制台"]` 中。

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: all lab tests PASS.

### Task 2: 曲线与膜场景重绘

**Files:**
- Modify: `models/03-membrane-potential-curve/CurveCanvas.tsx`
- Modify: `models/03-membrane-potential-curve/MembraneView.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Test: `tests/models/membrane-potential-curve/lab.test.tsx`

**Interfaces:**
- Consumes: `CurveSnapshot`
- Produces: 当前点可读取的响应式 Canvas 和水平膜剖面。

- [ ] **Step 1: Add failing visual-contract tests**

断言曲线区具有“在曲线上拖动时间”语义，膜场景存在“膜外”、“膜内”、Na⁺ 通道和 K⁺ 通道，并在阶段切换时更新开放状态。

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: FAIL on the new curve interaction and membrane layout contract.

- [ ] **Step 3: Implement pointer control and membrane scene**

`CurveCanvas` 接收 `onTimeChange(nextTime: number)`，通过 pointer 坐标换算 0-6 时间并支持拖动。`MembraneView` 以膜外-磷脂双分子层-膜内的水平结构展示通道和离子方向。

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Expected: all lab tests PASS.

### Task 3: 独立包同步与验证

**Files:**
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/`
- Modify: `membrane-potential-curve-standalone/app/layout.tsx`
- Replace: `membrane-potential-curve-standalone/out/`
- Replace: `膜电位变化曲线-动态交互模型-2026-08-14.zip`

**Interfaces:**
- Consumes: 已验证的模型源文件。
- Produces: 可双击打开的 Mac 独立网页包。

- [ ] **Step 1: Sync only required source files**

复制 `MembraneCurveLab.tsx`、`CurveCanvas.tsx`、`MembraneView.tsx`、`simulation.ts`、`types.ts` 和 `membrane-curve.css`，不复制旧的问答与引导组件。

- [ ] **Step 2: Build the standalone export**

Run: `npm run build`

Expected: static export completes and writes `out/index.html`.

- [ ] **Step 3: Verify content and launchability**

Run: `rg -n 'PDF|教材|基础引导|辨析模式' out/index.html out/_next/static/chunks || true`

Expected: no matches in product content.

- [ ] **Step 4: Package and test the archive**

Run: `zip -r '膜电位变化曲线-动态交互模型-2026-08-14.zip' membrane-potential-curve-standalone && unzip -t '膜电位变化曲线-动态交互模型-2026-08-14.zip'`

Expected: archive integrity check reports no errors.

### Task 4: 全量验证

**Files:**
- Verify all modified files.

**Interfaces:**
- Produces: 可交付的完整产物。

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

- [ ] **Step 2: Run full build**

Run: `npm run build`

Expected: build exits 0.

- [ ] **Step 3: Check requirements and archive**

检查页面文字、独立包 HTML、压缩包完整性和本地 HTTP 200 响应。
