# 动作电位的形成和传导｜高中生物交互模型

面向高中生物课堂演示与自主探究的单页面交互实验台。模型同步展示神经纤维上的局部兴奋与双向传播、记录点膜电位曲线、离子通道状态和阶段解释。

## 可操作内容

- 选择弱刺激、阈刺激或强刺激，比较局部电位与“全或无”的动作电位。
- 选择左侧、中部或右侧刺激，观察两个传播波前到达边界的先后差异。
- 拖动记录电极，比较记录距离对动作电位出现时间的影响。
- 使用播放、暂停、上下步、教学时间轴、速度和重置控制实验。
- 对照 Na⁺ 内流、K⁺ 外流、阈电位参考线和当前阶段区间理解曲线变化。

动画时间、传播速度、粒子和通道数量均为教学示意，不代表真实生理测量。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

开发服务启动后，按终端提示打开本地地址。

## 验证命令

```bash
npm test
npm run lint
npm run build
```

- `npm test`：运行 Vitest 模拟逻辑、交互、Canvas 绘制、元信息与 OG 资源回归测试。
- `npm run lint`：检查 TypeScript、React 与测试代码规范。
- `npm run build`：执行 Vinext/Cloudflare 生产构建。

## 主要目录

- `components/action-potential/`：模拟逻辑、实验台组件、Canvas 曲线和局部样式。
- `tests/action-potential/`：动作电位模拟与真实组件交互测试。
- `tests/site-metadata.test.ts`：站点元信息、OG 资源和 Canvas 响应式样式测试。
- `docs/superpowers/`：批准的设计与实施计划。
