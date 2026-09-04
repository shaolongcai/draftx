/* eslint-disable @typescript-eslint/no-explicit-any */

// 保存笔记参数（content 为 markdown 原文；从未保存过的新笔记内容为空则不落盘）
type NoteParmas = {
    uuid: string;
    title?: string;
    content: string;
    path?: string;
}

// 配置类型
type ConfigType = 'isFinishGuide' | 'ai_provider' | 'licenseData' | 'currentUuid' | 'launchShortcut' | 'report_agreement' | 'version' | 'theme' | 'app_language'
// 配置参数
export type ConfigParams = {
    key: ConfigType;
    value: any;
    type?: 'boolean' | 'string' | 'number' | 'json';
}

type ChatData = {
    content: string;
    type: 'stream' | 'done'
}

type DraftTimeFilter = {
    createdAfter?: string;
    createdBefore?: string;
    modifiedAfter?: string;
    modifiedBefore?: string;
}

// 试用期验证的枚举
export type TrialType = 'NOT_INITIALIZED' | 'MISMATCH' | 'VALID' | 'EXPIRED'



interface ElectronAPI {

    /**
     * 获取笔记列表（仅元数据，不含正文）
     * @param query 搜索词（支持中文全文搜索）
     * @returns 直接返回笔记列表
     */
    getDraft: (query: string, limit?: number, timeFilter?: DraftTimeFilter) => Promise<DraftResult[]>;

    /**
     * 保存笔记（写入 .md 文件；从未保存过的新笔记内容为空则不落盘）
     */
    saveSticky: (params: NoteParmas) => void;

    /**
     * 删除笔记（md 文件 + 元数据 + 索引）
     * @returns 是否删除成功（笔记不存在返回 false）
     */
    deleteNote: (uuid: string) => Promise<boolean>;

    /**
     * 保存图片到 notes/.asset/，返回相对路径（如 ".asset/xxx.png"）
     */
    saveImageAsset: (data: ArrayBuffer, ext?: string) => Promise<string>;

    /**
     * 获取笔记根目录绝对路径
     */
    getNotesDir: () => Promise<string>;

    /**
     * 设置窗口背景颜色
     */
    setBackgroundColor: (color: string) => void;

    /**
     * 获取应用版本
     */
    getAppVersion: () => Promise<string>;
    getMcpEntryPath: () => Promise<string>;

    /**
     * 获取配置
     * @param 可选 isFinishGuide 是否完成引导
     */
    getConfig: (key?: ConfigType) => Promise<any>;

    /**
     * 设置配置
     * @param 可选 isFinishGuide 是否完成引导
     */
    setConfig: (params: ConfigParams) => Promise<void>;

    /**
     * 监听配置变更
     */
    onConfigChange: (callback: (config: ConfigParams) => void) => () => void;

    /**
     * 根据UUID获取笔记（元数据 + md 正文）
     */
    getDraftByUuid: (uuid: string) => Promise<DraftResult | null>;

    /**
     * 检查Ollama服务是否可用
     * @param host Ollama服务地址
     * @returns code: 0 表示成功，1 表示失败 ,errMsg: 错误信息
     */
    checkOllamaServer: (host: string, modelID: string) => Promise<{ code: number, errMsg?: string }>

    /**
     * 更新托盘菜单语言
     */
    updateTrayLanguage(language: string): void;

    /**
     * 开始试用
     */
    startTrial: () => Promise<{ success: boolean, message?: string }>;

    /**
     * 验证试用
     * @returns Promise<{ success: boolean, message?: string, trialType: TrialType, trialEndDate?: number,试用结束时间 }>
     */
    verifyTrial: () => Promise<{ success: boolean, message?: string, trialType: TrialType, trialEndDate?: number }>;



    /**
     * 发起流式对话
     * @param currentStickyId 便利贴的ID
     * @param message 用户消息
     * @param context 上下文
     */
    chatStream: (message: string, context?: string) => void;

    /**
     * 监听流式数据
     * @returns 取消监听的函数
     */
    onChatStream: (callback: (chunk: ChatData) => void) => () => void;

    /**
     * 监听流式结束
     * @returns 取消监听的函数
     */
    onChatStreamEnd: (callback: () => void) => () => void;

    /**
     * 监听流式错误
     * @returns 取消监听的函数
     */
    onChatStreamError: (callback: (error: string) => void) => () => void;

    /**
     * 读取系统剪贴板文本
     */
    readClipboardText: () => Promise<string>;

    /**
     * 检查是否有更新
     */
    checkForUpdates: () => Promise<{ isUpdateAvailable: boolean, message: string }>;

    /**
     * 下载更新
     */
    downloadUpdate: () => Promise<void>;

    /**
     * 监听下载进度
     * @returns 取消监听的函数
     */
    onDownloadProgress: (callback: (progress: number) => void) => () => void;

    /**
     *  打开系统目录
     * @param type 目录类型
     * @param path 可选路径
     */
    openDir(type: OpenDirType, path?: string): Promise<void>;

    /**
     * 自动启动，静默启动
     */
    setAutoLaunch: (autoLaunch: boolean) => Promise<void>;

    /**
     * 打开外部链接
     */
    openExternalUrl: (url: string) => Promise<void>;

    /**
     * 关闭设置窗口
     */
    closeSettingsWindow: () => Promise<void>;

    /**
     * 获取唯一机器码
     * @returns 机器码(原始，未被hash)
     */
    getMachineId: () => Promise<string>;

    /**
     * 验证许可证
     */
    verifyLicense: () => Promise<boolean>;

    /**
     * 导出 Markdown
     */
    saveMarkdown: (content: string, name?: string) => Promise<{ success: boolean, message?: string, filePath?: string }>;

    onLanguageChanged(callback: (language: string) => void): void; // 語言更改監聽
}


// 实用工具
interface ElectronUtils {
    platform: string;
    isElectron: boolean;
    version: string;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
        electronUtils: ElectronUtils;
    }
}

export { };
