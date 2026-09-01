/**
 * 内置笔记内容（markdown 原文，启动时写入 notes/ 目录）
 */

export const GuidContent = `# Welcome

This is a guide note, written entirely by this app.

All notes are stored as plain **Markdown files** in your home directory (\`~/.draftx/notes/\`) — the \`.md\` file is the source of truth. You can edit them with any editor you like.

## How it works

- Press **Alt + Z** to summon DraftX anywhere.
- Full Markdown support: headings, lists, tables, code blocks, math, mermaid, etc.
- Notes are saved instantly as you type; empty notes are removed automatically.
- Paste or drop images — they are saved into \`notes/.asset/\` automatically.
- 100% local data — nothing leaves your machine.
- AI super-powers via Ollama: set your endpoint and model ID in settings.

---

# 欢迎使用

这是一个指南笔记，正如你所见，完完全全由此应用所写。

所有笔记都以 **Markdown 文件** 的形式存储在 \`~/.draftx/notes/\` 目录下——md 文件即事实来源，你可以用任何喜欢的编辑器打开修改。

## 使用方式

- 使用 **Alt + Z** 随时唤起 DraftX
- 完整 Markdown 支持：标题、列表、表格、代码块、数学公式、Mermaid 图表等
- 所有编辑即时保存为 md 文件；内容为空的笔记会被自动删除
- 直接粘贴或拖入图片，会自动保存到 \`notes/.asset/\` 目录
- 数据 100% 存储在本地
- AI 功能由 Ollama 提供，你可以在设置中配置 Ollama 地址与模型 ID
`


// 更新说明
export const UpdateContent = `# Release Notes

## 2.0.0

- Notes are now stored as plain Markdown files in \`~/.draftx/notes/\` — the \`.md\` file is the source of truth.
- Brand new editor powered by Vditor, with native support for tables, math and mermaid.
- Full-text search (including Chinese) is powered by a local FTS index.

## 1.5.0

- Added MCP service support: interact with your notes using Openclaw or other agents.
- Added image support: insert images into your notes.
`
