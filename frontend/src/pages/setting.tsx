import { Stack, Typography, IconButton, useTheme } from "@mui/material"
import { useEffect, useState } from "react";
import {
    Close as CloseIcon
} from '@mui/icons-material';
// import { useGlobalContext } from "@/contexts/globalContext";
import { Contact, SettingItem, LanguageSwitcher } from "@/components";
import { useTranslation } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { ConfigParams } from "@/type/electron";
import { useGlobal } from "@/contexts/GlobalContext";
import dayjs from "dayjs";
import { alpha } from "@mui/material/styles";

/**
 * 设置面板(主界面)
 */
const Setting = () => {

    const [reportAgreement, setReportAgreement] = useState(false) //是否同意上报问题
    const [shortcut, setShortcut] = useState('') //快捷键
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [trialDiffDays, setTrialDiffDays] = useState<number | null>(null)
    const [currentTheme, setCurrentTheme] = useState('default') //当前主题

    const { trialEndDate } = useGlobal()
    const { t } = useTranslation()
    const navigate = useNavigate();
    const theme = useTheme()

    // 查询试用期天数
    useEffect(() => {
        console.log('trialEndDate', trialEndDate)
        if (!trialEndDate) return
        const now = dayjs()
        const end = dayjs(trialEndDate)
        const diffDays = end.diff(now, 'day')
        console.log('试用期剩余天数：', diffDays)
        if (now.isBefore(end)) setTrialDiffDays(diffDays)
    }, [])

    // 拉取用户配置
    useEffect(() => {
        // 改为直接获取
        window.electronAPI.getConfig().then((res: UserConfig) => {
            console.log('config', res)
            setAutoLaunch(res.autoLaunch)
            setShortcut(res.launchShortcut || '')
            setReportAgreement(res.report_agreement || false)
            setCurrentTheme(res.theme || 'default') //设置主题
            // 计算结束日以及还剩多少日结束
            if (!res.trialStartDate) return
            const trialEndDate = dayjs(res.trialStartDate).add(14, 'day')
            const now = dayjs()
            const diffDays = trialEndDate.diff(now, 'day')
            setTrialDiffDays(diffDays)
        })
        // 设置背景颜色
        window.electronAPI.setBackgroundColor(theme.palette.background.default);
        // // 手动检查一次更新
        // manualCheckUpdate()
    }, [])

    // 監聽更新狀態並在抽屜開啟時自動檢查（在非 Electron 環境下跳過）
    // useEffect(() => {
    //     if (isLoading) return
    //     if (!(window as any).electronAPI) {
    //         // 非 Electron 預覽環境：直接顯示最新版本提示
    //         setIsCheckingUpdate(false)
    //         setIsUpdateAvailable(false)
    //         setLatestVersion(null)
    //         setUpdateStatusText(t('app.settings.checkUpdateStatusLatest' as any))
    //         return
    //     }
    //     // 僅訂閱事件，不在此自動觸發檢查
    //     window.electronAPI.onUpdateStatus((data: any) => {
    //         console.log('update-status', data)
    //         setIsCheckingUpdate(false)
    //         if (data && data.isUpdateAvailable) {
    //             setIsUpdateAvailable(true)
    //             setLatestVersion(String(data.version || ''))
    //             setUpdateStatusText(t('app.settings.checkUpdateStatusNewVersion' as any, { version: data.version || '' }))
    //         } else {
    //             setIsUpdateAvailable(false)
    //             setLatestVersion(null)
    //             // 根据 data.type 映射到对应的多语言 key，确保有默认值兜底
    //             let msg: string
    //             switch (data.type) {
    //                 case 'not-available-update':
    //                     msg = t('app.settings.not-available-update')
    //                     break
    //                 default:
    //                     msg = t('app.settings.checkUpdateStatusLatest') // 兜底用“已是最新版”
    //             }
    //             setUpdateStatusText(msg)
    //         }
    //     })
    //     return () => {
    //         window.electronAPI.removeAllListeners('update-status')
    //     }
    // }, [open, t, isLoading])


    // const manualCheckUpdate = async () => {
    //     setIsCheckingUpdate(true)
    //     setUpdateStatusText(t('app.settings.checking' as any))
    //     await window.electronAPI.checkForUpdates()
    // }


    // 切换用户体验改进计划
    const toggleReportAgreement = async (checked: boolean) => {
        try {
            if (checked) {
                // 打开时，先跳转到该页面
                navigate('/improveTips')
            }
            else {
                // 关闭时，直接设置为false
                const params: ConfigParams = {
                    key: 'report_agreement',
                    value: checked,
                    type: 'boolean',
                }
                window.electronAPI.setConfig(params)

            }
        } catch (error) {
            console.error('toggleReportAgreement', error)
        } finally {
            setReportAgreement(checked)
        }
    }

    // 切換自啟動開關
    const toggleAutoLaunch = async (checked: boolean) => {
        setAutoLaunch(checked)
        await window.electronAPI.setAutoLaunch(checked)
    }


    return <div className="w-full max-h-[680px]! pb-6  overflow-y-auto scrollbar-thin" >
        <Stack direction='row' justifyContent='space-between' alignItems='center' >
            <Stack direction='row' spacing={1}>
                <Typography variant='headlineSmall' color='textPrimary' >
                    {t('app.settings.title')}
                </Typography>
                {
                    trialDiffDays !== null &&
                    <span
                        className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white uppercase tracking-wider rounded-full"
                        style={{
                            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.2)})`
                        }}
                    >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t('app.settings.trialDaysLeft' as any, { days: trialDiffDays })}
                    </span>
                }
                {/* {
                    isPro && (
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white uppercase tracking-wider rounded-full bg-linear-to-r from-purple-500 via-pink-500 to-red-500 ">
                            Pro
                        </span>
                    )
                } */}
            </Stack>
            <IconButton onClick={() => window.electronAPI.closeSettingsWindow()}>
                <CloseIcon sx={{ color: theme.palette.text.primary }} />
            </IconButton>
        </Stack>
        <Stack spacing={2} sx={{ marginTop: '16px' }}>
            {/* MCP服务 */}
            <Stack spacing={1}>
                <Typography variant='titleSmall' color='textPrimary' >
                    {t('app.settings.aiSettings')}
                </Typography>
                <SettingItem
                    title={t('app.settings.mcpProvider')}
                    type='button'
                    value={t('app.settings.open')}
                    onAction={() => {
                        navigate('/AIToolConfig')
                    }}
                />
            </Stack>
            <Stack spacing={1}>
                <Typography variant='titleSmall' color='textPrimary' >
                    {t('app.settings.system')}
                </Typography>
                {/* 更改主题 */}
                <SettingItem
                    title={t('app.settings.theme')}
                    value={currentTheme}
                    onAction={() => navigate('/ThemeSelect')}
                    type='button'
                />
                {/* 打开日志 */}
                <SettingItem
                    title={t('app.settings.logFolder')}
                    value={t('app.settings.open')}
                    onAction={() => window.electronAPI.openDir('runLog')}
                    type='button'
                />
                {/* 快捷键设置 */}
                <SettingItem
                    title={t('app.settings.Shortcut')}
                    type='button'
                    value={shortcut}
                    onAction={() => navigate('/hotkeys?from=setting')}
                />
                {/* 用户体验计划 */}
                <SettingItem
                    title={t('app.settings.userExperience')}
                    type='switch'
                    value={reportAgreement}
                    onAction={toggleReportAgreement}
                />
                {/* 检查更新 */}
                {/* <SettingItem
                                title={t('app.settings.checkUpdate')}
                                type='custom'
                                value={updateStatusText}
                                action={
                                    <Stack direction='row' alignItems='center' spacing={2}>
                                        <Typography variant="body2" color={'text.secondary'}>
                                            {updateStatusText || t('app.settings.checkUpdateStatusLatest' as any)}
                                        </Typography>
                                        <StyledButton
                                            disabled={isCheckingUpdate}
                                            variant='text'
                                            onClick={manualCheckUpdate}
                                        >
                                            {t('app.settings.check' as any)}
                                        </StyledButton>
                                    </Stack>
                                }
                            /> */}
                {/* 自动启动开关 */}
                <SettingItem
                    title={t('app.settings.autoLaunch')}
                    type='switch'
                    value={autoLaunch}
                    onAction={toggleAutoLaunch}
                />
            </Stack>
            <Stack spacing={1} >
                <Typography variant='titleSmall' >
                    {t('app.settings.language')}
                </Typography>
                <SettingItem
                    title={t('app.settings.language')}
                    type='custom'
                    onAction={() => { }}
                    action={<LanguageSwitcher variant='select' size='small' showLabel={false} />}
                />
            </Stack>
            <Stack spacing={1} >
                <Typography variant='titleSmall' color='textPrimary' >
                    {t('app.settings.contact')}
                </Typography>
                <Contact />
            </Stack>
        </Stack>
    </div>

}

export default Setting;
