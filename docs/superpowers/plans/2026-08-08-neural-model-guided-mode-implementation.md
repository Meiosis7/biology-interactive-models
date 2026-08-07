# Neural Model Guided Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four neural-regulation models understandable in a default guided mode while preserving every existing control in an optional advanced mode, then verify every model's click paths.

**Architecture:** Add one shared presentational guidance component with a controlled advanced-panel disclosure. Each lab continues to own its simulation state and derives the highlighted learning step from its existing snapshot; no second simulation state machine is introduced. Existing controls are regrouped, not duplicated.

**Tech Stack:** React 19, TypeScript, vinext, CSS, Vitest, Testing Library

## Global Constraints

- The default view must support one complete core learning run without opening advanced mode.
- Existing experimental controls remain available in advanced mode.
- Reset returns the simulation and advanced disclosure to the basic starting state.
- Mode changes preserve one authoritative simulation state.
- Buttons must remain keyboard-operable and at least 44 pixels high.
- Stage announcements and quiz feedback remain low-noise and atomic.

---

### Task 1: Shared neural learning guide

**Files:**
- Create: `components/neural-guidance/NeuralLearningGuide.tsx`
- Create: `components/neural-guidance/neural-guidance.css`
- Modify: `app/globals.css`
- Create: `tests/neural-guidance.test.tsx`

**Interfaces:**
- Produces: `NeuralLearningGuide({ goal, steps, currentStep, takeaway })`
- Produces: `AdvancedPanel({ id, expanded, onExpandedChange, children })`

- [ ] **Step 1: Write failing component tests**

```tsx
render(<NeuralLearningGuide goal="看懂信号变化" steps={["操作", "观察", "结论"]} currentStep={1} takeaway="信号会传递" />);
expect(screen.getByText("本页只需看懂：看懂信号变化")).toBeInTheDocument();
expect(screen.getByText("观察")).toHaveAttribute("aria-current", "step");

render(<AdvancedPanel id="demo" expanded={false} onExpandedChange={toggle}><p>复杂控制</p></AdvancedPanel>);
expect(screen.queryByText("复杂控制")).not.toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
expect(toggle).toHaveBeenCalledWith(true);
```

- [ ] **Step 2: Run the focused test and confirm it fails because the component does not exist**

Run: `npm test -- tests/neural-guidance.test.tsx`

- [ ] **Step 3: Implement the shared components and responsive styles**

```tsx
export function NeuralLearningGuide({ goal, steps, currentStep, takeaway }: Props) {
  return <section className="neural-guide" aria-label="基础引导">
    <p className="neural-guide__goal">本页只需看懂：{goal}</p>
    <ol>{steps.map((step, index) => <li key={step} aria-current={index === currentStep ? "step" : undefined}>{step}</li>)}</ol>
    <p className="neural-guide__takeaway">一句话结论：{takeaway}</p>
  </section>;
}

export function AdvancedPanel({ id, expanded, onExpandedChange, children }: AdvancedProps) {
  return <section className="advanced-panel">
    <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => onExpandedChange(!expanded)}>
      {expanded ? "收起进阶模式" : "打开进阶模式"}
    </button>
    {expanded && <div id={id}>{children}</div>}
  </section>;
}
```

- [ ] **Step 4: Run the focused test and commit**

Run: `npm test -- tests/neural-guidance.test.tsx`

Commit: `feat: add shared neural learning guide`

### Task 2: Simplify action-potential and synapse interactions

**Files:**
- Modify: `components/action-potential/ActionPotentialLab.tsx`
- Modify: `components/action-potential/LabControls.tsx`
- Modify: `components/action-potential/StageExplanation.tsx`
- Modify: `components/action-potential/action-potential.css`
- Modify: `models/02-synapse-transmission/SynapseLab.tsx`
- Modify: `models/02-synapse-transmission/synapse.css`
- Modify: `tests/action-potential/lab.test.tsx`
- Modify: `tests/models/synapse-transmission/lab.test.tsx`

**Interfaces:**
- Consumes: shared `NeuralLearningGuide` and `AdvancedPanel`
- Extends: `LabControlsProps` with `advanced: boolean` and `onAdvancedChange(expanded: boolean): void`

