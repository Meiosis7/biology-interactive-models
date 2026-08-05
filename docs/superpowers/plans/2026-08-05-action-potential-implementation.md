# 动作电位动态交互模型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个面向高中生物课堂与自主探究的动作电位形成和传导动态交互网页，让神经纤维状态、膜电位曲线、离子运动和阶段解释保持实时联动。

**Architecture:** 使用 React 客户端组件承载实验状态，以纯函数模拟刺激阈值、传播延迟、动作电位阶段和膜电位数值。主界面拆分为神经纤维视图、Canvas 曲线、解释卡和控制区，所有组件只消费同一个派生快照，避免视图不同步。

**Tech Stack:** Vinext、React、TypeScript、CSS、HTML Canvas、Vitest、Testing Library、jsdom。

## Global Constraints

- 内容严格控制在高中课程范围，不引入复杂离子通道动力学方程。
- 静息电位约为 −70 mV，动作电位峰值约为 +30 mV。
- 阈下刺激只产生局部电位；阈刺激与强刺激产生相同峰值的单个动作电位。
- 去极化主要呈现 Na⁺ 内流，复极化主要呈现 K⁺ 外流。
- 中部刺激在离体神经纤维上双向传播；左端或右端刺激主要向另一端传播。
- 粒子、通道和运动速度均须标注为教学示意，不代表真实比例。
- 优先适配电脑投屏和平板横屏，并保证手机宽度下可操作。
- 自动动画可暂停，状态不只依靠颜色表达，并尊重 `prefers-reduced-motion`。
- 首版不实现跳跃传导、不应期定量分析、Hodgkin–Huxley 方程、连续刺激频率编码和数据导出。

## File Map

- `app/page.tsx`：页面入口，只装配模型标题和实验台。
- `app/layout.tsx`：站点标题、描述和中文页面元信息。
- `app/globals.css`：全局配色、响应式布局、可访问焦点和减弱动画规则。
- `components/action-potential/types.ts`：实验设置、阶段、离子流和快照类型。
- `components/action-potential/simulation.ts`：阈值判断、传播、膜电位和阶段派生的纯函数。
- `components/action-potential/ActionPotentialLab.tsx`：统一状态、播放计时、控制事件和组件装配。
- `components/action-potential/AxonView.tsx`：神经纤维、刺激点、记录电极、局部兴奋和离子通道示意。
- `components/action-potential/PotentialChart.tsx`：Canvas 膜电位曲线、阈值线、阶段区间和时间游标。
- `components/action-potential/StageExplanation.tsx`：当前阶段的高中教材化解释。
- `components/action-potential/LabControls.tsx`：刺激强度、位置、速度、播放、单步、时间轴和重置。
- `components/action-potential/action-potential.css`：模型局部布局、神经纤维、粒子、通道、曲线容器和控制项样式。
- `tests/action-potential/simulation.test.ts`：纯函数教学逻辑测试。
- `tests/action-potential/lab.test.tsx`：实验台交互、同步和可访问性测试。
- `vitest.config.ts`：Vitest 与 jsdom 配置。
- `tests/setup.ts`：Testing Library DOM 断言初始化。

---

### Task 1: 项目骨架与动作电位模拟核心

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `components/action-potential/types.ts`
- Create: `components/action-potential/simulation.ts`
- Create: `tests/action-potential/simulation.test.ts`

**Interfaces:**
- Consumes: 无。
- Produces: `ExperimentSettings`、`SimulationSnapshot`、`getArrivalTime()`、`getMembranePotential()`、`getSimulationSnapshot()`，供后续所有视图使用。

- [ ] **Step 1: 初始化站点并加入测试运行能力**

在空工作区运行站点初始化脚本，保留生成的 Vinext 结构。安装测试依赖，并在 `package.json` 的 `scripts` 中加入以下键：

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

创建 `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
```

创建 `tests/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => ({
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  })),
});
```

- [ ] **Step 2: 创建可导入但行为未实现的接口骨架**

先创建 `components/action-potential/types.ts` 中 Step 5 给出的完整类型定义；再创建 `components/action-potential/simulation.ts` 的接口骨架：

```ts
import type { ExperimentSettings, SimulationSnapshot, StimulusIntensity } from "./types";

export const DURATION = 10;
export const clamp = (value: number) => value;
export const getArrivalTime = (_stimulusPosition: number, _electrodePosition: number) => 0;
export const getMembranePotential = (_localTime: number, _intensity: StimulusIntensity) => -70;
export const getSimulationSnapshot = (_time: number, _settings: ExperimentSettings): SimulationSnapshot => ({
  stage: "resting",
  ionFlow: "none",
  membranePotential: -70,
  propagating: false,
  wavefronts: [],
  arrivalTime: 0,
  localTime: 0,
});
```

这些固定返回值只用于让测试完成导入，并会在首次测试中因行为不正确而失败。

- [ ] **Step 3: 写模拟逻辑的失败测试**

