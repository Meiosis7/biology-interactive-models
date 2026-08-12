# GitHub Pages 发布设计

## 目标

将“高中生物动态交互模型”发布到 GitHub Pages，公开地址固定为：

`https://meiosis7.github.io/biology-interactive-models/`

首页及六个模型页面均可直接访问，动画与交互功能保持完整。

## 发布方式

- 使用 GitHub Actions 构建并发布 GitHub Pages。
- 继续保留现有 Sites 公网地址作为备用，不修改或下线。
- GitHub 仓库的 `main` 分支更新后自动重新发布。
- 网页部署到仓库子路径 `/biology-interactive-models/`，应用内部链接和静态资源都使用该基础路径。

## 应用调整

- 增加 GitHub Pages 专用静态构建配置，不改变当前本地开发和 Sites 构建方式。
- GitHub Pages 构建时启用静态导出，并设置 `basePath` 和 `assetPrefix`。
- 将依赖请求域名的动态元数据改为可静态生成的站点元数据；GitHub Pages 使用固定公开地址，现有部署仍可使用相同的绝对社交预览地址。
- 添加 GitHub Actions 工作流，安装依赖、运行验证、生成静态文件并部署。
- 为 GitHub Pages 输出添加 `.nojekyll`，避免下划线资源目录被忽略。

## 验收标准

- GitHub Pages 构建与部署成功。
- 首页可打开并显示六个模型入口。
- 六个 `/models/*` 页面均可直接打开和刷新。
- 动作电位页面的模式切换、播放、暂停、下一步和重新演示可用。
- 页面没有资源 404、脚本错误或横向溢出。
- GitHub 仓库的 Pages 地址显示为公开且部署来源为 GitHub Actions。

## 回退与兼容

- Pages 配置和工作流独立于现有 Sites 发布流程。
- 如果 GitHub Pages 发布失败，现有公开网站仍可继续访问。
- 删除 Pages 工作流和专用构建配置即可回退，不影响模型源码和教学内容。
