import { ipcMain, app, shell } from 'electron';


export function initializeSystemApi() {
    // 变更视窗大小
    ipcMain.on('resize-window', async (_event, size: { width: number, height: number }) => {
        console.log('resize-window111', size);
        const { windowManager } = await import('../core/windowManager.js');
        windowManager.resizeWindow(size);
    })
}