创建 `tests/action-potential/simulation.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import {
  getArrivalTime,
  getMembranePotential,
  getSimulationSnapshot,
} from "../../components/action-potential/simulation";

describe("action-potential simulation", () => {
  it("keeps subthreshold stimulation local", () => {
    const result = getSimulationSnapshot(0.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.52,
    });
    expect(result.propagating).toBe(false);
    expect(result.stage).toBe("local");
    expect(result.membranePotential).toBeLessThan(-55);
  });

  it("does not record a weak local potential at a distant electrode", () => {
    const result = getSimulationSnapshot(0.5, {
      intensity: "weak",
      stimulusPosition: 0.5,
      electrodePosition: 0.8,
    });
    expect(result.stage).toBe("resting");
    expect(result.membranePotential).toBe(-70);
  });

  it("gives threshold and strong stimuli the same action-potential peak", () => {
    const threshold = getMembranePotential(3, "threshold");
    const strong = getMembranePotential(3, "strong");
    expect(threshold).toBe(30);
    expect(strong).toBe(30);
  });

  it("delays the recording when the electrode is farther away", () => {
    expect(getArrivalTime(0.1, 0.8)).toBeGreaterThan(
      getArrivalTime(0.1, 0.3),
    );
  });

  it("reports sodium influx during depolarization", () => {
    const result = getSimulationSnapshot(2.4, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    expect(result.stage).toBe("depolarization");
    expect(result.ionFlow).toBe("sodium-in");
  });

  it("reports potassium efflux during repolarization", () => {
    const result = getSimulationSnapshot(4.2, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.5,
    });
    expect(result.stage).toBe("repolarization");
    expect(result.ionFlow).toBe("potassium-out");
  });

  it("propagates in both directions from a middle stimulus", () => {
    const result = getSimulationSnapshot(5, {
      intensity: "threshold",
      stimulusPosition: 0.5,
      electrodePosition: 0.7,
    });
    expect(result.wavefronts).toHaveLength(2);
    expect(result.wavefronts[0]).toBeLessThan(0.5);
    expect(result.wavefronts[1]).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 4: 运行测试并确认断言因行为尚未实现而失败**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: 测试文件可以正常导入，至少 5 项断言 FAIL；失败原因是固定返回值不符合阈下局部电位、传播延迟、离子流和双向传播要求，不是模块缺失或语法错误。

- [ ] **Step 5: 用真实模拟逻辑替换接口骨架**

创建 `components/action-potential/types.ts`：

```ts
export type StimulusIntensity = "weak" | "threshold" | "strong";
export type ActionPotentialStage =
  | "resting"
  | "local"
  | "threshold"
  | "depolarization"
  | "peak"
  | "repolarization"
  | "recovery";
export type IonFlow = "none" | "sodium-in" | "potassium-out";

export interface ExperimentSettings {
  intensity: StimulusIntensity;
  stimulusPosition: number;
  electrodePosition: number;
}

export interface SimulationSnapshot {
  stage: ActionPotentialStage;
  ionFlow: IonFlow;
  membranePotential: number;
  propagating: boolean;
  wavefronts: number[];
  arrivalTime: number;
  localTime: number;
}
```

创建 `components/action-potential/simulation.ts`：

```ts
import type {
  ActionPotentialStage,
  ExperimentSettings,
  IonFlow,
  SimulationSnapshot,
  StimulusIntensity,
} from "./types";

export const DURATION = 10;
const PROPAGATION_SPEED = 0.16;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getArrivalTime(stimulusPosition: number, electrodePosition: number) {
  return 1 + Math.abs(electrodePosition - stimulusPosition) / PROPAGATION_SPEED;
}

export function getMembranePotential(
  localTime: number,
  intensity: StimulusIntensity,
) {
  if (localTime < 0) return -70;
  if (intensity === "weak") {
    if (localTime <= 1) return -70 + 12 * Math.sin(Math.PI * localTime);
    return -70;
  }
  if (localTime < 1) return -70;
  if (localTime < 2) return -70 + 15 * (localTime - 1);
  if (localTime < 3) return -55 + 85 * (localTime - 2);
  if (localTime < 3.5) return 30;
  if (localTime < 5) return 30 - (100 / 1.5) * (localTime - 3.5);
  if (localTime < 6) return -70 - 8 * Math.sin(Math.PI * (localTime - 5));
  return -70;
}

function getStage(localTime: number, intensity: StimulusIntensity): ActionPotentialStage {
  if (localTime < 0) return "resting";
  if (intensity === "weak") return localTime <= 1 ? "local" : "resting";
  if (localTime < 1) return "threshold";
  if (localTime < 3) return "depolarization";
  if (localTime < 3.5) return "peak";
  if (localTime < 5) return "repolarization";
  if (localTime < 6) return "recovery";
  return "resting";
}

function getIonFlow(stage: ActionPotentialStage): IonFlow {
  if (stage === "depolarization") return "sodium-in";
  if (stage === "repolarization" || stage === "recovery") return "potassium-out";
  return "none";
}

