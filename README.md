# Electron React TypeScript 应用

一个完整的 Electron 桌面应用程序，集成了现代化的前端技术栈和后端数据库。

## 🚀 技术栈

### 前端
- **React 19** - 现代化的 UI 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具
- **TailwindCSS** - 实用优先的 CSS 框架
- **Material-UI (MUI)** - React 组件库
- **ahooks** - 实用的 React Hooks 库
- **pnpm** - 快速的包管理器

### 后端
- **Node.js** - JavaScript 运行时
- **SQLite** - 轻量级数据库
- **TypeScript** - 类型安全

### 桌面应用
- **Electron** - 跨平台桌面应用框架

## 📁 项目结构

```
electron-react-app/
├── frontend/                 # React 前端应用
│   ├── src/                 # 源代码
│   ├── public/              # 静态资源
│   ├── tailwind.config.js   # TailwindCSS 配置
│   ├── postcss.config.js    # PostCSS 配置
│   └── package.json         # 前端依赖
├── src/
│   ├── main/                # Electron 主进程
│   │   ├── main.ts         # 主进程入口
│   │   └── preload.ts      # 预加载脚本
│   └── server/              # 后端服务器
│       └── server.ts       # SQLite 数据库操作
├── scripts/                 # 构建和开发脚本
│   ├── dev.js              # 开发启动脚本
│   └── build.js            # 构建脚本
├── data/                    # 数据库文件
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

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📋 可用脚本

### 开发
- `npm run dev` - 启动完整的开发环境
- `npm run dev:renderer` - 仅启动前端开发服务器
- `npm run dev:main` - 编译主进程 TypeScript（监听模式）
- `npm run dev:server` - 编译服务器 TypeScript（监听模式）

### 构建
- `npm run build` - 构建完整应用
- `npm run build:renderer` - 仅构建前端
- `npm run build:main` - 仅编译主进程
- `npm run build:server` - 仅编译服务器

### 其他
- `npm start` - 启动构建后的 Electron 应用
- `npm run clean` - 清理构建文件
- `npm run rebuild` - 清理并重新构建

## 🔧 开发指南

### 前端开发
前端代码位于 `frontend/` 目录，使用标准的 React + TypeScript + Vite 开发流程。

```bash
cd frontend
pnpm dev        # 启动开发服务器
pnpm build      # 构建生产版本
```

### 后端开发
后端代码位于 `src/server/` 目录，使用 TypeScript 编写，支持 SQLite 数据库操作。

### Electron 主进程
主进程代码位于 `src/main/` 目录，负责创建窗口和处理系统级事件。

### 数据库
使用 SQLite 作为数据库，数据库文件位于 `data/app.db`。

## 🎯 功能特性

- ✅ 现代化的 UI 界面
- ✅ 响应式设计
- ✅ 本地数据存储
- ✅ 数据库操作
- ✅ 跨平台支持
- ✅ 热重载开发体验
- ✅ TypeScript 类型安全

## 🔍 代码示例

### 使用 MUI 组件
```tsx
import { Button, Card, Typography } from '@mui/material';

function MyComponent() {
  return (
    <Card className="p-4 shadow-lg">
      <Typography variant="h6">标题</Typography>
      <Button variant="contained" color="primary">
        按钮
      </Button>
    </Card>
  );
}
```

### 使用 ahooks
```tsx
import { useLocalStorageState } from 'ahooks';

function MyComponent() {
  const [value, setValue] = useLocalStorageState('my-key', {
    defaultValue: 'default'
  });
  
  return <div>{value}</div>;
}
```

### 使用 TailwindCSS
```tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
  <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold text-gray-800">标题</h1>
  </div>
</div>
```

## 🚀 部署

1. **构建应用**
   ```bash
   npm run build
   ```

2. **启动应用**
   ```bash
   npm start
   ```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 💡 注意事项

- 首次运行时会自动创建数据库文件
- 开发模式下会自动打开开发者工具
- 生产模式下会加载构建后的静态文件
- 支持 Windows、macOS 和 Linux 平台