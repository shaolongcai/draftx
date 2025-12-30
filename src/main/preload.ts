const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 便利贴相关
  saveSticky: (stickyNote: StickyParmas) => ipcRenderer.send('save-sticky', stickyNote), // 保存 stickyNote API
  searchSticky: (query: string) => ipcRenderer.invoke('search-sticky', query),   // 搜索 stickyNote API
  addDeleteDay: (id: number) => ipcRenderer.send('add-delete-day', id), // 点击增加天数
  getRecentStickys: (limit: number) => ipcRenderer.invoke('get-recent-stickys', limit), // 获取最近的便利贴
  getGuideMemo: () => ipcRenderer.invoke('get-guide-memo'), // 获取引导memo

  // 系统相关
  setConfig: (params: ConfigParams) => ipcRenderer.invoke('set-config', params.key, params.value, params.type), // 设置用户配置
  getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),  // 获取用户配置
  resizeWindow: (windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => ipcRenderer.send('resize-window', windowName, size), // 变更窗口大小

  // AI相关
  checkOllamaServer: () => ipcRenderer.invoke('check-ollama-server'), // 检查ollama服务是否可用
  saveAITool: (toolData: AITool) => ipcRenderer.send('save-ai-tool', toolData), // 保存AI工具 

});


// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});