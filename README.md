# 高中生物动态交互模型

面向高中生物选择性必修 1 课堂演示与自主探究的六模型交互实验台。内容从神经调节延伸至免疫调节，帮助学生把过程、图像与因果关系对应起来。

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

启动后访问首页 `http://localhost:3000/`，或直接打开下列模型路由：

- [动作电位](http://localhost:3000/models/action-potential)
- [突触传递](http://localhost:3000/models/synapse-transmission)
- [膜电位变化曲线](http://localhost:3000/models/membrane-potential-curve)
- [电表指针偏转](http://localhost:3000/models/meter-deflection)
- [体液免疫](http://localhost:3000/models/humoral-immunity)
- [细胞免疫](http://localhost:3000/models/cellular-immunity)

## 操作方式

- 选择模型提供的实验条件，例如刺激强度、突触类型、记录方式、抗原或免疫次数；切换条件会从相应过程的起点重新演示。
- 使用“开始刺激／开始演示”“播放／暂停”“上一步／下一步”“重置”和速度按钮控制过程；拖动教学时间轴可定位阶段。
- 使用页面顶部“全部模型”“上一个／下一个”在六个模型之间切换。
- 键盘操作：按 `Tab` 或 `Shift+Tab` 移动焦点，按 `Enter` 或 `Space` 激活已聚焦的按钮；聚焦时间轴后使用方向键微调时间位置。

## 教学示意说明

所有动画时间、粒子和细胞数量、传播速度、膜电位读数与曲线均为教学示意，不代表真实生理测量或比例。请将模型用于理解教材中的过程顺序、结构关系和因果链，而非读取实验定量数据。

## 验证

```bash
npm test
npm run lint
npm run build
```

## 目录结构

- `app/`：首页、站点元数据与六个 `/models/*` 路由入口。
- `components/action-potential/`：动作电位模型的交互界面、模拟逻辑、Canvas 图表与样式。
- `components/model-shell/`：模型总览页和跨模型导航。
- `models/02-synapse-transmission/`：突触传递模型。
- `models/03-membrane-potential-curve/`：膜电位变化曲线模型。
- `models/04-meter-deflection/`：电表指针偏转模型。
- `models/05-humoral-immunity/`：体液免疫模型。
- `models/06-cellular-immunity/`：细胞免疫模型。
- `models/catalog.ts`：六个模型的学习顺序、文案与路由目录。
- `public/og.png`：1200×630 的站点社交预览图。
- `tests/`：模型交互、模拟逻辑、导航与元数据回归测试。
