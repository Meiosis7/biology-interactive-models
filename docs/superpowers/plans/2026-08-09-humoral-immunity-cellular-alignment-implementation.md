# Humoral Immunity Cellular Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将体液免疫模型改造成与新版细胞免疫同构的七阶段教学实验台，并加入抗原与 BCR 独立选择产生的匹配/不匹配分支。

**Architecture:** 保持体液免疫的 `Lab → simulation snapshot → ProcessView/Chart` 单向数据流，不抽取跨模型通用组件。所有阶段、匹配、受阻、数量和曲线结果由 `getHumoralSnapshot()` 唯一决定，视图只根据快照渲染。

**Tech Stack:** React 19、TypeScript 5.9、Vitest 4、Testing Library、CSS。

## Global Constraints

- 时间轴固定为七阶段：抗原呈递、辅助性 T 细胞活化、B 细胞活化、克隆增殖、分化、抗体产生与结合、免疫记忆。
- 抗原 A/B 与 BCR A/B 必须独立可选；不匹配停在 B 细胞活化阶段。
- BCR 不匹配必须显示“未匹配”，与实验干预“缺少 B 细胞”的“过程受阻”区分。
- 记忆优势仅在二次免疫、记忆特异性匹配、BCR 匹配且无干预时生效。
- 不匹配或受阻时抗体、浆细胞、新记忆均为零，抗原维持 100，不显示初次反应虚线。
- 播放动画仅在播放状态运行，并继续支持 `prefers-reduced-motion`。
- 抗原 A/B 同时使用文字与不同形状，BCR A/B 使用显式文字标签，不得仅依赖颜色。
- 保留至少 44px 的按钮触摸高度和阶段级 `aria-live="polite"` 播报。
- 不新增运行时依赖，不修改其他模型、导航、首页或托管配置。

---

## File Map

- Modify: `models/05-humoral-immunity/types.ts` — 七阶段类型、BCR 设置和匹配快照字段。
- Modify: `models/05-humoral-immunity/simulation.ts` — 时间轴、匹配/受阻规则、数量与曲线数据。
- Modify: `models/05-humoral-immunity/HumoralImmunityLab.tsx` — 控制区、三项解释结构和状态选择。
- Modify: `models/05-humoral-immunity/HumoralProcessView.tsx` — 七阶段脊柱和四区过程场景。
- Modify: `models/05-humoral-immunity/AntibodyChart.tsx` — 匹配、未匹配、受阻和二次对照说明。
- Modify: `models/05-humoral-immunity/humoral-immunity.css` — 与细胞免疫一致的布局、状态和响应式规则。
- Modify: `tests/models/humoral-immunity/simulation.test.ts` — 模拟层行为回归。
- Modify: `tests/models/humoral-immunity/lab.test.tsx` — 控制、解释、场景、图表和无障碍回归。

---

### Task 1: 七阶段模拟与 BCR 匹配规则

**Files:**
- Modify: `tests/models/humoral-immunity/simulation.test.ts`
- Modify: `models/05-humoral-immunity/types.ts`
- Modify: `models/05-humoral-immunity/simulation.ts`

**Interfaces:**
- Consumes: `getHumoralSnapshot(time: number, settings: HumoralSettings): HumoralSnapshot`。
- Produces: `HumoralSettings.bCellSpecificity`, `HumoralSettings.memorySpecificity`, `HumoralSnapshot.bCellMatched` 以及七值 `HumoralStage`。

- [ ] **Step 1: 将基础设置补齐 BCR，并写七阶段失败测试**

在 `tests/models/humoral-immunity/simulation.test.ts` 中把 `normal` 改为：

```ts
const normal = {
  antigen: "A",
  bCellSpecificity: "A",
  exposure: "primary",
  memorySpecificity: "A",
  condition: "normal",
} as const;
```

将阶段顺序测试改为：

