# DraftX 一个轻量笔记应用

中文 | [English](README.en.md)

这是一个轻量化笔记应用，用于“只是想写些东西”的场景 。采用本地MD文件记录 （你也可以当他是一个MD编辑器）

## 🚀 技术栈

- 使用 Electron框架，来打包windows 以及 MAC 平台
- 使用 React + TS + TailwindCSS 来构建前端应用
- 使用 SQLite 数据库来存储笔记的元数据，并以.md 文件格式储存在本机中
- 使用 node.js 驱动后端
- 使用 开源的Vditor 作为MD编辑器，你可以在此基础上，构建任何你喜欢的MD编辑器

## 🎯 特色功能
- 响应式的设计，除了约定的最小宽高，可以自由拖拽调整大小
- 所见即所得的Markdwon编辑（IR特性）
- 无文件夹/分类设计，这个应用的初衷，只是提供来临时记些东西，而是一个系统性的笔记软件，关于系统性的笔记软件，市面上已经非常多
- MCP功能，启动应用后，会开启一个MCP服务，你可以搭配CodeX 或者 wordbuddy，让AI去总结、创建或者编辑你的笔记
- 你的笔记是你的：本应用采用本地MD文件格式储存，也就是说，你可以使用任何支持MD格式编辑的软件（例如 VScode、Typora 等）来编辑你的笔记
- 快捷键唤起：对比一些网页笔记，你可以设定快捷键，在有需要的时候立即唤出来，而无需输入网页或者在好几个浏览器页签中寻找。
- 无登录：本应用是一个本地应用，不需要登录。（将来可能会加入官方的同步逻辑，但那是后话）
- 多语言支持：内置 8 种语言（简体中文、繁体中文、英语、日语、韩语、法语、德语、阿拉伯语），可在设置中自由切换

## 📖 展望
- 这是一个免费的本地MD笔记应用，但将来会加入同步以及IOS端（来弥补 Typora 没有手机端的遗憾，如果Typora有IOS端，我就不需要开发这个了）
- 将来的同步功能，大概率会收费（因为涉及到服务器），你也可以克隆这个仓库，自己实现同步功能
- 基于我个人的需求，只有IOS跟桌面端的需求，其他若有需要，可以先留下issue


## 📌 特别说明
此应用，大部分的代码由AI构建，测试了常规部分，但是没有进行各种边界条件或者极限情况的测试。

## 📁 项目结构

```
electron-react-app/
├── frontend/                 # React 前端应用
│   ├── src/                 # 源代码（页面、组件、i18n、主题等）
│   ├── public/              # 静态资源（本地化语言包、Vditor 编辑器源码）
│   ├── tailwind.config.ts   # TailwindCSS 配置
│   ├── postcss.config.js    # PostCSS 配置
│   └── package.json         # 前端依赖
├── src/
│   ├── main/                # Electron 主进程
│   │   ├── main.ts         # 主进程入口
│   │   └── preload.ts      # 预加载脚本
│   ├── api/                 # 主进程 API（笔记、AI、系统、更新）
│   ├── core/                # 核心模块（窗口管理、文件服务、授权等）
│   ├── database/            # SQLite 数据库操作
│   ├── server/              # 本地服务（MCP 服务、Ollama、更新服务）
│   └── workers/             # Worker 线程
├── mcp-server/              # 独立的 MCP 服务子项目
├── resources/               # 打包资源（更新配置、授权公钥）
├── electron/                # Electron 相关资源（应用图标等）
├── scripts/                 # 构建和开发脚本（run-dev / run-build 等）
├── dist/                    # 编译输出目录
└── package.json            # 项目配置
```

## 🛠️ 开发环境搭建

### 前提条件
- Node.js (推荐 v18+)
- pnpm (包管理器)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd electron-react-app
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发环境**
   ```bash
   npm run electron:dev
   ```

## 📋 可用脚本

### 开发
- `npm run electron:dev` - 启动完整的开发环境（前端开发服务器 + Electron）
- `npm run frontend:dev` - 仅启动前端开发服务器
- `npm run compile` - 编译主进程 TypeScript

### 构建
- `npm run build:win` - 构建 Windows 安装包（含 MCP 服务构建）
- `npm run build:mac` - 构建 macOS 安装包（含 MCP 服务构建）
- `npm run build:mcp` - 仅构建 MCP 服务
- `npm run build:main` - 编译主进程并进行代码混淆

### 其他
- `npm start` - 通过 electron-forge 启动应用
- `npm run package` / `npm run make` - electron-forge 打包 (推荐使用 scripts/run-build 脚本进行打包)
- `npm run rebuild` - electron-rebuild 重建原生模块

## 🔧 开发指南

### 前端开发
前端代码位于 `frontend/` 目录，使用标准的 React + TypeScript + Vite 开发流程。

```bash
cd frontend
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产版本
```


## 🚀 部署

1. **构建应用**
   ```bash
   npm run build:win   # Windows
   npm run build:mac   # macOS
   ```

2. **启动应用**
   ```bash
   npm start
   ```
