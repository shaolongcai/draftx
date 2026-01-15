

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content: string;
    contentJson: string;
}

// 配置类型
type ConfigType = 'isFinishGuide' | 'ai_provider' | 'licenseData'
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


interface ElectronAPI {

    /**
     * 获取所有草稿
     * @param query 搜索词
     * @returns 直接返回草稿列表
     */
    getDraft: (query: string) => Promise<DraftResult[]>;

    /**
     * 保存便利贴
     */
    saveSticky: (params: StickyParmas) => void;

    /**
     * 刷新删除时间（默认30天）
     */
    refreshDeleteDay: (id: number) => void;

    /**
     * 变更窗口大小
     */
    resizeWindow: (windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => Promise<void>;

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
     * 获取引导memo
     */
    getGuideMemo: () => Promise<StickyResult>

    /**
     * 检查Ollama服务是否可用
     * @param host Ollama服务地址
     * @returns code: 0 表示成功，1 表示失败 ,errMsg: 错误信息
     */
    checkOllamaServer: (host: string, modelID: string) => Promise<{ code: number, errMsg?: string }>

    /**
     * 保存AI工具,带ID表示更新，不带ID表示新增
     */
    saveAITool: (toolData: AITool) => Promise<void>;

    /**
     * 获取AI工具
     */
    getAITools: (id?: number) => Promise<AIToolItem[] | AIToolItem | null>;

    /**
     * 删除AI工具
     */
    deleteAITool: (id: number) => Promise<void>;


    /**
     * 发起流式对话
     * @param currentStickyId 便利贴的ID
     * @param message 用户消息
     * @param toolId 工具ID
     */
    chatStream: (message?: string, toolId?: number) => void;

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