```ts
it("orders the seven-stage humoral response", () => {
  expect(getHumoralSnapshot(0, normal).stage).toBe("presentation");
  expect(getHumoralSnapshot(4, normal).stage).toBe("helper-activation");
  expect(getHumoralSnapshot(6, normal).stage).toBe("b-activation");
  expect(getHumoralSnapshot(8, normal).stage).toBe("clonal-expansion");
  expect(getHumoralSnapshot(10, normal).stage).toBe("differentiation");
  expect(getHumoralSnapshot(12, normal).stage).toBe("antibody-binding");
  expect(getHumoralSnapshot(16, normal).stage).toBe("memory");
});
```

- [ ] **Step 2: 运行阶段测试并确认因旧阶段名失败**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts -t "seven-stage"`

Expected: FAIL；第一个差异为实际阶段 `entry`，且 `antibody-binding` 尚未属于 `HumoralStage`。

- [ ] **Step 3: 写 BCR 不匹配与记忆匹配失败测试**

追加：

```ts
it("stops an unmatched BCR at B-cell activation", () => {
  const mismatch = { ...normal, bCellSpecificity: "B" } as const;
  const snapshot = getHumoralSnapshot(18, mismatch);

  expect(snapshot).toMatchObject({
    stage: "b-activation",
    blockedAt: "b-activation",
    bCellMatched: false,
    bCellActive: false,
    plasmaCount: 0,
    memoryCount: 0,
    antibodyLevel: 0,
    antigenLevel: 100,
    antibodyTarget: null,
  });
});

it("only grants memory advantage when memory and BCR both match", () => {
  const matched = {
    ...normal,
    exposure: "secondary",
    memorySpecificity: "A",
  } as const;
  const wrongMemory = { ...matched, memorySpecificity: "B" } as const;
  const wrongBcr = { ...matched, bCellSpecificity: "B" } as const;

  expect(getHumoralSnapshot(10, matched).memoryMatched).toBe(true);
  expect(getHumoralSnapshot(10, wrongMemory).memoryMatched).toBe(false);
  expect(getHumoralSnapshot(10, wrongBcr).memoryMatched).toBe(false);
  expect(getHumoralSnapshot(10, matched).antibodyLevel).toBeGreaterThan(
    getHumoralSnapshot(10, wrongMemory).antibodyLevel,
  );
});
```

- [ ] **Step 4: 运行新测试并确认缺少 BCR 行为**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts -t "BCR|memory advantage"`

Expected: FAIL；`bCellMatched` 为 `undefined`，且错误 BCR 仍会产生抗体。

- [ ] **Step 5: 更新类型为七阶段和显式特异性**

将 `models/05-humoral-immunity/types.ts` 更新为：

```ts
export type AntigenType = "A" | "B";
export type BCellSpecificity = AntigenType;

export type HumoralCondition =
  | "normal"
  | "presentation-blocked"
  | "helper-t-blocked"
  | "b-cell-missing";

export type HumoralStage =
  | "presentation"
  | "helper-activation"
  | "b-activation"
  | "clonal-expansion"
  | "differentiation"
  | "antibody-binding"
  | "memory";

export interface HumoralSettings {
  antigen: AntigenType;
  bCellSpecificity: BCellSpecificity;
  exposure: "primary" | "secondary";
  memorySpecificity: AntigenType;
  condition: HumoralCondition;
}

export interface HumoralSnapshot {
  stage: HumoralStage;
  blockedAt: HumoralStage | null;
  helperActive: boolean;
  bCellActive: boolean;
  bCellMatched: boolean;
  plasmaCount: number;
  memoryCount: number;
  antibodyLevel: number;
  antigenLevel: number;
  memoryMatched: boolean;
  antibodyTarget: AntigenType | null;
}
```

- [ ] **Step 6: 实现七阶段时间轴与统一的停止快照**

在 `simulation.ts` 中保留 `HUMORAL_DURATION = 18`，将时间轴与阶段表替换为：

```ts
type Timeline = Record<HumoralStage, number>;

const PRIMARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 3,
  "b-activation": 5,
  "clonal-expansion": 7,
  differentiation: 9,
  "antibody-binding": 11,
  memory: 16,
};

const MATCHED_SECONDARY_TIMELINE: Timeline = {
  presentation: 0,
  "helper-activation": 2,
  "b-activation": 3,
  "clonal-expansion": 4,
  differentiation: 5,
  "antibody-binding": 6,
  memory: 18,
};

const STAGES: HumoralStage[] = [
  "presentation",
  "helper-activation",
  "b-activation",
  "clonal-expansion",
  "differentiation",
  "antibody-binding",
  "memory",
];
```

