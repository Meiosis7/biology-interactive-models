# 膜电位模型单视角重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将膜电位实验台压缩为桌面端同一视口内始终可见的三行布局。

**Architecture:** `MembraneCurveLab` 组合紧凑状态栏、双画面主区和固定控制台。`CurveCanvas` 吸收对比结论，CSS 使用 `100svh` Grid 分配高度；手机媒体查询恢复自然高度。

**Tech Stack:** React 19、TypeScript、Canvas、CSS Grid、Vitest、Testing Library。

## Global Constraints

- 桌面端全过程不切换视角、不依赖纵向滚动。
- 曲线、膜场景、实时状态和全部控件同时可见。
- 不改变膜电位计算逻辑和既有交互 API。
- 宽度小于 800 px 时允许纵向滚动。

---

### Task 1: 单视口契约

**Files:**
- Create: `tests/models/membrane-potential-curve/single-viewport.test.ts`
- Modify: `app/models/membrane-potential-curve/page.tsx`
- Modify: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`
- Modify: `models/03-membrane-potential-curve/CurveCanvas.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`

**Interfaces:**
- Consumes: `MembraneCurveLab`、`CurveCanvasProps.compare`。
- Produces: `data-layout="single-viewport"` 和不占据新行的对比结论。

- [ ] **Step 1: Write failing structure and stylesheet tests**

```ts
expect(pageSource).not.toContain("ModelNav");
expect(labSource).toContain('data-layout="single-viewport"');
expect(styles).toMatch(/\.membrane-shell\s*\{[^}]*height:\s*100svh/s);
expect(styles).toMatch(/grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
expect(styles).toMatch(/\.membrane-workspace\s*\{[^}]*min-height:\s*0/s);
```

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/models/membrane-potential-curve/single-viewport.test.ts`

Expected: FAIL because the route still renders `ModelNav` and the shell uses content-driven height.

- [ ] **Step 3: Implement the three-row cockpit**

移除路由导航；将三个实时仪表移入顶部状态栏；从 `MembraneCurveLab` 移除独立的对比结论行，改由 `CurveCanvas` 在图例内显示。

- [ ] **Step 4: Implement viewport-bound CSS**

设置 `.membrane-shell { height: 100svh; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }`，让 `.membrane-workspace`、卡片、Canvas 和膜场景可以向下收缩，并在 `max-width: 800px` 下恢复 `height: auto; overflow: visible`。

- [ ] **Step 5: Run GREEN**

Run: `npm test -- tests/models/membrane-potential-curve`

Expected: all membrane-potential tests PASS.

### Task 2: 独立包与预览验证

**Files:**
- Sync: `membrane-potential-curve-standalone/models/03-membrane-potential-curve/`
- Replace: `膜电位变化曲线-动态交互模型-2026-08-15.zip`

**Interfaces:**
- Consumes: 单视口实验台。
- Produces: 可双击打开的新版独立网页包。

- [ ] **Step 1: Synchronize model files and build export**

Run: `npm run build` in `membrane-potential-curve-standalone`.

Expected: static export succeeds.

- [ ] **Step 2: Repackage the standalone product**

Run: `zip -r '膜电位变化曲线-动态交互模型-2026-08-15.zip' membrane-potential-curve-standalone` with build caches and dependencies excluded.

Expected: `unzip -t` reports no errors.

- [ ] **Step 3: Verify route and build**

Run: `npm test -- tests/models/membrane-potential-curve && npm run build`.

Expected: all focused tests pass and the application build exits 0.
