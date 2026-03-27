const { contextBridge, ipcRenderer } = require('electron'); //沙箱环境，这份文件只能使用这个导入方式

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 便利贴相关
  saveSticky: (stickyNote: StickyParmas) => ipcRenderer.send('save-sticky', stickyNote), // 保存 stickyNote API
  getDraft: (query: string, limit: number, timeFilter?: { createdAfter?: string; createdBefore?: string; modifiedAfter?: string; modifiedBefore?: string }) => ipcRenderer.invoke('get-draft', query, limit, timeFilter),   // 搜索 stickyNote API
  getDraftByUuid: (uuid: string) => ipcRenderer.invoke('get-draft-by-uuid', uuid), // 根据ID获取草稿
  refreshDeleteDay: (id: number) => ipcRenderer.send('refresh-delete-day', id), // 点击刷新删除时间
  /** @deprecated 使用 getDraftByUuid 替代 */
  getGuideMemo: () => ipcRenderer.invoke('get-guide-memo'), // 获取引导memo

  // 系统相关
  setConfig: (params: ConfigParams) => ipcRenderer.invoke('set-config', params.key, params.value, params.type), // 设置用户配置
  getConfig: (key?: string) => ipcRenderer.invoke('get-config', key),  // 获取用户配置
  setBackgroundColor: (color: string) => ipcRenderer.send('set-background-color', color), // 设置窗口背景颜色
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'), // 检查更新
  downloadUpdate: () => ipcRenderer.invoke('download-update'),  // 下载新版本
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, data) => callback(data)),  //监听下载进度,
  openDir: (type: string, path?: string) => ipcRenderer.send('open-dir', type, path), // 打开目录
  setAutoLaunch: (autoLaunch: boolean) => ipcRenderer.send('set-auto-launch', autoLaunch), // 自动启动，静默启动
  openExternalUrl: (url: string) => ipcRenderer.send('open-external-url', url), // 打开外部链接
  closeSettingsWindow: () => ipcRenderer.send('close-settings-window'), // 关闭设置窗口
  getMachineId: () => ipcRenderer.invoke('get-machine-id'), // 获取唯一机器码
  verifyLicense: () => ipcRenderer.invoke('verify-license'), // 验证许可证
  startTrial: () => ipcRenderer.invoke('start-trial'), // 开始试用
  verifyTrial: () => ipcRenderer.invoke('verify-trial'), // 验证试用
  getMcpEntryPath: () => ipcRenderer.invoke('get-mcp-entry-path'),



  // AI相关
  checkOllamaServer: (host: string, modelID: string) => ipcRenderer.invoke('check-ollama-server', host, modelID), // 检查ollama服务是否可用
  saveAITool: (toolData: AITool) => ipcRenderer.send('save-ai-tool', toolData), // 保存AI工具 
  getAITools: (id?: number) => ipcRenderer.invoke('get-ai-tools', id), // 获取AI工具
  deleteAITool: (id: number) => ipcRenderer.send('delete-ai-tool', id), // 删除AI工具

  // AI流式对话
  chatStream: (message: string, context?: string) => ipcRenderer.send('chat-stream', message, context), // 发起流式对话
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
  onConfigChange: (callback: (config: ConfigParams) => void) => {
    const listener = (_event: any, config: ConfigParams) => callback(config);
    ipcRenderer.on('config-changed', listener);
    return () => ipcRenderer.removeListener('config-changed', listener);
  }, // 监听配置变更

  onLanguageChanged: (callback) => {
    ipcRenderer.on('language-changed', (event, language) => callback(language));
    return () => ipcRenderer.removeListener('language-changed', callback);
  },// 語言更改監聽

  // 复制相关
  readClipboardText: () => ipcRenderer.invoke('read-clipboard-text'), // 读取系统剪贴板文本

  // 导出
  saveMarkdown: (content: string, name?: string) => ipcRenderer.invoke('save-markdown', content, name),

});

// 暴露一些实用工具
contextBridge.exposeInMainWorld('electronUtils', {
  platform: process.platform,
  isElectron: true,
  version: process.versions.electron
});