把所有 `memoryAntigen` 改为 `memorySpecificity`，并把记忆条件集中为：

```ts
function isMemoryMatched(settings: HumoralSettings): boolean {
  return (
    settings.condition === "normal" &&
    settings.bCellSpecificity === settings.antigen &&
    settings.exposure === "secondary" &&
    settings.memorySpecificity === settings.antigen
  );
}
```

用以下函数替换旧的抗体、抗原和停止快照计算：

```ts
function getAntibodyLevel(
  time: number,
  timeline: Timeline,
  memoryMatched: boolean,
): number {
  const releaseStart = timeline["antibody-binding"];
  const peakTime = memoryMatched ? 12 : 14;
  const responseEnd = timeline.memory;
  const peak = memoryMatched ? 180 : 100;

  if (time < releaseStart || time >= responseEnd) return 0;
  if (time <= peakTime) {
    return Math.round(
      peak * Math.min(1, (time - releaseStart + 1) / (peakTime - releaseStart + 1)),
    );
  }

  return Math.round(
    peak * Math.max(0, 1 - (time - peakTime) / (responseEnd - peakTime)),
  );
}

function getAntigenLevel(time: number, timeline: Timeline): number {
  const releaseStart = timeline["antibody-binding"];
  const responseEnd = timeline.memory;

  if (time < releaseStart) return 100;
  if (time >= responseEnd) return 0;
  return Math.round(
    100 - (100 * (time - releaseStart)) / (responseEnd - releaseStart),
  );
}

function getStoppedSnapshot(
  time: number,
  settings: HumoralSettings,
  timeline: Timeline,
  blockedAt: HumoralStage,
  bCellMatched: boolean,
): HumoralSnapshot {
  const blockedStarted = time >= timeline[blockedAt];
  const stage = blockedStarted ? blockedAt : stageAt(time, timeline);
  const helperActive =
    time >= timeline["helper-activation"] &&
    blockedAt !== "helper-activation" &&
    blockedAt !== "presentation";

  return {
    stage,
    blockedAt,
    helperActive,
    bCellActive: false,
    bCellMatched,
    plasmaCount: 0,
    memoryCount: 0,
    antibodyLevel: 0,
    antigenLevel: 100,
    memoryMatched: false,
    antibodyTarget: null,
  };
}
```

`getHumoralSnapshot()` 在处理实验干预前先处理正常条件下的 BCR 不匹配：

```ts
const bCellMatched = settings.bCellSpecificity === settings.antigen;

if (settings.condition === "normal" && !bCellMatched) {
  return getStoppedSnapshot(
    currentTime,
    settings,
    timeline,
    "b-activation",
    false,
  );
}
```

实验干预调用 `getStoppedSnapshot(currentTime, settings, timeline, BLOCKED_STAGE[settings.condition], bCellMatched)`。正常快照返回 `bCellMatched: true`，并将 `timeline["antibody-binding"]` 用作浆细胞达到峰值的分母和抗体产生起点。

- [ ] **Step 7: 更新旧测试字段和阻断断言**

在本测试文件中将 `memoryAntigen` 全部改为 `memorySpecificity`；阶段断言中的 `entry`、`antibody-release`、`clearance` 按七阶段测试删除或改为 `presentation`、`antibody-binding`。保留三个干预条件，预期停止点分别为：

```ts
[
  ["presentation-blocked", "presentation"],
  ["helper-t-blocked", "helper-activation"],
  ["b-cell-missing", "b-activation"],
] as const
```

