# Fish Markdown 🐟

一个美观实用的 Markdown 语法教程网站，帮助每个人轻松掌握 Markdown。

## 特性

- **完整教程** — 涵盖基础语法和扩展语法，从入门到精通
- **日/夜主题** — 支持明暗两种主题，自动检测系统偏好
- **在线练习场** — 实时 Markdown 编辑与预览，边学边练
- **速查表** — 常用语法速查卡片，方便随时查阅
- **响应式设计** — 完美适配桌面、平板和手机
- **一键复制** — 所有代码示例支持一键复制
- **阅读进度** — 顶部进度条显示阅读进度
- **键盘快捷键** — `/` 搜索，`T` 切换主题
- **零依赖后端** — 纯前端静态站点，部署在 Cloudflare Workers

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看效果。

### 部署到 Cloudflare Workers

```bash
npm run deploy
```

> 首次部署需要先登录 Cloudflare：`npx wrangler login`

## 项目结构

```
fish_markdown/
├── public/              # 静态资源（由 Workers 直接托管）
│   ├── index.html       # 主页面（教程内容）
│   ├── css/
│   │   └── style.css    # 样式（含日/夜主题）
│   └── js/
│       └── app.js       # 交互逻辑
├── package.json         # 项目配置
├── wrangler.toml        # Cloudflare Workers 配置
└── README.md            # 项目说明
```

## 技术栈

- **HTML / CSS / JavaScript** — 原生实现，无框架依赖
- **Cloudflare Workers** — 边缘部署，全球加速
- **marked.js** — Markdown 实时渲染（CDN 引入）
- **Google Fonts** — Noto Sans SC + JetBrains Mono

## 键盘快捷键

| 快捷键 | 功能 |
| ------ | ---- |
| `/` 或 `Ctrl+K` | 聚焦搜索框 |
| `T` | 切换日/夜主题 |
| `Esc` | 关闭搜索 |

## 许可证

MIT License