function getWavefronts(time: number, stimulusPosition: number) {
  if (time < 1) return [];
  const distance = (time - 1) * PROPAGATION_SPEED;
  const left = clamp(stimulusPosition - distance, 0, 1);
  const right = clamp(stimulusPosition + distance, 0, 1);
  if (stimulusPosition <= 0.15) return [right];
  if (stimulusPosition >= 0.85) return [left];
  return [left, right];
}

export function getSimulationSnapshot(
  time: number,
  settings: ExperimentSettings,
): SimulationSnapshot {
  const propagating = settings.intensity !== "weak" && time >= 1;
  const arrivalTime = settings.intensity === "weak"
    ? 0
    : getArrivalTime(settings.stimulusPosition, settings.electrodePosition);
  const recordsLocalPotential = Math.abs(
    settings.electrodePosition - settings.stimulusPosition,
  ) <= 0.08;
  const localTime = settings.intensity === "weak"
    ? (recordsLocalPotential ? time : -1)
    : time - arrivalTime + 1;
  const stage = getStage(localTime, settings.intensity);
  return {
    stage,
    ionFlow: getIonFlow(stage),
    membranePotential: getMembranePotential(localTime, settings.intensity),
    propagating,
    wavefronts: propagating ? getWavefronts(time, settings.stimulusPosition) : [],
    arrivalTime,
    localTime,
  };
}
```

- [ ] **Step 6: 运行模拟测试并确认通过**

Run: `npm test -- tests/action-potential/simulation.test.ts`

Expected: 7 tests PASS。

- [ ] **Step 7: 提交模拟核心**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup.ts components/action-potential/types.ts components/action-potential/simulation.ts tests/action-potential/simulation.test.ts
git commit -m "feat: add action potential simulation core"
```

---

### Task 2: 联动实验台与交互控制

**Files:**
- Create: `components/action-potential/ActionPotentialLab.tsx`
- Create: `components/action-potential/LabControls.tsx`
- Create: `components/action-potential/StageExplanation.tsx`
- Create: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes: `DURATION`、`getSimulationSnapshot(time, settings)` 和 Task 1 中的类型。
- Produces: `<ActionPotentialLab />` 页面级实验组件；`LabControlsProps` 和 `StageExplanationProps` 仅在本功能目录内使用。

- [ ] **Step 1: 先写实验台行为的失败测试**

创建 `tests/action-potential/lab.test.tsx`：

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialLab } from "../../components/action-potential/ActionPotentialLab";

vi.mock("../../components/action-potential/AxonView", () => ({
  AxonView: ({ snapshot, onElectrodeChange }: {
    snapshot: { stage: string };
    onElectrodeChange: (position: number) => void;
  }) => (
    <div>
      <div data-testid="axon-stage">{snapshot.stage}</div>
      <input
        aria-label="记录电极位置"
        type="range"
        min="0"
        max="1"
        step="0.01"
        onChange={(event) => onElectrodeChange(Number(event.target.value))}
      />
    </div>
  ),
}));

vi.mock("../../components/action-potential/PotentialChart", () => ({
  PotentialChart: ({ snapshot }: { snapshot: { membranePotential: number } }) => (
    <div data-testid="chart-value">{Math.round(snapshot.membranePotential)}</div>
  ),
}));

describe("ActionPotentialLab", () => {
  it("starts with the resting state", () => {
    render(<ActionPotentialLab />);
    expect(screen.getByText("静息状态")).toBeInTheDocument();
    expect(screen.getByTestId("chart-value")).toHaveTextContent("-70");
  });

  it("resets time when experiment settings change", () => {
    render(<ActionPotentialLab />);
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "左侧刺激" }));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0");
  });

  it("shows that a weak stimulus does not propagate", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "弱刺激" }));
    fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.52" } });
    fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "0.5" } });
    expect(screen.getByText("局部电位")).toBeInTheDocument();
    expect(screen.getByText(/未形成可传导的动作电位/)).toBeInTheDocument();
  });

  it("moves one fixed step with the next button", () => {
    render(<ActionPotentialLab />);
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByLabelText("实验时间")).toHaveValue("0.5");
  });
});
```

- [ ] **Step 2: 运行测试并确认实验台组件缺失**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: FAIL，提示无法找到 `ActionPotentialLab`。

- [ ] **Step 3: 创建阶段解释数据与组件**

创建 `components/action-potential/StageExplanation.tsx`，导出 `STAGE_COPY` 常量和组件。完整文案映射如下：

```tsx
import type { ActionPotentialStage, IonFlow } from "./types";

