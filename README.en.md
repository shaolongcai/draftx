# DraftX — A Lightweight Note-Taking App

[中文](README.md) | English

This is a lightweight note-taking app for those "I just want to jot something down" moments. It stores notes as local Markdown files (you can also think of it as an MD editor).

![笔记截图](image.png)

## 🚀 Tech Stack

- Built with **Electron**, packaged for both Windows and macOS
- Frontend built with **React + TypeScript + TailwindCSS**
- **SQLite** database stores note metadata, while the notes themselves are saved as local `.md` files
- **Node.js** powers the backend
- Uses the open-source **Vditor** as the Markdown editor — you can build any MD editor you like on top of it

## 🎯 Key Features

- Responsive design — freely resizable beyond the agreed minimum width/height
- WYSIWYG Markdown editing (IR mode)
- No folders/categories by design — this app is meant for quickly jotting things down, not for systematic note-taking. There are already plenty of systematic note apps on the market
- **MCP support** — once the app starts, it launches an MCP server. Pair it with CodeX or WordBuddy to let AI summarize, create, or edit your notes
- **Your notes are yours** — notes are stored as local MD files, so you can edit them with any Markdown-capable software (e.g., VS Code, Typora)
- **Global hotkey** — unlike web-based notes, you can set a hotkey to summon the app instantly, without typing a URL or hunting through browser tabs
- **No login required** — this is a fully local app (official sync may be added in the future, but that's a story for later)
- **i18n** — built-in support for 8 languages (Simplified Chinese, Traditional Chinese, English, Japanese, Korean, French, German, Arabic), switchable in settings

## 📖 Roadmap

- This is a free local MD note app, but sync and an iOS version are planned (to make up for Typora lacking a mobile version — if Typora had an iOS app, I wouldn't have needed to build this)
- The future sync feature will most likely be paid (since it involves servers). You can also clone this repo and implement sync yourself
- Based on my personal needs, only iOS and desktop are planned. If you need something else, feel free to open an issue

## 📌 Disclaimer

Most of this app's code was built by AI. Regular scenarios have been tested, but edge cases and extreme conditions have not been thoroughly tested.

## 📁 Project Structure

```
electron-react-app/
├── frontend/                 # React frontend app
│   ├── src/                 # Source code (pages, components, i18n, themes, etc.)
│   ├── public/              # Static assets (localization packs, Vditor editor source)
│   ├── tailwind.config.ts   # TailwindCSS config
│   ├── postcss.config.js    # PostCSS config
│   └── package.json         # Frontend dependencies
├── src/
│   ├── main/                # Electron main process
│   │   ├── main.ts         # Main process entry
│   │   └── preload.ts      # Preload script
│   ├── api/                 # Main-process APIs (notes, AI, system, updates)
│   ├── core/                # Core modules (window management, file service, licensing, etc.)
│   ├── database/            # SQLite database operations
│   ├── server/              # Local services (MCP server, Ollama, update service)
│   └── workers/             # Worker threads
├── mcp-server/              # Standalone MCP server sub-project
├── resources/               # Packaging resources (update config, license public key)
├── electron/                # Electron-related assets (app icons, etc.)
├── scripts/                 # Build and dev scripts (run-dev / run-build, etc.)
├── dist/                    # Compiled output
└── package.json            # Project config
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd electron-react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev environment**
   ```bash
   npm run electron:dev
   ```

## 📋 Available Scripts

### Development
- `npm run electron:dev` — Start the full dev environment (frontend dev server + Electron)
- `npm run frontend:dev` — Start only the frontend dev server
- `npm run compile` — Compile main-process TypeScript

### Build
- `npm run build:win` — Build the Windows installer (includes MCP server build)
- `npm run build:mac` — Build the macOS installer (includes MCP server build)
- `npm run build:mcp` — Build only the MCP server
- `npm run build:main` — Compile the main process with code obfuscation

### Others
- `npm start` — Launch the app via electron-forge
- `npm run package` / `npm run make` — Package with electron-forge (the scripts/run-build scripts are recommended for packaging)
- `npm run rebuild` — Rebuild native modules with electron-rebuild

## 🔧 Development Guide

### Frontend Development
The frontend code lives in the `frontend/` directory and follows a standard React + TypeScript + Vite workflow.

```bash
cd frontend
pnpm dev        # Start the dev server
pnpm build      # Build for production
```

## 🚀 Deployment

1. **Build the app**
   ```bash
   npm run build:win   # Windows
   npm run build:mac   # macOS
   ```

2. **Start the app**
   ```bash
   npm start
   ```
