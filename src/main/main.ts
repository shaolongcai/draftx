import { app, BrowserWindow, nativeImage, Tray, globalShortcut, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase, setConfig } from '../database/sqlite.js';
import { initializeDraftApi } from '../api/draft.js';
import { deleteExpiredStickys, getAITools, getGuideMemo, saveAITool, saveStickyNote } from '../database/repositories.js';
import { initializeSystemApi } from '../api/system.js';
import { logger } from '../core/logger.js';
import { GuidJson, GuidContent } from '../data/data.js';
import { initializeAIApi } from '../api/ai.js';
import { initializeUpdateApi } from '../api/update.js';

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
  const shortcut = isDev ? 'Alt+Shift+Z' : 'Alt+Z';
  globalShortcut.register(shortcut, () => {
    settingsWindow.hide()
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
        label: isDev ? 'DraftX（Alt + Shift + Z）' : 'DraftX（Alt + Z）',
        click: () => {
          const isVisible = mainWindow?.isVisible();
          isVisible ? mainWindow.hide() : mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'settings',
        click: () => {
          mainWindow.hide();
          settingsWindow.focus();
          const isVisible = settingsWindow?.isVisible();
          isVisible ? settingsWindow.hide() : settingsWindow.show();
        }
      },
      {
        label: 'restart',
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
        label: 'quit',
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


// 初始化引导的memo
const initializeGuideMemo = () => {
  //查询是否已经有引导memo
  const guideMemo = getGuideMemo();
  if (!guideMemo) {
    // 没有引导memo，创建一个
    saveStickyNote({
      uuid: 'guide',
      content: GuidContent,
      contentJson: JSON.stringify(GuidJson),
    });
  }
}

// 初始化AI工具
const initializeAITool = () => {
  // 检查是否有AI配置
  const tools = getAITools() as AITool[]
  if (tools.length === 0) {
    // 没有AI配置，提示用户配置
    logger.info('没有任何AI工具，初始化一个');
    // 初始化一个默认的AI工具
    saveAITool({
      name: 'Summary the above text',
      prompt: 'Organize the user input and generate a concise summary in a single paragraph without any markdown formatting',
    })
  }
}

// 初始化用户配置
const initializeUserConfig = () => {
  // 检查是否有用户配置
  const config = getConfig('autoLaunch');
  if (!config) {
    // 没有用户配置，提示用户配置
    logger.info('没有配置自动启动，初始化一个');
    setConfig('autoLaunch', true, 'boolean');
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
  initializeUpdateApi()
  initializeDraftApi();
  initializeSystemApi();
  initializeAIApi()
  // 创建托盘
  createTray();
  // 初始化引导memo
  initializeGuideMemo()
  // 初始化AI工具
  initializeAITool()
  // 初始化用户配置
  initializeUserConfig()
  // 删除所有过期的便利贴
  deleteExpiredStickys();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 防止多开
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 获取锁失败，说明已有实例运行，直接退出
  logger.info('应用已在运行，退出当前实例');
  app.quit();
} else {
  // 获取锁成功，监听 second-instance 事件
  app.on('second-instance', () => {
    logger.info('检测到第二个实例启动，激活现有窗口');
    // 如果主窗口存在，显示并聚焦
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});