- [ ] **Step 8: 运行模拟层测试**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts`

Expected: PASS，且没有未处理异常或警告。

- [ ] **Step 9: 提交模拟层改动**

```bash
git add models/05-humoral-immunity/types.ts models/05-humoral-immunity/simulation.ts tests/models/humoral-immunity/simulation.test.ts
git commit -m "feat: add humoral BCR matching simulation"
```

---

### Task 2: 同构控制区与三项阶段解释

**Files:**
- Modify: `tests/models/humoral-immunity/lab.test.tsx`
- Modify: `models/05-humoral-immunity/HumoralImmunityLab.tsx`

**Interfaces:**
- Consumes: Task 1 的 `HumoralSettings.bCellSpecificity`、`memorySpecificity` 和 `HumoralSnapshot.bCellMatched`。
- Produces: BCR 控制按钮、匹配/未匹配解释和三项解释卡。

- [ ] **Step 1: 写控制区与七阶段失败测试**

将现有九列测试替换为：

```ts
it("shows the aligned seven-stage process", () => {
  render(<HumoralImmunityLab />);
  const spine = within(screen.getByLabelText("体液免疫有序流程"));

  expect(spine.getAllByText(/抗原呈递|辅助性 T 细胞活化|B 细胞活化|克隆增殖|分化|抗体产生与结合|免疫记忆/)).toHaveLength(7);
  expect(screen.queryByText("抗原进入")).not.toBeInTheDocument();
  expect(screen.queryByText("抗体结合并清除抗原")).not.toBeInTheDocument();
});

it("offers independent antigen and BCR controls", () => {
  render(<HumoralImmunityLab />);

  expect(screen.getByRole("button", { name: "抗原 A" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "BCR A" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "BCR B" })).toHaveAttribute("aria-pressed", "false");
});
```

- [ ] **Step 2: 运行测试并确认仍是九阶段且没有 BCR 控制**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx -t "aligned seven-stage|independent antigen"`

Expected: FAIL；流程仍有九个节点，且找不到 `BCR A`。

- [ ] **Step 3: 写未匹配与干预区分失败测试**

追加：

```ts
it("labels a BCR mismatch as unmatched", () => {
  render(<HumoralImmunityLab />);
  fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
  fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

  expect(screen.getByRole("heading", { name: "未匹配" })).toBeInTheDocument();
  expect(screen.getByText(/BCR B 只能特异识别抗原 B/)).toBeInTheDocument();
  expect(screen.getByText(/浆细胞 0，记忆 B 细胞 0，抗体相对量 0，抗原相对量 100/)).toBeInTheDocument();
});

it("distinguishes a missing B cell from a receptor mismatch", () => {
  render(<HumoralImmunityLab />);
  fireEvent.click(screen.getByRole("button", { name: "缺少 B 细胞" }));

  expect(screen.getByRole("heading", { name: "过程受阻" })).toBeInTheDocument();
  expect(screen.getByText(/没有执行特异性应答的 B 细胞/)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "未匹配" })).not.toBeInTheDocument();
});
```

- [ ] **Step 4: 运行测试并确认旧解释结构失败**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx -t "unmatched|missing B cell"`

Expected: FAIL；没有 `BCR B` 按钮，也没有“未匹配”标题。

- [ ] **Step 5: 更新初始设置、解释数据和状态选择**

在 `HumoralImmunityLab.tsx` 中把初始设置改为：

```ts
const INITIAL_SETTINGS: HumoralSettings = {
  antigen: "A",
  bCellSpecificity: "A",
  exposure: "primary",
  memorySpecificity: "A",
  condition: "normal",
};
```

把正常阶段说明统一为 `{ what, recognition, result }`，并增加：

```ts
const mismatchCopy = {
  what: "当前 B 细胞存在，但它的受体与抗原特异性不一致。",
  recognition: `BCR ${settings.bCellSpecificity} 只能特异识别抗原 ${settings.bCellSpecificity}。`,
  result: "不能有效活化，不形成浆细胞、特异性抗体或新的记忆 B 细胞。",
};

const recognitionLimited =
  settings.condition === "normal" && !snapshot.bCellMatched;
const copy = recognitionLimited
  ? mismatchCopy
  : (BLOCKED_COPY[settings.condition] ?? STAGE_COPY[snapshot.stage]);
const explanationTitle = snapshot.blockedAt
  ? recognitionLimited
    ? "未匹配"
    : "过程受阻"
  : STAGE_TITLES[snapshot.stage];
