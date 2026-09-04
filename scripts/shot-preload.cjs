// 截图验证用 preload：模拟 electronAPI（仅本地调试用）
const { contextBridge } = require('electron');

const guideContent = `# Release Notes

A plain paragraph to check alignment.

## 2.0.0

- Notes are now stored as plain Markdown files
- Brand new editor powered by Vditor

\`\`\`js
console.log('code block')
\`\`\`
`;

const configTable = {
    currentUuid: 'guide',
    isFinishGuide: false,
    version: '1.5.0',
    report_agreement: true,
    launchShortcut: 'Alt+Z',
    theme: 'light',
    app_language: 'en-US',
};

const apiTable = {
    verifyLicense: async () => true,
    verifyTrial: async () => ({ success: true, trialType: 'VALID' }),
    getConfig: async (key) => (key ? (configTable[key] ?? null) : configTable),
    setConfig: async () => { },
    getAppVersion: async () => '1.5.0',
    getDraftByUuid: async (uuid) => uuid === 'guide'
        ? { id: 1, uuid: 'guide', path: 'guide.md', title: 'Release Notes', mtime: Date.now(), created_at: '', content: guideContent }
        : null,
    getDraft: async () => [],
    saveSticky: () => { },
    saveImageAsset: async () => '.asset/test.png',
    getNotesDir: async () => 'C:/tmp',
    checkForUpdates: async () => ({ isUpdateAvailable: false, message: '' }),
    downloadUpdate: async () => { },
    onDownloadProgress: () => () => { },
    onConfigChange: () => () => { },
    onLanguageChanged: () => () => { },
    onChatStream: () => () => { },
    onChatStreamEnd: () => () => { },
    onChatStreamError: () => () => { },
    chatStream: () => { },
    readClipboardText: async () => '',
    saveMarkdown: async () => ({ success: true }),
    getMachineId: async () => 'test-machine',
    getMcpEntryPath: async () => '',
    getAITools: async () => [],
    setBackgroundColor: () => { },
    openDir: () => { },
    setAutoLaunch: () => { },
    openExternalUrl: () => { },
    closeSettingsWindow: () => { },
    startTrial: async () => ({ success: true }),
};

contextBridge.exposeInMainWorld('electronAPI', apiTable);

contextBridge.exposeInMainWorld('electronUtils', {
    platform: 'win32',
    isElectron: true,
    version: 'test',
});
