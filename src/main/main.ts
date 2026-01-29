import { app, BrowserWindow, nativeImage, Tray, globalShortcut, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getConfig, initializeDatabase, setConfig } from '../database/sqlite.js';
import { initializeDraftApi } from '../api/draft.js';
import { deleteExpiredStickys, getAITools, getDraftByUuid, getGuideMemo, saveAITool, saveStickyNote } from '../database/repositories.js';
import { initializeSystemApi } from '../api/system.js';
import { logger } from '../core/logger.js';
import { GuidJson, GuidContent, UpdateContent, UpdateJson } from '../data/data.js';
import { initializeAIApi } from '../api/ai.js';
import { initializeUpdateApi } from '../api/update.js';
import { reportErrorToWechat } from '../units/report.js';
import pkg from 'node-machine-id';
const { machineId } = pkg;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMac = process.platform === 'darwin';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;
const isDev = process.env.NODE_ENV === 'development';

// 防止多开：必须在应用启动的最早阶段执行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock && !isDev) {
  // 获取锁失败，说明已有实例运行，直接退出(开发环境忽略)
  // 注意：此时 logger 可能还未初始化，直接用 console
  logger.warn('应用已在运行，退出当前实例');
  app.quit();
  // 强制退出进程，不再执行后续代码
  process.exit(0);
}


// 根据平台与环境判断快捷键
const getDefaultShortcut = () => {
  // 正式环境
  if (isMac && !isDev) {
    return 'Command+z';
  } else if (isMac && isDev) {
    return 'Command+Shift+z';
  } else if (!isMac && isDev) {
    return 'Alt+Shift+ Z ';
  } else {
    return 'Alt+Z';
  }
}

// 获取快捷键标签
const getShortcutLabel = () => {
  // 获取配置键
  let shortcut = getConfig('launchShortcut') as string;
  if (!shortcut) {
    shortcut = getDefaultShortcut();
  }

  // Mac 下格式化显示
  if (isMac) {
    return shortcut
      .replace(/Command/g, '⌘')
      .replace(/Control/g, '⌃')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/\+/g, ' ');
  }

  return shortcut;
}


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
export const registerGlobalShortcut = () => {
  // 先注销所有，防止重复
  globalShortcut.unregisterAll();

  // globalShortcut.register('Escape', () => {
  //   mainWindow.hide();
  //   settingsWindow.hide();
  // });

  // 获取快捷键
  let shortcut = getConfig('launchShortcut') as string;
  // 如果没有配置快捷键，则使用默认值
  if (!shortcut) {
    shortcut = getDefaultShortcut();
  }

  try {
    const ret = globalShortcut.register(shortcut, () => {
      settingsWindow.hide()
      // 触发：显示/隐藏主窗口
      if (mainWindow?.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
    });

    if (!ret) {
      logger.error(`注册快捷键失败: ${shortcut}`);
    } else {
      logger.info(`快捷键注册成功: ${shortcut}`);
      // 更新托盘菜单的快捷键显示
      updateTrayTitle();
    }
  } catch (error) {
    logger.error(`注册快捷键异常: ${error}`);
  }
}

// 更新托盘菜单
const updateTrayTitle = () => {
  if (!tray) return;
  try {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `DraftX（ ${getShortcutLabel()} ）`,
        click: () => {
          const isVisible = mainWindow?.isVisible();
          isVisible ? mainWindow.hide() : mainWindow.show();
          mainWindow?.focus();
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          mainWindow?.hide();
          settingsWindow?.focus();
          const isVisible = settingsWindow?.isVisible();
          isVisible ? settingsWindow?.hide() : settingsWindow?.show();
        }
      },
      {
        label: 'Restart',
        click: () => {
          app.relaunch();
          app.exit(0);
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  } catch (error) {
    logger.error(`更新托盘菜单失败: ${error}`);
  }
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

    // 初始化托盘菜单
    updateTrayTitle();

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
const initializeGuideMemo = async () => {
  //查询是否已经有引导memo
  const guideMemo = getDraftByUuid('guide');
  if (!guideMemo) {
    // 初始化时，发送消息到企业微信
    const id = await machineId(true);
    reportErrorToWechat({
      类型: '新增一个用户',
      机器码: id,
    })
    // 没有引导memo，创建一个
    saveStickyNote({
      uuid: 'guide',
      content: GuidContent,
      contentJson: JSON.stringify(GuidJson),
    });
  }
}

// 初始化更新说明草稿
const initializeUpdateDraft = async () => {
  // 查询当前版本
  const currentVersion = app.getVersion();
  logger.info(`当前版本: ${currentVersion}`);
  const version = getConfig('version') as string;
  // 如果版本号相同，则不需要修改更新说明
  if (version === currentVersion) {
    return;
  }
  saveStickyNote({
    uuid: 'update',
    content: UpdateContent,
    contentJson: JSON.stringify(UpdateJson),
  });
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

  // macOS 上隐藏 Dock 图标（实现 skipTaskbar 效果）
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
  // 初始化引导memo
  initializeGuideMemo()
  // 初始化更新说明草稿
  initializeUpdateDraft()
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

// 获取锁成功，监听 second-instance 事件
app.on('second-instance', () => {
  // 若为开发环境则忽略多开
  if (process.env.NODE_ENV === 'development') {
    logger.info('开发环境，忽略多开限制');
    return
  }
  logger.info('检测到第二个实例启动，激活现有窗口');
  // 如果主窗口存在，显示并聚焦
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});