```

解释卡固定渲染三个 `dt`：`发生了什么`、`为什么能识别`、`结果是什么`。实时数值仍在解释卡之外的 `aria-live` 区域中。

- [ ] **Step 6: 增加 BCR 与记忆特异性控制**

导入 `BCellSpecificity`，在抗原控件后加入：

```tsx
<fieldset>
  <legend>B 细胞受体</legend>
  <div className="humoral-button-row">
    {(["A", "B"] as BCellSpecificity[]).map((value) => (
      <button
        className="humoral-button"
        key={value}
        aria-pressed={settings.bCellSpecificity === value}
        onClick={() => changeSettings({ bCellSpecificity: value })}
      >
        BCR {value}
      </button>
    ))}
  </div>
</fieldset>
```

将“既往记忆抗原”改为“既往记忆特异性”，按钮文字改为“记忆 A/B”，更新字段为 `memorySpecificity`。干预按钮“匹配 B 细胞缺失”改为“缺少 B 细胞”。

- [ ] **Step 7: 更新阶段播报和状态摘要**

播报文本使用：

```ts
const announcedStage = snapshot.blockedAt
  ? recognitionLimited
    ? `未匹配：${STAGE_TITLES[snapshot.stage]}`
    : `过程受阻：${STAGE_TITLES[snapshot.stage]}`
  : STAGE_TITLES[snapshot.stage];
```

初次/二次摘要使用 `snapshot.memoryMatched`，并明确切换任一条件都会暂停并归零。

- [ ] **Step 8: 运行组件测试**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx`

Expected: 除了仍等待 Task 3 场景结构和 CSS 的测试外，本任务新增测试 PASS；不存在重复可访问名称。

- [ ] **Step 9: 提交控制与解释改动**

```bash
git add models/05-humoral-immunity/HumoralImmunityLab.tsx tests/models/humoral-immunity/lab.test.tsx
git commit -m "feat: align humoral controls and explanations"
```

---

### Task 3: 七阶段脊柱与四区过程场景

**Files:**
- Modify: `tests/models/humoral-immunity/lab.test.tsx`
- Modify: `models/05-humoral-immunity/HumoralProcessView.tsx`
- Modify: `models/05-humoral-immunity/humoral-immunity.css`

**Interfaces:**
- Consumes: Task 1 的七阶段快照和 Task 2 的 BCR 设置。
- Produces: 与细胞免疫同构的七列流程、BCR 标记、四区场景、播放/暂停动画类。

- [ ] **Step 1: 写四区场景和播放状态失败测试**

在 `lab.test.tsx` 追加：

```ts
it("renders the four focused humoral scene regions", () => {
  render(<HumoralImmunityLab />);

  const scene = screen.getByLabelText("B 细胞与抗原的体液免疫相互作用示意");
  expect(within(scene).getByText("辅助性 T 细胞")).toBeInTheDocument();
  expect(within(scene).getByText("匹配 B 细胞")).toBeInTheDocument();
  expect(within(scene).getByText("克隆与分化")).toBeInTheDocument();
  expect(within(scene).getByText("抗体—抗原结合")).toBeInTheDocument();
  expect(within(scene).getByLabelText("B 细胞受体：特异识别抗原 A")).toBeInTheDocument();
});

it("marks an unmatched B-cell step without marking it as experimentally blocked", () => {
  render(<HumoralImmunityLab />);
  fireEvent.click(screen.getByRole("button", { name: "BCR B" }));
  fireEvent.change(screen.getByLabelText("教学时间"), { target: { value: "18" } });

  const spine = within(screen.getByLabelText("体液免疫有序流程"));
  expect(spine.getByText("未匹配")).toBeInTheDocument();
  expect(spine.queryByText("受阻")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行场景测试并确认旧七区场景失败**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx -t "four focused|experimentally blocked"`

Expected: FAIL；旧场景没有四区标题、BCR 标记或新场景可访问名称。

- [ ] **Step 3: 将流程表改为七阶段**

在 `HumoralProcessView.tsx` 中使用：

