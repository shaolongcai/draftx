import { ipcMain, app, shell, clipboard, dialog, BrowserWindow } from 'electron';
import { getConfig, setConfig } from '../database/sqlite.js';
import pathConfig from '../core/pathConfigs.js';
import { logger } from '../core/logger.js';
import pkg from 'node-machine-id';
import { verifyLicense } from '../core/license.js';
import fs from 'fs';
import path from 'path';
import { decryptTimestamp, encryptTimestamp } from '../units/cyber.js';
import dayjs from 'dayjs';
const { machineId } = pkg;

export function initializeSystemApi() {

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
    ipcMain.handle('save-markdown', async (_event, content: string, name?: string) => {
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

    // 开启试用
    ipcMain.handle('start-trial', async () => {
        try {
            const id = await machineId(true);
            // 获取当前日期
            const currentDate = new Date();
            // 储存1：db数据库
            setConfig('trialStartDate', currentDate.getTime(), 'number');
            //  储存2 : 用户文件
            const encryptedBuffer = encryptTimestamp(currentDate.getTime(), id)
            const userPath = app.getPath('userData');
            const trialFilePath = path.join(userPath, 'x2.dat');
            await fs.promises.writeFile(trialFilePath, encryptedBuffer);
            return { success: true, message: 'Trial started successfully' };
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Trial start failed';
            logger.error(`Trial start failed: ${msg}`);
            return { success: false, message: msg };
        }
    })

    // 验证试用
    ipcMain.handle('verify-trial', async () => {
        const id = await machineId(true);
        // 检查db
        const trialStartDateFormDB = getConfig('trialStartDate') as number | null;
        // 检查文件
        const trialFilePath = path.join(app.getPath('userData'), 'x2.dat');
        // 如果两个都没有，简单认为没有试用过
        if (!trialStartDateFormDB && !fs.existsSync(trialFilePath)) {
            logger.info('未曾试用');
            return { success: false, message: '未曾试用', trialType: 'NOT_INITIALIZED' };
        }
        // 如果只有其中一个存在，则认为数据损坏，结束试用
        if (!trialStartDateFormDB || !fs.existsSync(trialFilePath)) {
            logger.info('试用文件丢失，试用数据损坏');
            return { success: false, message: '试用数据损坏', trialType: 'MISMATCH' }; // 试用数据损坏
        }

        try {
            const encryptedBuffer = await fs.promises.readFile(trialFilePath);
            const trialStartDateFormFile = decryptTimestamp(encryptedBuffer, id);
            // 验证文件数据是否与db上的数据一致
            if (trialStartDateFormFile !== trialStartDateFormDB) {
                logger.info('数据不一致，试用数据损坏');
                return { success: false, message: '试用数据损坏', trialType: 'MISMATCH' }; // 试用数据损坏
            }
            const currentDate = new Date().getTime();
            const trialEndDate = dayjs(trialStartDateFormDB).add(14, 'day').valueOf(); //时间戳
            console.log('trialEndDate', trialEndDate);
            if (currentDate <= trialEndDate) {
                return { success: true, message: 'Trial is valid', trialType: 'VALID', trialEndDate: trialEndDate || 0, };
            } else {
                logger.info('试用已过期');
                return { success: false, message: 'Trial expired', trialType: 'EXPIRED' };
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Trial verification failed';
            logger.error(`Trial verification failed: ${msg}`);
            return { success: false, message: msg, trialType: 'EXPIRED' };
        }
    })
}