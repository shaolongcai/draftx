

// 保存便利贴参数
type StickyParmas = {
    uuid: string;
    title?: string;
    content?: string;
    contentString?: string;
}

interface ElectronAPI {

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