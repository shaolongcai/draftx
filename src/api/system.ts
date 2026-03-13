import { ipcMain, app, shell, clipboard, dialog, BrowserWindow } from 'electron';
import { getConfig, setConfig } from '../database/sqlite.js';
import pathConfig from '../core/pathConfigs.js';
import { logger } from '../core/logger.js';
import pkg from 'node-machine-id';
import { verifyLicense } from '../core/license.js';
import fs from 'fs';
const { machineId } = pkg;

export function initializeSystemApi() {
    // 变更视窗大小
    ipcMain.on('resize-window', async (_event, windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => {
        const { windowManager } = await import('../core/windowManager.js');
        windowManager.resizeWindow(windowName, size);
    })

    // 设置窗口背景颜色
    ipcMain.on('set-background-color', async (_event, color: string) => {
        const { windowManager } = await import('../core/windowManager.js');
        windowManager.setBackgroundColor(color);
    })

    // 获取配置
    ipcMain.handle('get-config', async (_event, key?: ConfigType) => {
        // 若没传入key,则返回所有配置
        const config = getConfig(key);
        return config;
    })

    // 设置配置
    ipcMain.handle('set-config', async (_event, key: ConfigType, value: any, type?: 'boolean' | 'string' | 'number') => {
        const config = setConfig(key, value, type);
        console.log('注册的快捷键', value);
        // 如果是设置快捷键，则重新注册
        if (key === 'launchShortcut') {
            const { registerGlobalShortcut } = await import('../main/main.js');
            registerGlobalShortcut();
        }

        // 广播配置变更到所有窗口
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('config-changed', { key, value });
        });

        return config;
    })

    // 新增：读取系统剪贴板文本
    ipcMain.handle('read-clipboard-text', async () => {
        return clipboard.readText();
    });

    // 打开文件夹,(send要用on的)
    ipcMain.on('open-dir', (_event, type: 'runLog', path?: string) => {
        switch (type) {
            case 'runLog':
                const logsDir = pathConfig.get('logs')
                shell.openPath(logsDir);
                break;
            default:
            // todo 留下做其他文件夹的打开
        }
    });

    // 在外部瀏覽器中打開鏈接
    ipcMain.on('open-external-url', (_event, url: string) => {
        shell.openExternal(url);
    });

    // 設置自啟動狀態
    ipcMain.on('set-auto-launch', (_event, enabled: boolean, openAsHidden?: boolean) => {
        try {
            const exePath = app.getPath('exe');
            const args: string[] = [];

            // 开发模式下必须把"项目路径"作为参数传给 electron.exe
            // 否则 Windows 会启动裸 electron.exe，找不到应用入口，显示默认页面
            if (process.env.NODE_ENV === 'development') {
                args.push(app.getAppPath()); // 等价于 electron.exe <path-to-app>
            }

            app.setLoginItemSettings({
                openAtLogin: enabled,
                openAsHidden: true,
                path: exePath,
                args,
                name: app.getName(),
            });

            // 保存到數據庫
            setConfig('autoLaunch', enabled, 'boolean');
            logger.info(`設置自啟動狀態: ${enabled}, path=${exePath}, args=${JSON.stringify(args)}`);
            return true;
        } catch (error) {
            const msg = error instanceof Error ? error.message : '設置自啟動狀態失敗';
            logger.error(`設置自啟動狀態失敗: ${msg}`);
            return false;
        }
    });

    // 关闭设置窗口
    ipcMain.on('close-settings-window', async (_event) => {
        const { windowManager } = await import('../core/windowManager.js');
        windowManager.settingsWindow.hide();
    })

    // 获取唯一机器码
    ipcMain.handle('get-machine-id', async () => {
        const id = await machineId(true);
        return id;
    })

    // 验证许可证
    ipcMain.handle('verify-license', async () => {
        return await verifyLicense();
    })

    // 获取应用版本
    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    // 导出 Markdown
    ipcMain.handle('save-markdown', async (_event,content: string,name?:string ) => {
        try {
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Export Markdown',
                defaultPath: name || 'draft.md',
                filters: [
                    { name: 'Markdown', extensions: ['md'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (canceled || !filePath) {
                return { success: false, message: 'Canceled' };
            }

            await fs.promises.writeFile(filePath, content, 'utf-8');
            return { success: true, filePath };
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Export failed';
            logger.error(`导出 Markdown 失败: ${msg}`);
            return { success: false, message: msg };
        }
    });
}