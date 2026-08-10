# 动作电位同图三模式：最终评审修复报告

日期：2026-08-11

## 范围与结论

本轮只处理最终评审列出的四项问题，没有改变三模式范围、动作电位产生模式的“无恢复阶段”规则、共享神经纤维身份或整体视觉设计。

1. 将五个通道建模为带明确 `species` 和 `position` 的数据；动作电位产生阶段只开放 50% 的中央 Na⁺ 通道，静息阶段仍开放 34% 和 66% 两个 K⁺ 通道。
2. 给通道增加稳定的语义标识，并让 K⁺ 流通过 `data-channel-target="potassium-34"` 明确关联 34% K⁺ 通道。K⁺ 流和 Na⁺ 流均移入共享纤维的定位坐标系，分别使用 34% 和 50% 的纤维内位置；因此无需把纤维的舞台几何 `8% + 88% × position` 重复硬编码到覆盖层，桌面端与移动端纤维几何变化时仍保持对齐。
3. 减弱动态效果下，播放和重新播放按钮均显示为禁用；模式切换与知识卡继续可用，静态关键帧不变。
4. 兴奋区膜外/膜内符号改由 `frame.polarity` 推导。`inside-positive` 显示外负内正；若帧为 `outside-positive` 则显示外正内负。未兴奋区的全局基线电荷仍固定为外正内负。

## TDD：RED 证据

先只修改测试，然后执行：

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx
```

结果：退出码 1；2 个测试文件失败，15 个测试中 4 个失败、11 个通过。失败均与预期缺陷一一对应：

- “opens only the central sodium channel during generation”：找不到带通道种类/位置语义的唯一开放 Na⁺ 通道，期望 1、实际 0；
- “links resting potassium flow to the potassium channel at 34%”：找不到 34% K⁺ 通道的语义节点；
- “derives excited-zone signs from frame polarity without changing baseline charges”：期望 `+−`、实际仍为硬编码的 `−+`；
- “uses a static key frame for reduced motion”：播放按钮没有 `disabled` 状态。

这些是断言失败而非测试装配、语法或运行环境错误，证明回归测试能捕获本轮问题。

## TDD：GREEN 证据

完成最小实现后执行：

```text
npm test -- tests/action-potential/mode-components.test.tsx tests/action-potential/lab.test.tsx tests/action-potential/simulation.test.ts
```

结果：退出码 0；3 个测试文件全部通过，24/24 测试通过。

静态/响应式聚焦测试：

```text
npm test -- tests/site-metadata.test.ts tests/models/touch-targets.test.ts
```

结果：退出码 0；2 个测试文件全部通过，9/9 测试通过。

## 最终验证

按顺序重新执行完整验证链：

```text
npm test && npm run lint && npm run build && git diff --check
```

结果：总退出码 0。

- 全量测试：19 个测试文件通过，151/151 测试通过；
- ESLint：退出码 0，无错误输出；
- 生产构建：Vinext 五个构建阶段全部成功，路由包含 `/models/action-potential`；
- `git diff --check`：退出码 0，无空白错误。

## 自审

### 教学准确性

- 产生模式只开放中央 Na⁺ 通道并保持 Na⁺ 内流/局部外负内正，不引入 K⁺ 外流或恢复静息内容。
- 静息模式的 K⁺ 外流指向真实存在且开放的 34% K⁺ 通道；另一枚 66% K⁺ 通道保持开放，符合既有静息示意。
- 兴奋区反极化只覆盖 `excitedCenters` 对应局部，未兴奋区的外正内负基线没有整体翻转。

### 响应式与交互影响

- 离子流现在相对 `.ap-fiber` 定位，34%/50% 坐标与通道共享父坐标系；移动端纤维从 `left: 8%; right: 4%` 改为 `left: 9%; right: 2%` 时仍自动对齐。
- 仅对离子流的纵向基准在移动端保留原几何对应的 `-60px`，没有改变舞台宽度、纤维尺寸或模式布局。
- 禁用态只影响两个播放控件；三个模式按钮、静态关键帧和知识卡不受影响，44px 点击高度规则仍由既有全局规则覆盖。

## 关注项

无已知阻塞或遗留功能问题。本轮没有重新做浏览器截图回归；响应式影响由共享坐标系设计、自审和现有静态/触摸目标测试覆盖。