```ts
const PROCESS: Array<{ stage: HumoralStage; label: string }> = [
  { stage: "presentation", label: "抗原呈递" },
  { stage: "helper-activation", label: "辅助性 T 细胞活化" },
  { stage: "b-activation", label: "B 细胞活化" },
  { stage: "clonal-expansion", label: "克隆增殖" },
  { stage: "differentiation", label: "分化" },
  { stage: "antibody-binding", label: "抗体产生与结合" },
  { stage: "memory", label: "免疫记忆" },
];

const ORDER = PROCESS.map((item) => item.stage);
```

当节点被停止时，标签规则为：

```tsx
{blocked && (
  <em>
    {settings.condition === "normal" && !snapshot.bCellMatched
      ? "未匹配"
      : "受阻"}
  </em>
)}
```

- [ ] **Step 4: 实现 BCR 标记与四区场景**

增加：

```tsx
function ReceptorMark({ specificity }: { specificity: BCellSpecificity }) {
  return (
    <span
      className={`humoral-receptor receptor-${specificity}`}
      aria-label={`B 细胞受体：特异识别抗原 ${specificity}`}
    >
      BCR {specificity}
    </span>
  );
}
```

场景根元素使用：

```tsx
<div
  className={`humoral-process-scene ${playing ? "is-playing" : "is-paused"}`}
  aria-label="B 细胞与抗原的体液免疫相互作用示意"
>
```

根元素内只保留四个直接子区：`.humoral-helper-zone`、`.humoral-b-cell-zone`、`.humoral-clone-differentiation-zone`、`.humoral-binding-zone`。四区分别呈现辅助性 T 细胞状态、带 `ReceptorMark` 的 B 细胞、浆细胞/记忆细胞数量、抗体与当前抗原的结合状态。BCR 不匹配时结合区必须显示“BCR 与抗原不匹配，未产生特异性抗体”。

- [ ] **Step 5: 对齐七列、四区和动画 CSS**

在 `humoral-immunity.css` 中把桌面流程列数改为：

```css
.humoral-process-spine {
  grid-template-columns: repeat(7, minmax(78px, 1fr));
}
```

把场景布局改为：

```css
.humoral-process-scene {
  grid-template-columns: 0.9fr 1.08fr 1.05fr 1.5fr;
  gap: 13px;
  min-height: 222px;
}

.humoral-receptor {
  display: inline-grid;
  width: max-content;
  margin-inline: auto;
  padding: 4px 7px;
  border: 1px solid currentColor;
  border-radius: 999px;
  color: var(--humoral-gold);
  font-size: 10px;
  font-weight: 900;
}

.humoral-process-scene.is-playing .humoral-clone-token.is-visible {
  animation: humoral-grow 1.25s ease-in-out infinite alternate;
}

.humoral-process-scene.is-playing .humoral-antibody.is-bound {
  animation: humoral-bind 1.25s ease-in-out infinite alternate;
}
```

移动端继续使用单列流程和单列场景；删除只服务于旧七区链式箭头的样式。保留 `.humoral-shell button { min-height: 44px; }` 与 `prefers-reduced-motion`。

- [ ] **Step 6: 更新 CSS 断言**

把 `lab.test.tsx` 中桌面列数断言更新为：

```ts
expect(humoralStyles).toContain(
  "grid-template-columns: repeat(7, minmax(78px, 1fr))",
);
expect(humoralStyles).toMatch(
  /@media \(max-width: 720px\)[\s\S]*?\.humoral-process-spine\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
);
expect(humoralStyles).toContain("@media (prefers-reduced-motion: reduce)");
```

