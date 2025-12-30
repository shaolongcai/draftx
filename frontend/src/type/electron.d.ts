

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content?: string;
}

// 配置类型
type ConfigType = 'isFinishGuide' | 'ai_provider'
// 配置参数
export type ConfigParams = {
    key: ConfigType;
    value: any;
    type?: 'boolean' | 'string' | 'number' | 'json';
}



interface ElectronAPI {

    /**
     * 搜索便利贴
     * @param query 搜索词
     * @returns 便利贴列表
     */
    searchSticky: (query: string) => Promise<StickyResult[]>;

    /**
     * 保存便利贴
     */
    saveSticky: (params: StickyParmas) => void;

    /**
     * 增加删除时间
     */
    addDeleteDay: (id: number) => void;

    /**
     * 变更窗口大小
     */
    resizeWindow: (windowName: 'mainWindow' | 'settingsWindow', size: { width: number, height: number }) => Promise<void>;

    /**
     * 获取最近的项目
     * @param limit 获取最近的项目数
     */
    getRecentStickys: (limit: number) => Promise<StickyResult[]>

    /**
     * 获取配置
     * @param 可选 isFinishGuide 是否完成引导
     */
    getConfig: (key: ConfigType) => Promise<any>;

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
     * @returns code: 0 表示成功，1 表示失败 ,errMsg: 错误信息
     */
    checkOllamaServer: () => Promise<{ code: number, errMsg?: string }>

    /**
     * 保存AI工具
     */
    saveAITool: (toolData: AITool) => Promise<void>;

    /**
     * 获取AI工具
     */
    getAITools: (id?: number) => Promise<AIToolItem[] | AIToolItem | null>;

    /**
     * 发起流式对话
     */
    chatStream: (message: string, toolId?: number) => void;

    /**
     * 监听流式数据
     * @returns 取消监听的函数
     */
    onChatStream: (callback: (chunk: string) => void) => () => void;

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