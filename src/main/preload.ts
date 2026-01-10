const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 便利贴相关
  saveSticky: (stickyNote: StickyParmas) => ipcRenderer.send('save-sticky', stickyNote), // 保存 stickyNote API
  getDraft: (query: string, limit: number) => ipcRenderer.invoke('get-draft', query, limit),   // 搜索 stickyNote API
  addDeleteDay: (id: number) => ipcRenderer.send('add-delete-day', id), // 点击增加天数
  getGuideMemo: () => ipcRenderer.invoke('get-guide-memo'), // 获取引导memo

  // 系统相关
  setConfig: (params: ConfigParams) => ipcRenderer.invoke('set-config', params.key, params.value, params.type), // 设置用户配置
  getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),  // 获取用户配置
  resizeWindow: (windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => ipcRenderer.send('resize-window', windowName, size), // 变更窗口大小
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'), // 检查更新
  downloadUpdate: () => ipcRenderer.invoke('download-update'),  // 下载新版本

  // AI相关
  checkOllamaServer: () => ipcRenderer.invoke('check-ollama-server'), // 检查ollama服务是否可用
  saveAITool: (toolData: AITool) => ipcRenderer.send('save-ai-tool', toolData), // 保存AI工具 
  getAITools: (id?: number) => ipcRenderer.invoke('get-ai-tools', id), // 获取AI工具

  // AI流式对话
  chatStream: (message?: string, toolId?: number) => ipcRenderer.send('chat-stream', message, toolId), // 发起流式对话
  onChatStream: (callback: (chunk: string) => void) => {
    const listener = (_event: any, chunk: string) => callback(chunk);
    ipcRenderer.on('chat-stream-data', listener);
    return () => ipcRenderer.removeListener('chat-stream-data', listener);
  }, // 监听流式数据
  onChatStreamEnd: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('chat-stream-end', listener);
    return () => ipcRenderer.removeListener('chat-stream-end', listener);
  }, // 监听流式结束
  onChatStreamError: (callback: (error: string) => void) => {
    const listener = (_event: any, error: string) => callback(error);
    ipcRenderer.on('chat-stream-error', listener);
    return () => ipcRenderer.removeListener('chat-stream-error', listener);
  }, // 监听流式错误

  // 复制相关
  readClipboardText: () => ipcRenderer.invoke('read-clipboard-text'), // 读取系统剪贴板文本

});

// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});