export const STAGE_COPY: Record<ActionPotentialStage, {
  title: string;
  voltage: string;
  ions: string;
  cause: string;
}> = {
  resting: { title: "静息状态", voltage: "膜电位约为 −70 mV", ions: "无明显的跨膜离子流动画", cause: "膜外相对为正，膜内相对为负。" },
  local: { title: "局部电位", voltage: "膜电位小幅升高后恢复", ions: "少量 Na⁺ 内流（示意）", cause: "刺激未达到阈值，未形成可传导的动作电位。" },
  threshold: { title: "达到阈值", voltage: "膜电位接近阈电位", ions: "Na⁺ 通道开始开放", cause: "阈上刺激触发动作电位。" },
  depolarization: { title: "去极化", voltage: "膜电位快速升高", ions: "Na⁺ 内流", cause: "Na⁺ 通道开放使膜内电位升高。" },
  peak: { title: "反极化", voltage: "膜电位约为 +30 mV", ions: "Na⁺ 内流减弱", cause: "膜内电位短暂高于膜外。" },
  repolarization: { title: "复极化", voltage: "膜电位快速下降", ions: "K⁺ 外流", cause: "K⁺ 通道开放使膜内电位降低。" },
  recovery: { title: "恢复静息", voltage: "膜电位回到约 −70 mV", ions: "K⁺ 外流逐渐结束", cause: "膜恢复静息状态的离子分布。" },
};

export function StageExplanation({ stage, ionFlow }: { stage: ActionPotentialStage; ionFlow: IonFlow }) {
  const copy = STAGE_COPY[stage];
  return (
    <section className="stage-card" aria-live="polite" aria-label="当前阶段解释">
      <p className="stage-kicker">当前阶段</p>
      <h2>{copy.title}</h2>
      <dl>
        <div><dt>电位变化</dt><dd>{copy.voltage}</dd></div>
        <div><dt>主要离子运动</dt><dd>{copy.ions}</dd></div>
        <div><dt>形成原因</dt><dd>{copy.cause}</dd></div>
      </dl>
      <p className="flow-code" data-flow={ionFlow}>粒子与通道数量均为教学示意</p>
    </section>
  );
}
```

- [ ] **Step 4: 创建控制组件**

创建 `components/action-potential/LabControls.tsx`，其导出接口必须为：

```tsx
import type { StimulusIntensity } from "./types";

export interface LabControlsProps {
  time: number;
  duration: number;
  playing: boolean;
  intensity: StimulusIntensity;
  stimulusPosition: number;
  speed: 0.5 | 1;
  onTimeChange: (time: number) => void;
  onStart: () => void;
  onIntensityChange: (intensity: StimulusIntensity) => void;
  onStimulusPositionChange: (position: number) => void;
  onSpeedChange: (speed: 0.5 | 1) => void;
  onTogglePlaying: () => void;
  onStep: (delta: number) => void;
  onReset: () => void;
}
```

接口定义后加入以下组件；所有按钮只调用对应回调，组件不自行维护实验状态：

```tsx
const INTENSITIES: Array<[StimulusIntensity, string]> = [
  ["weak", "弱刺激"],
  ["threshold", "阈刺激"],
  ["strong", "强刺激"],
];
const POSITIONS: Array<[number, string]> = [
  [0.1, "左侧刺激"],
  [0.5, "中部刺激"],
  [0.9, "右侧刺激"],
];

