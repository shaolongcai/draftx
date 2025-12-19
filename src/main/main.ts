import { app, BrowserWindow, nativeImage, Tray, globalShortcut, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase, setConfig } from '../database/sqlite.js';
import { initializeStickyApi } from '../api/stickys.js';
import { deleteExpiredStickys } from '../database/repositories.js';
import { initializeSystemApi } from '../api/system.js';
import { logger } from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;
const isDev = process.env.NODE_ENV === 'development';

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
  const shortcut = isDev ? 'Alt+Shift+Z' : 'Alt+Shift+Z';
  globalShortcut.register(shortcut, () => {
    // 触发：显示/隐藏主窗口
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

// 創建系統托盤
function createTray() {
  // 獲取當前語言
  // const language = getAppLanguage();
  // // 加載翻譯
  // const t = loadTrayTranslations(language); 

  try {
    // 獲取托盤圖標路徑,现在的项目结构，icon位置与开发是一样的
    const iconPath = path.join(__dirname, '../../electron/resources/assets/logo.png')

    // 創建托盤圖標
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    // 設置托盤提示文本
    // tray.setToolTip(t.tooltip);

    // 創建托盤菜單
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '便利贴（Alt + Shift + Z）',
        click: () => {
          const isVisible = mainWindow?.isVisible();
          isVisible ? mainWindow.hide() : mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        type: 'separator'
      },
      // {
      //   label: t.settings,
      //   click: () => {
      //     searchWindow.hide();
      //     settingsWindow.focus();
      //     const isVisible = settingsWindow?.isVisible();
      //     isVisible ? settingsWindow.hide() : settingsWindow.show();
      //   }
      // },
      {
        label: '重新启动',
        click: () => {
          // 重新啟動應用
          app.relaunch();
          app.exit(0);
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        }
      }
    ]);
    // 設置托盤菜單
    tray.setContextMenu(contextMenu);
    // 雙擊托盤圖標顯示主窗口
    tray.on('double-click', () => {
      mainWindow?.show();
      mainWindow?.focus();
    });
  } catch (error) {
    logger.error(`创建托盘中失败:${error}`);
  }
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
  initializeSystemApi();
  // 创建托盘
  createTray();
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


