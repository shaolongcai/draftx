const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 便利贴相关
  saveSticky: (stickyNote: StickyParmas) => ipcRenderer.send('save-sticky', stickyNote), // 保存 stickyNote API
  searchSticky: (query: string) => ipcRenderer.invoke('search-sticky', query),   // 搜索 stickyNote API
  addDeleteDay: (id: number) => ipcRenderer.send('add-delete-day', id), // 点击增加天数
  getRecentStickys: (limit: number) => ipcRenderer.invoke('get-recent-stickys', limit), // 获取最近的便利贴

  // 系统相关
  resizeWindow: (size: { width: number, height: number }) => ipcRenderer.send('resize-window', size), // 变更窗口大小

});


// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});