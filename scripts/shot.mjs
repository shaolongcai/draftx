// 截图验证脚本：以接近真实的窗口尺寸加载 vite dev 页面并截图（仅本地调试用）
import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 460,
        height: 500,
        show: true,
        backgroundColor: '#F9F3E5',
        webPreferences: {
            preload: path.join(__dirname, 'shot-preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.webContents.on('console-message', (_e, _level, message) => {
        console.log('[renderer]', message.slice(0, 500));
    });
    win.webContents.on('render-process-gone', (_e, details) => {
        console.log('[render-process-gone]', JSON.stringify(details));
    });

    await win.loadURL('http://localhost:5199');
    // 等待 Vditor 初始化与字体加载
    await new Promise((r) => setTimeout(r, 10000));
    // 模拟点击聚焦编辑器（验证 focus 态背景）
    await win.webContents.executeJavaScript(`document.querySelector('.draftx-vditor .vditor-ir pre.vditor-reset')?.focus()`);
    await new Promise((r) => setTimeout(r, 500));
    console.log('current url:', win.webContents.getURL());
    const debug = await win.webContents.executeJavaScript(`(() => {
        const pre = document.querySelector('.draftx-vditor .vditor-ir pre.vditor-reset');
        const codeBlock = document.querySelector('.draftx-vditor .vditor-ir__node[data-type="code-block"]');
        const codePreview = codeBlock?.querySelector('.vditor-ir__preview');
        return JSON.stringify({
            irLen: pre ? pre.innerHTML.length : null,
            placeholder: pre ? pre.getAttribute('placeholder') : null,
            prePadding: pre ? getComputedStyle(pre).padding : null,
            focusBg: pre ? getComputedStyle(pre).backgroundColor : null,
            codeBlockExists: !!codeBlock,
            codePreviewHTML: codePreview ? codePreview.textContent.slice(0, 100) : null,
            codePreviewHeight: codePreview ? getComputedStyle(codePreview).height : null,
            hljsLoaded: !!document.querySelector('link[href*="highlight"], script[src*="highlight"]'),
        });
    })()`);
    console.log('debug:', debug);
    const image = await win.webContents.capturePage();
    const out = path.join(__dirname, 'editor-shot.png');
    fs.writeFileSync(out, image.toPNG());
    console.log('screenshot saved:', out);
    app.quit();
});
