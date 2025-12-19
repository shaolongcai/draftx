import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
import { existsSync } from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';
/**
 * 管理窗口
 * 左窗口：设置
 * 中窗口：便利贴
 */
class WindowManager {

    private static instance: WindowManager;
    // 这里应该要私有化，提供get方法，暂时公开
    public mainWindow: BrowserWindow; //search 窗口
    public settingsWindow: BrowserWindow; //settings 窗口


    private constructor() {
        this.initAllWindows();
        this.centerOnCurrentDisplay();
    }

    // 初始化所有窗口
    private initAllWindows() {
        this.initMainWindow();
        this.initSettingsWindow();
        this.loadWindows();
    }

    // 初始化main窗口
    private initMainWindow() {
        this.mainWindow = new BrowserWindow({
            width: 504,
            height: 700,
            x: 0,               // 后面会计算居中
            y: 0,
            frame: false,       // 无边框
            resizable: false,
            movable: true,
            alwaysOnTop: true,  // 总在最前
            skipTaskbar: true,  // 不占用任务栏
            show: false,        // 先不显示
            transparent: true,
            backgroundColor: '#00000000',
            // backgroundColor: '#E92828',

            // vibrancy: 'under-window', // macOS 模糊效果，增强边框层次
            // titleBarStyle: 'hidden', // 隐藏原生标题栏，保留边框
            webPreferences: {
                preload: path.join(__dirname, '../main/preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // 生產環境：屏蔽開發者工具快捷鍵
        this.mainWindow.webContents.on('before-input-event', this.disableDevTools);

        // 窗口加载完成后(同时所有窗口变更)
        this.mainWindow.once('ready-to-show', () => {
            if (this.mainWindow && this.settingsWindow) {
                // 檢查是否為開機自動啟動
                const loginItemSettings = app.getLoginItemSettings();
                const isAutoLaunch = loginItemSettings.wasOpenedAtLogin || loginItemSettings.wasOpenedAsHidden;

                if (isAutoLaunch) {
                    logger.info('檢測到開機自動啟動，主窗口將保持隱藏狀態');
                    // 開機自動啟動時，不顯示主窗口，只顯示在托盤
                } else {
                    // 正常啟動時，先显示搜索窗口以显示加载状态
                    this.mainWindow.show();
                }
            }
        });
    }

    // 初始化settings窗口
    private initSettingsWindow() {
        this.settingsWindow = new BrowserWindow({
            width: 480,
            height: 700,
            x: 0,               // 后面会计算居中
            y: 0,
            frame: false,       // 无边框
            resizable: false,
            movable: true,
            alwaysOnTop: true,  // 总在最前
            skipTaskbar: true,  // 不占用任务栏
            show: false,        // 先不显示
            transparent: true,
            backgroundColor: '#00000000',
            // backgroundColor: '#E92828', //测试大小专用色
            webPreferences: {
                preload: path.join(__dirname, '../main/preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        this.settingsWindow.webContents.on('before-input-event', this.disableDevTools);
    }

    // 返回实例
    public static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
        }
        return WindowManager.instance;
    }

    // 为窗口加载内容
    private loadWindows() {
        if (isDev) {
            this.mainWindow.loadURL('http://localhost:5173');   // 加载搜索条HTML
            // this.settingsWindow.loadURL('http://localhost:5173/setting.html');   // 加载设置条HTML
            this.mainWindow.webContents.openDevTools(); //打开开发者工具        
            // this.settingsWindow.webContents.openDevTools(); //打开开发者工具
        } else {
            // 获取应用根目录
            const appPath = app.getAppPath();
            const mainPath = path.join(appPath, 'frontend/dist/index.html');
            // const settingPath = path.join(__dirname, '../frontend/dist/setting.html');

            // 檢查文件是否存在
            if (!existsSync(mainPath)) {
                logger.error(`主窗口窗口文件不存在: ${mainPath}`);
            } else {
                this.mainWindow.loadFile(mainPath).catch((error) => {
                    logger.error(`加載主窗口文件失敗: ${error}`);
                });
            }
            // if (!existsSync(settingPath)) {
            //     logger.error(`設置窗口文件不存在: ${settingPath}`);
            // } else {
            //     this.settingsWindow.loadFile(settingPath).catch((error) => {
            //         logger.error(`加載設置窗口文件失敗: ${error}`);
            //     });
            // }
        }

        // 當搜索框失去焦點時自動隱藏（開發模式下禁用，避免與開發者工具衝突）
        // if (!isDev) {
        //   searchWindow.on('blur', () => {
        //     if (searchWindow && searchWindow.isVisible()) {
        //       searchWindow.hide();
        //     }
        //   });
        // }
    }

    // 计算屏幕居中
    private centerOnCurrentDisplay = () => {
        const cursor = screen.getCursorScreenPoint();
        const dist = screen.getDisplayNearestPoint(cursor).workArea;
        const { width, height } = this.mainWindow.getBounds();
        const { width: settingsWidth, height: settingsHeight } = this.settingsWindow.getBounds();
        this.mainWindow.setBounds({
            x: Math.round(dist.x + (dist.width - width) / 2),
            y: Math.round(dist.y + dist.height * 0.25)   // 屏幕 1/4 处
        });
        // 设置窗口居中
        this.settingsWindow.setBounds({
            x: Math.round(dist.x + (dist.width - settingsWidth) / 2),
            y: Math.round(dist.y + dist.height * 0.25)   // 屏幕 1/4 处
        });
    }


    // 生产环境禁止开发者工具
    private disableDevTools = (event: any, input: any) => {
        // 屏蔽 Ctrl+Shift+I (Windows/Linux) 和 Cmd+Option+I (macOS)
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            event.preventDefault();
        }
        // 屏蔽 F12
        if (input.key === 'F12') {
            event.preventDefault();
        }
        // 屏蔽 Ctrl+Shift+C (元素檢查器)
        if (input.control && input.shift && input.key.toLowerCase() === 'c') {
            event.preventDefault();
        }
    }

    // 变更窗口大小
    public resizeWindow(size: { width: number, height: number }) {
        if (!size.height || !size.width) return;
        // 暂时固定窗口伸展大小,(暂时不更改宽度)
        this.mainWindow.setBounds({
            // width: size.width,
            height: size.height + 8 || this.mainWindow.getBounds().height + 8
        });
    }

    destroy() {
        this.mainWindow.destroy();
        this.settingsWindow.destroy();
    }
}

// 导出单例
export const windowManager = WindowManager.getInstance();   