- [ ] **Step 7: 运行体液免疫组件测试**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx`

Expected: PASS；七阶段、四区场景、未匹配和移动端规则全部通过。

- [ ] **Step 8: 提交流程场景改动**

```bash
git add models/05-humoral-immunity/HumoralProcessView.tsx models/05-humoral-immunity/humoral-immunity.css tests/models/humoral-immunity/lab.test.tsx
git commit -m "feat: align humoral process scene"
```

---

### Task 4: 曲线状态、回归验证与生产构建

**Files:**
- Modify: `tests/models/humoral-immunity/lab.test.tsx`
- Modify: `models/05-humoral-immunity/AntibodyChart.tsx`
- Modify if validation exposes a scoped defect: files already listed in this plan only.

**Interfaces:**
- Consumes: `HumoralSnapshot.bCellMatched`, `blockedAt`, `memoryMatched`。
- Produces: 正常、二次匹配、BCR 不匹配和实验受阻四类图表摘要。

- [ ] **Step 1: 写 BCR 不匹配图表失败测试**

在 `lab.test.tsx` 追加：

```ts
it("explains a BCR-mismatched flat antibody curve", () => {
  render(<HumoralImmunityLab />);
  fireEvent.click(screen.getByRole("button", { name: "二次免疫" }));
  fireEvent.click(screen.getByRole("button", { name: "BCR B" }));

  const chart = screen.getByText("抗体与抗原的相对变化").closest("figure");
  expect(chart).not.toBeNull();
  expect(within(chart!).getByText(/BCR 与抗原不匹配，抗体保持 0，抗原不下降/)).toBeInTheDocument();
  expect(within(chart!).queryByText(/初次反应（对照虚线）/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试并确认旧摘要只会说“干预阻断”**

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx -t "BCR-mismatched flat"`

Expected: FAIL；图表摘要没有区分 BCR 不匹配与实验干预。

- [ ] **Step 3: 实现四类图表状态**

在 `AntibodyChart.tsx` 中使用：

```ts
const recognitionLimited =
  settings.condition === "normal" && !snapshot.bCellMatched;
const experimentallyBlocked = settings.condition !== "normal";
const matchedSecondary =
  settings.exposure === "secondary" &&
  snapshot.memoryMatched &&
  !recognitionLimited &&
  !experimentallyBlocked;
const primaryComparison: HumoralSettings = {
  ...settings,
  exposure: "primary",
};

const chartSummary = recognitionLimited
  ? "BCR 与抗原不匹配，抗体保持 0，抗原不下降。"
  : experimentallyBlocked
    ? "所选干预阻断下游抗体产生，抗体保持 0，抗原不下降。"
    : matchedSecondary
      ? "同一抗原的二次反应调用记忆 B 细胞，曲线显示更快、更强、更持久；虚线保留初次反应作对照。"
      : "抗体升高后特异性结合当前抗原，抗原相对量随之下降。";
```

只有 `matchedSecondary` 为真时计算并渲染初次反应虚线。

- [ ] **Step 4: 运行体液免疫全部测试**

Run: `npm test -- tests/models/humoral-immunity/simulation.test.ts tests/models/humoral-immunity/lab.test.tsx tests/models/touch-targets.test.ts`

Expected: PASS，三份测试文件全部通过。

- [ ] **Step 5: 运行完整测试套件**

Run: `npm test`

Expected: PASS；所有模型和导航测试通过，没有未处理异常。

- [ ] **Step 6: 运行代码检查**

Run: `npm run lint`

Expected: exit code 0；没有 error。

- [ ] **Step 7: 运行生产构建**

Run: `npm run build`

Expected: exit code 0；`/models/humoral-immunity` 路由成功生成。

- [ ] **Step 8: 复核响应式与交互状态的自动断言**

确认 `lab.test.tsx` 已覆盖七列桌面流程、720px 以下单列流程、`prefers-reduced-motion`、44px 触摸高度、播放状态类、BCR 不匹配、缺少 B 细胞、记忆匹配二次反应、设置变化归零和阶段播报。再次运行：

Run: `npm test -- tests/models/humoral-immunity/lab.test.tsx tests/models/touch-targets.test.ts`

Expected: PASS；上述断言全部通过。

- [ ] **Step 9: 提交图表和验证修正**

```bash
git add models/05-humoral-immunity/AntibodyChart.tsx tests/models/humoral-immunity/lab.test.tsx models/05-humoral-immunity/HumoralImmunityLab.tsx models/05-humoral-immunity/HumoralProcessView.tsx models/05-humoral-immunity/humoral-immunity.css models/05-humoral-immunity/simulation.ts models/05-humoral-immunity/types.ts
git commit -m "feat: complete humoral immunity alignment"
```