export function LabControls(props: LabControlsProps) {
  return (
    <section className="lab-controls" aria-label="实验控制台">
      <div className="control-groups">
        <fieldset className="control-group">
          <legend>刺激强度</legend>
          <div className="button-row">
            {INTENSITIES.map(([value, label]) => (
              <button className="control-button" key={value} aria-pressed={props.intensity === value} onClick={() => props.onIntensityChange(value)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group">
          <legend>刺激位置</legend>
          <div className="button-row">
            {POSITIONS.map(([value, label]) => (
              <button className="control-button" key={value} aria-pressed={props.stimulusPosition === value} onClick={() => props.onStimulusPositionChange(value)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group">
          <legend>动画速度</legend>
          <div className="button-row">
            <button className="control-button" aria-pressed={props.speed === 0.5} onClick={() => props.onSpeedChange(0.5)}>慢速</button>
            <button className="control-button" aria-pressed={props.speed === 1} onClick={() => props.onSpeedChange(1)}>正常</button>
          </div>
        </fieldset>
      </div>
      <label className="timeline-row">
        <span>实验时间</span>
        <input
          aria-label="实验时间"
          type="range"
          min="0"
          max={props.duration}
          step="0.1"
          value={props.time}
          onChange={(event) => props.onTimeChange(Number(event.target.value))}
        />
        <output>{props.time.toFixed(1)} s</output>
      </label>
      <div className="button-row transport-row">
        <button className="control-button primary" onClick={props.onStart}>开始刺激</button>
        <button className="control-button" onClick={props.onTogglePlaying}>{props.playing ? "暂停" : "播放"}</button>
        <button className="control-button" onClick={() => props.onStep(-0.5)}>上一步</button>
        <button className="control-button" onClick={() => props.onStep(0.5)}>下一步</button>
        <button className="control-button" onClick={props.onReset}>重置</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 创建统一状态实验台**

创建 `components/action-potential/ActionPotentialLab.tsx`。状态和更新规则必须符合以下完整骨架：

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AxonView } from "./AxonView";
import { PotentialChart } from "./PotentialChart";
import { LabControls } from "./LabControls";
import { StageExplanation } from "./StageExplanation";
import { DURATION, clamp, getSimulationSnapshot } from "./simulation";
import type { ExperimentSettings, StimulusIntensity } from "./types";

const DEFAULT_SETTINGS: ExperimentSettings = {
  intensity: "threshold",
  stimulusPosition: 0.5,
  electrodePosition: 0.72,
};

export function ActionPotentialLab() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(() => getSimulationSnapshot(time, settings), [time, settings]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed, 0, DURATION);
        if (next >= DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastFrame.current = null;
    };
  }, [playing, speed]);

  const changeSetting = (patch: Partial<ExperimentSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };

  return (
    <main className="lab-shell">
      <header className="lab-header">
        <p className="eyebrow">选择性必修 1 · 神经调节</p>
        <h1>动作电位的形成和传导</h1>
        <p>给予神经纤维适宜刺激，观察动作电位如何形成并传播。</p>
      </header>
      <section className="experiment-grid">
        <AxonView
          time={time}
          settings={settings}
          snapshot={snapshot}
          onElectrodeChange={(electrodePosition) => changeSetting({ electrodePosition })}
        />
        <PotentialChart time={time} settings={settings} snapshot={snapshot} />
        <StageExplanation stage={snapshot.stage} ionFlow={snapshot.ionFlow} />
      </section>
      <LabControls
        time={time}
        duration={DURATION}
        playing={playing}
        intensity={settings.intensity}
        stimulusPosition={settings.stimulusPosition}
        speed={speed}
        onStart={() => { setTime(0); setPlaying(true); }}
        onTimeChange={(next) => { setPlaying(false); setTime(next); }}
        onIntensityChange={(intensity: StimulusIntensity) => changeSetting({ intensity })}
        onStimulusPositionChange={(stimulusPosition) => changeSetting({ stimulusPosition })}
        onSpeedChange={setSpeed}
        onTogglePlaying={() => {
          if (time >= DURATION) setTime(0);
          setPlaying((current) => !current);
        }}
        onStep={(delta) => { setPlaying(false); setTime((current) => clamp(current + delta, 0, DURATION)); }}
        onReset={() => { setPlaying(false); setTime(0); setSettings(DEFAULT_SETTINGS); }}
      />
    </main>
  );
}
```

- [ ] **Step 6: 临时创建视图组件存根并运行交互测试**

创建可编译的 `AxonView.tsx` 存根：

```tsx
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  onElectrodeChange: (position: number) => void;
}

export function AxonView({ snapshot, settings, onElectrodeChange }: AxonViewProps) {
  return (
    <section>
      <p>神经纤维视图：{snapshot.stage}</p>
      <input
        aria-label="记录电极位置"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={settings.electrodePosition}
        onChange={(event) => onElectrodeChange(Number(event.target.value))}
      />
    </section>
  );
}
```

创建可编译的 `PotentialChart.tsx` 存根：

```tsx
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface PotentialChartProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}

export function PotentialChart({ snapshot }: PotentialChartProps) {
  return <section>膜电位曲线：{Math.round(snapshot.membranePotential)} mV</section>;
}
```

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: 4 tests PASS。

- [ ] **Step 7: 提交实验状态与控制**

```bash
git add components/action-potential/ActionPotentialLab.tsx components/action-potential/LabControls.tsx components/action-potential/StageExplanation.tsx components/action-potential/AxonView.tsx components/action-potential/PotentialChart.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: add synchronized action potential lab controls"
```

---

### Task 3: 神经纤维视图与膜电位曲线

**Files:**
- Modify: `components/action-potential/AxonView.tsx`
- Modify: `components/action-potential/PotentialChart.tsx`
- Modify: `tests/action-potential/lab.test.tsx`

**Interfaces:**
- Consumes: `ExperimentSettings`、`SimulationSnapshot`、`getMembranePotential()` 和统一 `time`。
- Produces: 可拖动记录电极的 `<AxonView />` 与同步绘制曲线的 `<PotentialChart />`。

- [ ] **Step 1: 增加视图语义与电极交互的失败测试**

在 `lab.test.tsx` 中取消两个模块 mock，并追加：

```tsx
it("labels the experiment condition and synchronized views", () => {
  render(<ActionPotentialLab />);
  expect(screen.getByRole("img", { name: /离体神经纤维/ })).toBeInTheDocument();
  expect(screen.getByLabelText("膜电位曲线")).toBeInTheDocument();
  expect(screen.getByText("中部刺激：兴奋向两侧传播")).toBeInTheDocument();
});

it("resets the experiment when the recording electrode moves", () => {
  render(<ActionPotentialLab />);
  fireEvent.change(screen.getByLabelText("实验时间"), { target: { value: "6" } });
  fireEvent.change(screen.getByLabelText("记录电极位置"), { target: { value: "0.9" } });
  expect(screen.getByLabelText("实验时间")).toHaveValue("0");
});
```

- [ ] **Step 2: 运行测试并确认存根缺少真实语义**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: 新增的 2 个测试 FAIL。

- [ ] **Step 3: 实现神经纤维 DOM/CSS 视图**

`AxonView.tsx` 导出接口固定为：

```tsx
export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  onElectrodeChange: (position: number) => void;
}
```

使用 HTML 元素和 CSS 形状完成实现，不使用装饰性 SVG。文件内容为：

```tsx
import type { CSSProperties } from "react";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface AxonViewProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
  onElectrodeChange: (position: number) => void;
}

const CHANNELS = [12, 28, 44, 60, 76, 90];
const IONS = [18, 34, 50, 66, 82];

export function AxonView({ settings, snapshot, onElectrodeChange }: AxonViewProps) {
  const conditionLabel = settings.stimulusPosition <= 0.15
    ? "左侧刺激：兴奋主要向右传播"
    : settings.stimulusPosition >= 0.85
      ? "右侧刺激：兴奋主要向左传播"
      : "中部刺激：兴奋向两侧传播";
  const sodiumOpen = snapshot.ionFlow === "sodium-in";
  const potassiumOpen = snapshot.ionFlow === "potassium-out";

  return (
    <section className="axon-card" aria-labelledby="axon-title">
      <h2 id="axon-title" className="sr-only">神经纤维动态视图</h2>
      <p className="condition-note">{conditionLabel}</p>
      <div
        className="axon-stage"
        role="img"
        aria-label={`离体神经纤维，当前为${snapshot.stage}阶段，${conditionLabel}`}
      >
        <span className="membrane-label outside">膜外</span>
        <span className="membrane-label inside">膜内</span>
        <div className="axon-body">
          {snapshot.wavefronts.map((position, index) => (
            <span
              className="wavefront"
              key={`${index}-${position.toFixed(2)}`}
              style={{ left: `${position * 100}%` }}
            />
          ))}
          <span
            className="stimulus-marker"
            style={{ left: `${settings.stimulusPosition * 100}%` }}
          >刺激点</span>
          <span
            className="electrode-marker"
            style={{ left: `${settings.electrodePosition * 100}%` }}
          >记录电极</span>
          {CHANNELS.map((left, index) => (
            <span
              key={`channel-${left}`}
              className={`channel ${index % 2 === 0 ? "sodium-channel" : "potassium-channel"} ${(index % 2 === 0 ? sodiumOpen : potassiumOpen) ? "open" : "closed"}`}
              style={{ left: `${left}%` }}
            />
          ))}
          {IONS.map((left, index) => (
            <span
              key={`sodium-${left}`}
              className={`ion sodium ${sodiumOpen ? "moving-in" : ""}`}
              style={{ left: `${left}%`, top: `${-44 - (index % 2) * 22}px` } as CSSProperties}
            >Na⁺</span>
          ))}
          {IONS.map((left, index) => (
            <span
              key={`potassium-${left}`}
              className={`ion potassium ${potassiumOpen ? "moving-out" : ""}`}
              style={{ left: `${left + 5}%`, top: `${32 + (index % 2) * 22}px` } as CSSProperties}
            >K⁺</span>
          ))}
        </div>
      </div>
      <label className="electrode-control">
        <span>拖动记录电极，改变膜电位记录位置</span>
        <input
          aria-label="记录电极位置"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.electrodePosition}
          onChange={(event) => onElectrodeChange(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
```

- [ ] **Step 4: 实现 Canvas 曲线**

`PotentialChart.tsx` 导出接口固定为：

```tsx
export interface PotentialChartProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}
```

组件渲染 Canvas 和当前数值文本，使用与实验快照相同的模拟函数绘制曲线。文件内容为：

```tsx
import { useEffect, useRef } from "react";
import { DURATION, getSimulationSnapshot } from "./simulation";
import type { ExperimentSettings, SimulationSnapshot } from "./types";

export interface PotentialChartProps {
  time: number;
  settings: ExperimentSettings;
  snapshot: SimulationSnapshot;
}

const MIN_MV = -90;
const MAX_MV = 40;

export function PotentialChart({ time, settings, snapshot }: PotentialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 235;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    const padding = { top: 18, right: 18, bottom: 28, left: 48 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const x = (seconds: number) => padding.left + (seconds / DURATION) * plotWidth;
    const y = (mv: number) => padding.top + ((MAX_MV - mv) / (MAX_MV - MIN_MV)) * plotHeight;

    context.font = "12px sans-serif";
    [-70, -55, 0, 30].forEach((mv) => {
      context.beginPath();
      context.strokeStyle = mv === -55 ? "rgba(255,209,102,.55)" : "rgba(169,204,230,.18)";
      context.moveTo(padding.left, y(mv));
      context.lineTo(width - padding.right, y(mv));
      context.stroke();
      context.fillStyle = "#9bb3c9";
      context.fillText(`${mv} mV`, 4, y(mv) + 4);
    });

    context.beginPath();
    for (let sample = 0; sample <= DURATION; sample += 0.025) {
      const mv = getSimulationSnapshot(sample, settings).membranePotential;
      if (sample === 0) context.moveTo(x(sample), y(mv));
      else context.lineTo(x(sample), y(mv));
    }
    context.strokeStyle = "#ff6b4a";
    context.lineWidth = 3;
    context.stroke();

    context.beginPath();
    context.strokeStyle = "#38d9ff";
    context.lineWidth = 1.5;
    context.moveTo(x(time), padding.top);
    context.lineTo(x(time), height - padding.bottom);
    context.stroke();
  }, [settings, time]);

  return (
    <section className="chart-card">
      <div className="chart-reading">
        <span>记录点膜电位</span>
        <strong>{Math.round(snapshot.membranePotential)} mV</strong>
      </div>
      <canvas ref={canvasRef} aria-label="膜电位曲线" role="img" />
    </section>
  );
}
```

- [ ] **Step 5: 运行完整组件测试**

Run: `npm test -- tests/action-potential/lab.test.tsx`

Expected: 6 tests PASS。

- [ ] **Step 6: 提交联动视图**

```bash
git add components/action-potential/AxonView.tsx components/action-potential/PotentialChart.tsx tests/action-potential/lab.test.tsx
git commit -m "feat: visualize action potential propagation and voltage"
```

---

### Task 4: 页面呈现、响应式样式与最终验证

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/action-potential/action-potential.css`
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Delete: `app/_sites-preview/**`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2–3 完成的 `<ActionPotentialLab />`。
- Produces: 可直接访问、响应式、可构建的第 1 个完整教学模型。

- [ ] **Step 1: 装配正式页面与元信息**

`app/page.tsx` 仅保留：

```tsx
import { ActionPotentialLab } from "../components/action-potential/ActionPotentialLab";
import "../components/action-potential/action-potential.css";

export default function Page() {
  return <ActionPotentialLab />;
}
```

`app/layout.tsx` 的元信息改为：

```ts
export const metadata = {
  title: "动作电位的形成和传导｜高中生物交互模型",
  description: "通过刺激强度、刺激位置和记录电极，探究动作电位的形成、膜电位变化与神经纤维传导。",
};
```

移除 starter loading skeleton、`codex-preview` 标记与不再使用的 `react-loading-skeleton` 依赖。

- [ ] **Step 2: 写入模型局部样式**

`action-potential.css` 使用以下设计令牌，并覆盖实验网格、神经纤维、通道、粒子、光带、曲线卡、解释卡和控制区的所有类名：

```css
:root {
  --lab-bg: #07111f;
  --lab-panel: #0d1c2d;
  --lab-panel-strong: #12263d;
  --lab-text: #eff8ff;
  --lab-muted: #9bb3c9;
  --lab-sodium: #38d9ff;
  --lab-potassium: #aa7cff;
  --lab-excited: #ffd166;
  --lab-curve: #ff6b4a;
  --lab-border: rgba(169, 204, 230, 0.2);
}

.lab-shell { min-height: 100vh; color: var(--lab-text); background: radial-gradient(circle at 50% 0%, #123250 0, var(--lab-bg) 50%); padding: clamp(20px, 4vw, 56px); }
.lab-header, .experiment-grid, .lab-controls { width: min(1180px, 100%); margin-inline: auto; }
.experiment-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: 18px; }
.axon-card, .chart-card, .stage-card, .lab-controls { border: 1px solid var(--lab-border); border-radius: 22px; background: rgba(13, 28, 45, 0.92); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22); }
.axon-card { grid-column: 1 / -1; min-height: 330px; position: relative; overflow: hidden; }
.chart-card { min-height: 300px; }
.stage-card { padding: 24px; }
.lab-controls { margin-top: 18px; padding: 18px; display: grid; gap: 14px; }
.axon-stage { position: relative; min-height: 260px; padding: 62px 28px 28px; }
.membrane-label { position: absolute; left: 28px; color: var(--lab-muted); font-size: 13px; }
.membrane-label.outside { top: 22px; }
.membrane-label.inside { bottom: 22px; }
.axon-body { position: absolute; inset: 92px 28px 76px; border-block: 3px solid #47627a; background: rgba(18, 38, 61, 0.72); }
.wavefront { position: absolute; top: -3px; bottom: -3px; width: 12%; transform: translateX(-50%); background: linear-gradient(90deg, transparent, rgba(255, 209, 102, 0.82), transparent); }
.stimulus-marker, .electrode-marker { position: absolute; top: -42px; transform: translateX(-50%); font-size: 12px; color: var(--lab-text); }
.channel { position: absolute; top: -10px; width: 11px; height: 20px; border: 2px solid currentColor; border-radius: 5px; }
.channel.open { background: rgba(255, 255, 255, 0.16); box-shadow: 0 0 14px currentColor; }
.ion { position: absolute; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; font-size: 11px; font-weight: 800; }
.ion.sodium { color: #02131d; background: var(--lab-sodium); }
.ion.potassium { color: #160d28; background: var(--lab-potassium); }
.ion.moving-in { animation: sodium-in 900ms ease-in-out infinite; }
.ion.moving-out { animation: potassium-out 900ms ease-in-out infinite; }
@keyframes sodium-in { from { transform: translateY(-28px); } to { transform: translateY(32px); } }
@keyframes potassium-out { from { transform: translateY(30px); } to { transform: translateY(-30px); } }
.electrode-control { position: absolute; left: 28px; right: 28px; bottom: 22px; display: grid; gap: 6px; color: var(--lab-muted); }
.condition-note { position: absolute; top: 18px; right: 24px; padding: 7px 11px; border-radius: 999px; background: rgba(255, 209, 102, 0.12); color: var(--lab-excited); }
.chart-card { padding: 18px; display: grid; grid-template-rows: auto 1fr; gap: 10px; }
.chart-card canvas { display: block; width: 100%; min-height: 235px; border-radius: 14px; background: #081522; }
.chart-reading { display: flex; align-items: baseline; justify-content: space-between; color: var(--lab-muted); }
.chart-reading strong { color: var(--lab-curve); font-size: 22px; }
.stage-kicker, .eyebrow { color: var(--lab-sodium); font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.stage-card h2 { margin: 6px 0 20px; font-size: 28px; }
.stage-card dl { display: grid; gap: 16px; margin: 0; }
.stage-card dl div { display: grid; gap: 5px; padding-bottom: 14px; border-bottom: 1px solid var(--lab-border); }
.stage-card dt { color: var(--lab-muted); font-size: 12px; }
.stage-card dd { margin: 0; line-height: 1.55; }
.flow-code { margin: 18px 0 0; color: var(--lab-muted); font-size: 12px; }
.control-groups { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.control-group { display: grid; gap: 8px; }
.button-row { display: flex; flex-wrap: wrap; gap: 8px; }
.timeline-row { display: grid; grid-template-columns: auto minmax(160px, 1fr) auto; align-items: center; gap: 12px; }
.timeline-row input { width: 100%; accent-color: var(--lab-curve); }
.control-button { min-height: 44px; border-radius: 12px; border: 1px solid var(--lab-border); color: var(--lab-text); background: var(--lab-panel-strong); }
.control-button[aria-pressed="true"] { border-color: var(--lab-excited); box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.25); }
.control-button:focus-visible, input[type="range"]:focus-visible { outline: 3px solid var(--lab-sodium); outline-offset: 3px; }

@media (max-width: 760px) {
  .experiment-grid { grid-template-columns: 1fr; }
  .axon-card, .chart-card, .stage-card { grid-column: 1; }
  .lab-shell { padding: 18px 12px 32px; }
  .control-groups { grid-template-columns: 1fr; }
  .timeline-row { grid-template-columns: 1fr; }
  .condition-note { position: static; display: inline-flex; margin: 14px 14px 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
```

组件实现必须逐一使用上述类名；不得新增持续闪烁动画，也不得用颜色作为唯一状态提示。

- [ ] **Step 3: 完善全局样式与中文排版**

`app/globals.css` 保留框架必需导入，并加入：

```css
* { box-sizing: border-box; }
html { color-scheme: dark; }
body { margin: 0; min-width: 320px; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; background: #07111f; }
button, input { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.55; }
```

- [ ] **Step 4: 运行全部测试**

Run: `npm test`

Expected: `simulation.test.ts` 7 tests PASS，`lab.test.tsx` 6 tests PASS。

- [ ] **Step 5: 运行生产构建**

Run: `npm run build`

Expected: 构建成功，无 TypeScript 或模块错误。

- [ ] **Step 6: 做教学与交互验收**

在本地页面依次完成以下检查并记录结果：

```text
[ ] 弱刺激只出现局部电位，不显示传播波前
[ ] 阈刺激与强刺激的峰值均约为 +30 mV
[ ] 中部刺激显示双向传播，端部刺激显示单向为主
[ ] 电极越远，曲线出现动作电位越晚，峰值不变
[ ] 自动播放、暂停、上下步、时间轴和重置一致
[ ] 去极化显示 Na⁺ 内流，复极化显示 K⁺ 外流
[ ] 760 px 以下布局纵向排列且控件可操作
[ ] 键盘焦点清晰，动画可以停止
```

- [ ] **Step 7: 提交完整第 1 个模型**

```bash
git add app components/action-potential package.json package-lock.json
git commit -m "feat: complete action potential interactive model"
```

## Final Verification

- [ ] Run: `npm test` — Expected: 13 tests PASS。
- [ ] Run: `npm run build` — Expected: exit code 0。
- [ ] Run: `git status --short` — Expected: 无未提交的本任务改动。
- [ ] 对照 `docs/superpowers/specs/2026-08-05-action-potential-design.md` 逐条确认学习目标、交互、视觉、可访问性和范围边界均已覆盖。
