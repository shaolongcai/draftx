import { app, BrowserWindow, nativeImage, Tray, globalShortcut, Menu, protocol, net } from 'electron';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getConfig, initializeDatabase, setConfig } from '../database/sqlite.js';
import { initializeDraftApi } from '../api/draft.js';
import { getAITools, saveAITool, saveNote, syncNotesWithFiles } from '../database/repositories.js';
import { initializeSystemApi } from '../api/system.js';
import { logger } from '../core/logger.js';
import { UpdateContent } from '../data/data.js';
import { initializeAIApi } from '../api/ai.js';
import { initializeUpdateApi } from '../api/update.js';
import { startLocalServer } from '../server/mcpLocalServer.js';
import { syncMcpServer } from '../server/mcpInstaller.js';
import pathConfig from '../core/pathConfigs.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isMac = process.platform === 'darwin';

// 注册笔记资源协议（必须在 app ready 之前调用）
// 渲染进程通过 draftx-asset://notes/<相对路径> 访问 notes 目录内的文件（如 .asset 图片），
// 在 dev（http://localhost:5174）与生产（file://）环境下均可加载，避免 file:// 被拦截
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'draftx-asset',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true }
  }
]);

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null;
let settingsWindow: BrowserWindow | null;
let appWindowManager: any = null; // 临时增加，用于正式退出
const isDev = process.env.NODE_ENV === 'development';

process.on('uncaughtException', (error) => {
  const msg = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
  logger.error(`主进程未捕获异常: ${msg}`);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? `${reason.message}\n${reason.stack || ''}` : String(reason);
  logger.error(`主进程未处理拒绝: ${msg}`);
});

// 防止多开：必须在应用启动的最早阶段执行
// const gotTheLock = app.requestSingleInstanceLock();
// if (!gotTheLock && !isDev) {
//   // 获取锁失败，说明已有实例运行，直接退出(开发环境忽略)
//   // 注意：此时 logger 可能还未初始化，直接用 console
//   logger.warn('应用已在运行，退出当前实例');
//   app.quit();
//   // 强制退出进程，不再执行后续代码
//   process.exit(0);
// }


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
          // mainWindow?.hide();
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


// 初始化引导笔记（md 文件）
// 已迁移：改为用户在引导页选择完语言后，由前端调用 'initialize-guide-note'（见 src/api/draft.ts）
// 按所选语言生成中/英文版本，避免启动时语言未知导致生成错语言

// 初始化更新说明笔记
const initializeUpdateDraft = async () => {
  // 查询当前版本
  const currentVersion = app.getVersion();
  logger.info(`当前版本: ${currentVersion}`);
  const version = getConfig('version') as string;
  // 如果版本号相同，则不需要修改更新说明
  if (version === currentVersion) {
    return;
  }
  saveNote({
    uuid: 'update',
    title: 'Release Notes',
    content: UpdateContent,
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
  try {
    logger.info('应用 ready，开始初始化窗口');
    const { windowManager } = await import('../core/windowManager.js');
    logger.info('窗口管理器加载完成');
    appWindowManager = windowManager;
    mainWindow = windowManager.mainWindow;
    settingsWindow = windowManager.settingsWindow;
    initializeDatabase();
    logger.info('数据库初始化完成');
    // 笔记资源协议处理器：draftx-asset://notes/<相对路径> → notes 目录内文件
    protocol.handle('draftx-asset', (request) => {
      try {
        const url = new URL(request.url);
        const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        const notesRoot = pathConfig.get('notes');
        const abs = path.normalize(path.join(notesRoot, rel));
        // 防止路径穿越：只允许访问 notes 目录内的文件
        if (!abs.startsWith(path.normalize(notesRoot))) {
          return new Response('Forbidden', { status: 403 });
        }
        return net.fetch(pathToFileURL(abs).toString());
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    });
    registerGlobalShortcut();
    logger.info('全局快捷键注册完成');
    initializeUpdateApi()
    initializeDraftApi();
    initializeSystemApi();
    initializeAIApi();
    logger.info('所有API初始化完成');
    createTray();
    if (process.platform === 'darwin') {
      app.dock.hide();
    }

    // 耗时初始化挪到窗口内容加载完成后执行，避免阻塞首屏（窗口显示 / 开屏动画）
    mainWindow?.webContents.once('did-finish-load', () => {
      try {
        // 启动对账：md 文件是事实来源，同步元数据与全文索引
        syncNotesWithFiles();
        // 启动本地 MCP 桥接服务（listen 本身异步，开销极小）
        startLocalServer();
        // 同步 MCP Server 到固定数据目录（~/.draftx/mcp-server），供外部 MCP 客户端固定引用
        // 异步执行不等待：目录约 58MB，首次/升级时的拷贝若同步执行会卡住主进程事件循环
        // fire-and-forget，失败仅记录日志，不影响编辑器使用
        void syncMcpServer().then((mcpEntry) => {
          if (mcpEntry) {
            logger.info(`MCP 客户端配置参考: { "command": "node", "args": ["${mcpEntry.replace(/\\/g, '\\\\')}"] }`);
          }
        });
        initializeUpdateDraft()
        initializeAITool()
        initializeUserConfig();
        logger.info('用户配置初始化完成');
      } catch (error) {
        const msg = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
        logger.error(`延迟初始化失败: ${msg}`);
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? `${error.message}\n${error.stack || ''}` : String(error);
    logger.error(`应用启动失败: ${msg}`);
  }
});

// 为了解决macOS上的cltr+w 的关闭问题导致没有主体的问题
// app.on('window-all-closed', () => {
//   console.log('window-all-closed');
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

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

app.on('before-quit', () => {
  if (appWindowManager) {
    appWindowManager.isQuitting = true;
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});