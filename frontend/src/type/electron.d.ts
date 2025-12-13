

interface ElectronAPI {


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