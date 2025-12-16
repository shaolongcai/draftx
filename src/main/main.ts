import { app, BrowserWindow, ipcMain, Tray, globalShortcut } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase, setConfig } from '../database/sqlite.js';
import { initializeStickyApi } from '../api/stickys.js';
import { deleteExpiredStickys } from '../database/repositories.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;

// 广播事件到所有窗口
export const sendToRenderer = (channel: ChannelType, data: any) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send(channel, data);
  }
};

// 注册全局快捷键
const registerGlobalShortcut = () => {
  globalShortcut.register('Escape', () => {
    mainWindow.hide();
    settingsWindow.hide();
  });

  // 触发：显示/隐藏主窗口
  globalShortcut.register('Alt + z', () => {
    // 触发：显示/隐藏主窗口
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}


app.whenReady().then(async () => {
  // 准备窗口
  const { windowManager } = await import('../core/windowManager.js');
  mainWindow = windowManager.mainWindow;
  settingsWindow = windowManager.settingsWindow;
  // 初始化数据库
  initializeDatabase();
  // 注册全局快捷键
  registerGlobalShortcut();
  // 初始化 API
  initializeStickyApi();
  // 删除所有过期的便利贴
  deleteExpiredStickys();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC 通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});


