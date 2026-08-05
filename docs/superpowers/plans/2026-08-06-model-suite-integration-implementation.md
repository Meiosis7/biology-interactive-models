# 生物交互模型套件集成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将动作电位和新建的五个模型整合为一个统一入口、六个独立路由和一致的导航体验，并完成全量验证。

**Architecture:** `models/catalog.ts` 成为六个模型的唯一目录数据源；首页只渲染目录，`ModelNav` 为各实验页提供返回、上一项和下一项；现有动作电位组件保持内部实现不变，只迁移装配路由。全局元数据和 README 改为模型套件描述。

**Tech Stack:** Vinext、React、TypeScript、CSS、Vitest、Testing Library、Sites hosting configuration。

## Global Constraints

- 首页按“动作电位 → 突触传递 → 膜电位曲线 → 电表偏转 → 体液免疫 → 细胞免疫”排列六张卡片。
- 每个模型保留独立文件夹和独立 URL，不把业务逻辑集中到共享目录。
- 共享层只包含目录数据与导航外壳，不抽象各模型状态机。
- 现有动作电位的 35 项测试和所有交互行为不得回归。
- 每个页面都必须能直接刷新访问；所有链接使用站内路径。

---

### Task 1: 模型目录数据和测试

**Files:**
- Create: `models/catalog.ts`
- Create: `tests/model-catalog.test.ts`

**Interfaces:**
- Produces: `ModelCatalogItem`、`MODEL_CATALOG`、`getAdjacentModels(slug)`。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from "vitest";
import { MODEL_CATALOG, getAdjacentModels } from "../models/catalog";

describe("model catalog", () => {
  it("lists six unique models in teaching order", () => {
    expect(MODEL_CATALOG.map((item) => item.slug)).toEqual([
      "action-potential",
      "synapse-transmission",
      "membrane-potential-curve",
      "meter-deflection",
      "humoral-immunity",
      "cellular-immunity",
    ]);
    expect(new Set(MODEL_CATALOG.map((item) => item.href)).size).toBe(6);
  });
  it("returns cyclic previous and next entries", () => {
    const adjacent = getAdjacentModels("action-potential");
    expect(adjacent.previous.slug).toBe("cellular-immunity");
    expect(adjacent.next.slug).toBe("synapse-transmission");
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/model-catalog.test.ts`

Expected: FAIL。

- [ ] **Step 3: 实现目录数据**

每项固定包含 `slug`、`order`、中文标题、英文短标签、简介、三个知识点、`href` 和主题色。`getAdjacentModels()` 对首尾循环，未知 slug 抛出带名称的错误。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/model-catalog.test.ts`

Expected: 2 tests PASS。

```bash
git add models/catalog.ts tests/model-catalog.test.ts
git commit -m "feat: add biology model catalog"
```

---

### Task 2: 六模型总入口

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Create: `components/model-shell/ModelHub.tsx`
- Create: `components/model-shell/model-shell.css`
- Create: `tests/model-hub.test.tsx`

**Interfaces:**
- Consumes: `MODEL_CATALOG`。
- Produces: 首页六模型卡片和继续学习入口。

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelHub } from "../components/model-shell/ModelHub";

describe("ModelHub", () => {
  it("renders six accessible model links", () => {
    render(<ModelHub />);
    expect(screen.getAllByRole("link", { name: /进入模型/ })).toHaveLength(6);
  });
  it("shows all model titles", () => {
    render(<ModelHub />);
    for (const title of ["动作电位", "突触传递", "膜电位变化曲线", "电表指针偏转", "体液免疫", "细胞免疫"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/model-hub.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现首页**

`ModelHub` 展示课程标题、总说明、六张按序编号的卡片以及“教学时间均为示意”的总提示。每张卡片含标题、简介、三个知识点和明确的“进入模型”链接。桌面两列或三列，小屏单列；卡片悬停和键盘焦点状态一致。

- [ ] **Step 4: GREEN 并提交**

Run: `npm test -- tests/model-hub.test.tsx`

Expected: 2 tests PASS。

```bash
git add app/page.tsx app/globals.css components/model-shell tests/model-hub.test.tsx
git commit -m "feat: add biology model hub"
```

---

### Task 3: 模型导航与动作电位路由迁移

**Files:**
- Create: `components/model-shell/ModelNav.tsx`
- Create: `app/models/action-potential/page.tsx`
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Create: `tests/model-navigation.test.tsx`

**Interfaces:**
- Consumes: `getAdjacentModels()`。
- Produces: `<ModelNav currentSlug="..." />` 与动作电位独立路由。

- [ ] **Step 1: 写失败测试**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModelNav } from "../components/model-shell/ModelNav";

describe("ModelNav", () => {
  it("links back to the hub and adjacent models", () => {
    render(<ModelNav currentSlug="action-potential" />);
    expect(screen.getByRole("link", { name: "全部模型" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /上一个：细胞免疫/ })).toHaveAttribute("href", "/models/cellular-immunity");
    expect(screen.getByRole("link", { name: /下一个：突触传递/ })).toHaveAttribute("href", "/models/synapse-transmission");
  });
});
```

- [ ] **Step 2: 运行 RED**

Run: `npm test -- tests/model-navigation.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现导航并装配六页**

`ModelNav` 显示返回总入口、当前序号、上一项和下一项。动作电位页面导入现有 `ActionPotentialLab` 与样式，并在外层加入导航。其余五个页面同样加入 `ModelNav`，模型内部逻辑保持在各自文件夹。

- [ ] **Step 4: 验证原模型回归并提交**

Run: `npm test -- tests/model-navigation.test.tsx tests/action-potential`

Expected: 导航测试和原动作电位测试全部 PASS。

```bash
git add components/model-shell/ModelNav.tsx components/action-potential/ActionPotentialLab.tsx app/models tests/model-navigation.test.tsx
git commit -m "feat: add model navigation and action potential route"
```

---

### Task 4: 元数据、文档与全量验收

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tests/site-metadata.test.ts`
- Modify: `README.md`
- Modify: `public/og.png`
- Verify: `.openai/hosting.json`

- [ ] **Step 1: 更新元数据失败测试**

将 `tests/site-metadata.test.ts` 的预期标题更新为“高中生物动态交互模型”，描述需包含“动作电位、突触传递、免疫调节”，并断言 Open Graph 图片存在。

Run: `npm test -- tests/site-metadata.test.ts`

Expected: FAIL，因为旧元数据仍只描述动作电位。

- [ ] **Step 2: 更新站点信息和使用说明**

修改根元数据、页面语言描述和 README。README 列出六个本地 URL、启动命令、键盘操作、教学示意说明与各模型文件夹。生成与首页同风格的 1200×630 套件总览图并替换 `public/og.png`。

- [ ] **Step 3: 运行全量质量门禁**

Run: `npm test`

Expected: 全部测试 PASS。

Run: `npm run lint`

Expected: 0 errors。

Run: `npm run build`

Expected: 构建成功，输出首页和六个 `/models/*` 路由。

- [ ] **Step 4: 本地浏览器验收**

在 `http://localhost:3000/` 依次检查首页、六个模型路由、桌面宽度和窄屏宽度。每页至少执行一次播放、暂停、单步、拖动时间轴、重置、切换实验条件和上一/下一页导航；确认控制台无错误，暂停后动画静止。

- [ ] **Step 5: 最终提交**

```bash
git add app/layout.tsx tests/site-metadata.test.ts README.md public/og.png .openai/hosting.json
git commit -m "docs: finish biology interactive model suite"
```