- [ ] **Step 1: Add failing tests for the basic default, advanced reveal, state preservation, and reset**

```tsx
expect(screen.getByLabelText("基础引导")).toHaveTextContent("操作");
expect(screen.queryByRole("button", { name: "弱刺激" })).not.toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
expect(screen.getByRole("button", { name: "弱刺激" })).toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "重置" }));
expect(screen.queryByRole("button", { name: "弱刺激" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run both focused test files and confirm the new assertions fail**

Run: `npm test -- tests/action-potential/lab.test.tsx tests/models/synapse-transmission/lab.test.tsx`

- [ ] **Step 3: Add the action-potential guide and regroup controls**

Derive `currentStep` from existing time and `snapshot.arrivalTime`; keep start, pause/play, next, and reset visible. Place intensity, stimulus position, speed, and timeline inside the controlled advanced panel. Prepend a white-language `一句话变化` field to stage copy and close advanced mode during reset.

```tsx
const [advanced, setAdvanced] = useState(false);
const guideStep = time === 0 ? 0 : time < snapshot.arrivalTime ? 1 : 2;
<NeuralLearningGuide goal="刺激达到一定强度后，兴奋会沿神经纤维传播" steps={["点击开始刺激", "看黄色兴奋区向两侧移动", "看记录点电位先升后降"]} currentStep={guideStep} takeaway="动作电位在局部形成，并沿神经纤维双向传播。" />
```

- [ ] **Step 4: Add the synapse guide and regroup controls**

Derive `currentStep` as `0` at rest, `1` before receptor binding, and `2` from receptor binding onward. Keep start, pause/play, next, and reset visible. Place direction, type, intervention, speed, and timeline in advanced mode. Add the fixed takeaway “化学突触只能从突触前膜传向突触后膜”.

```tsx
const guideStep = time === 0 ? 0 : time < 5 ? 1 : 2;
<NeuralLearningGuide goal="电信号怎样跨过两个神经元之间的空隙" steps={["点击开始刺激", "看递质从上方释放", "看下方膜电位改变"]} currentStep={guideStep} takeaway="化学突触只能从突触前膜传向突触后膜。" />
```

- [ ] **Step 5: Run focused tests and commit**

Run: `npm test -- tests/action-potential/lab.test.tsx tests/models/synapse-transmission/lab.test.tsx`

Commit: `feat: simplify action potential and synapse learning`

### Task 3: Simplify membrane-potential curve interactions

**Files:**
- Modify: `models/03-membrane-potential-curve/MembraneCurveLab.tsx`
- Modify: `models/03-membrane-potential-curve/membrane-curve.css`
- Modify: `tests/models/membrane-potential-curve/lab.test.tsx`

**Interfaces:**
- Consumes: shared guide and advanced panel
- Adds: `GUIDED_POINTS = [{label: "静息", time: 0}, {label: "上升", time: 2.5}, {label: "下降", time: 4.5}, {label: "恢复", time: 5.5}]`

- [ ] **Step 1: Add failing tests for four observation buttons and advanced-only modes**

```tsx
expect(screen.getByRole("button", { name: "观察上升" })).toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "观察下降" }));
expect(screen.getByLabelText("曲线游标")).toHaveValue("4.5");
expect(screen.queryByRole("button", { name: "对比模式" })).not.toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
expect(screen.getByRole("button", { name: "对比模式" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

- [ ] **Step 3: Implement guided observation points and advanced controls**

Keep the four observation buttons, start/pause, and reset visible. Move explore/compare/quiz switches, intensity, display toggles, timeline, fine stepping, and speed into advanced mode. Reset returns to threshold stimulus, explore mode, time zero, and collapsed advanced mode.

```tsx
const GUIDED_POINTS = [
  { label: "静息", time: 0 },
  { label: "上升", time: 2.5 },
  { label: "下降", time: 4.5 },
  { label: "恢复", time: 5.5 },
] as const;
{GUIDED_POINTS.map((point) => <button key={point.label} onClick={() => changeTime(point.time)}>观察{point.label}</button>)}
```

- [ ] **Step 4: Run the focused test and commit**

Run: `npm test -- tests/models/membrane-potential-curve/lab.test.tsx`

Commit: `feat: add guided membrane curve observations`

### Task 4: Simplify meter-deflection reasoning

**Files:**
- Modify: `models/04-meter-deflection/MeterDeflectionLab.tsx`
- Modify: `models/04-meter-deflection/NerveElectrodeView.tsx`
- Modify: `models/04-meter-deflection/meter-deflection.css`
- Modify: `tests/models/meter-deflection/lab.test.tsx`

**Interfaces:**
- Extends: `NerveElectrodeViewProps` with `showPositionControls: boolean`
- Adds: basic three-link chain `先到电极 → 电位差符号 → 指针方向`

- [ ] **Step 1: Add failing tests for the simple chain, next example, and hidden advanced controls**

```tsx
expect(screen.getByLabelText("基础判断链")).toHaveTextContent("谁先兴奋");
expect(screen.queryByRole("button", { name: "交换导线" })).not.toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "下一个示例" }));
expect(screen.getByRole("button", { name: "膜外双电极（B 先到）" })).toHaveAttribute("aria-pressed", "true");
fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
expect(screen.getByRole("button", { name: "交换导线" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- tests/models/meter-deflection/lab.test.tsx`

- [ ] **Step 3: Implement the basic causal chain and advanced controls**

Keep start/pause, next example, and reset visible. Put all four direct presets, lead swapping, speeds, free timeline, full four-step reasoning, and electrode-position sliders in advanced mode. Reset selects A-first, time zero, normal speed, and collapsed advanced mode.

```tsx
const nextPreset = () => {
  const currentIndex = Math.max(0, PRESET_ORDER.indexOf(activePreset ?? PRESET_ORDER[0]));
  setPreset(PRESET_ORDER[(currentIndex + 1) % PRESET_ORDER.length]);
};
<ol aria-label="基础判断链"><li>谁先兴奋</li><li>电位差是正还是负</li><li>指针向哪边偏</li></ol>
```

- [ ] **Step 4: Run the focused test and commit**

Run: `npm test -- tests/models/meter-deflection/lab.test.tsx`

Commit: `feat: simplify meter deflection reasoning`

### Task 5: Complete click-path audit and release verification

**Files:**
- Create: `tests/click-path-audit.test.tsx`
- Modify: `tests/models/touch-targets.test.ts`

**Interfaces:**
- Verifies every homepage, navigation, transport, mode, preset, quiz, reset, and disclosure path.

- [ ] **Step 1: Add any missing click-path regressions discovered during the audit**

Add a table-driven test that renders the hub and each lab, activates every primary transport and reset action, opens and closes all four advanced disclosures twice, and confirms no action throws. Existing model-specific suites continue to assert state results; this audit asserts complete click reachability.

```tsx
it.each([
  ["动作电位", <ActionPotentialLab />],
  ["突触传递", <SynapseLab />],
  ["膜电位曲线", <MembraneCurveLab />],
  ["电表偏转", <MeterDeflectionLab />],
])("opens and closes advanced mode for %s", (_name, lab) => {
  render(lab);
  fireEvent.click(screen.getByRole("button", { name: "打开进阶模式" }));
  fireEvent.click(screen.getByRole("button", { name: "收起进阶模式" }));
  expect(screen.getByRole("button", { name: "打开进阶模式" })).toHaveAttribute("aria-expanded", "false");
});
```

- [ ] **Step 2: Run every automated check**

Run: `npm test`

Expected: all test files pass with zero failures.

- [ ] **Step 3: Run code and deployment builds**

Run: `npm run lint && npm run build`

Expected: both commands exit successfully.

- [ ] **Step 4: Browser-test all seven routes**

At desktop and 390×844 sizes, click every visible control and each advanced disclosure, verify reset and navigation, check for horizontal overflow, and inspect console errors after each route.

- [ ] **Step 5: Commit the audited release**

Commit: `fix: complete neural guidance and click audit`
