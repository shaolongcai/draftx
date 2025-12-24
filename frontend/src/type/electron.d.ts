

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content?: string;
}

// 配置类型
type ConfigType = 'isFinishGuide'
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
    resizeWindow: (size: { width: number, height: number }) => Promise<void>;

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