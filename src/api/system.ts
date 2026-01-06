import { ipcMain, app, shell, clipboard } from 'electron';
import { getConfig, setConfig } from '../database/sqlite.js';

export function initializeSystemApi() {
    // 变更视窗大小
    ipcMain.on('resize-window', async (_event, windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => {
        const { windowManager } = await import('../core/windowManager.js');
        windowManager.resizeWindow(windowName, size);
    })

    // 获取配置
    ipcMain.handle('get-config', async (_event, key: ConfigType) => {
        const config = getConfig(key);
        return config;
    })

    // 设置配置
    ipcMain.handle('set-config', async (_event, key: ConfigType, value: any, type?: 'boolean' | 'string' | 'number') => {
        const config = setConfig(key, value, type);
        return config;
    })

    // 新增：读取系统剪贴板文本
    ipcMain.handle('read-clipboard-text', async () => {
        return clipboard.readText();
    });
}

