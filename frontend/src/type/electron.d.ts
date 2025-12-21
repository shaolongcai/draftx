

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content?: string;
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