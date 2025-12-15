

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content?: string;
    contentString?: string;
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