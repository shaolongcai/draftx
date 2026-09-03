


type ConfigName = 'isFinishGuide' | 'ai_provider' | 'autoLaunch' | 'licenseData' | 'currentUuid' | 'launchShortcut' | 'report_agreement' | 'version' | 'trialStartDate' | 'app_language';



/**
 * 更新结果
 */
interface UpdateResult {
    isUpdateAvailable: boolean; //是否有更新
    message: string; //信息
}


/**
 * 用户配置
 */
type UserConfig = {
    isFinishGuide: boolean;
    report_agreement: boolean;
    autoLaunch: boolean;
    ai_provider: string;
    currentUuid: string;
    launchShortcut: string;
}