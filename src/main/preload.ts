const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式
 
// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 保存 stickyNote API
  saveSticky: (stickyNote: StickyParmas) => ipcRenderer.send('save-sticky', stickyNote),
});


// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
    platform: process.platform,
    isElectron: true,
    version: process.versions.electron
});