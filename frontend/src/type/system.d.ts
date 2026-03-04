


/**
 * 获取用户配置
 */
type UserConfig = {
    isFinishGuide: boolean; //是否完成引导
    report_agreement: boolean; //是否同意用户体验改进计划
    autoLaunch: boolean; //是否開機自啟動
    ai_provider: string; //AI服务配置(JSON字符串)
    launchShortcut: string; //启动快捷键
    theme: 'default' | 'white' | 'forest' | 'dark'; //主题
}