import { Stack, Typography, IconButton } from "@mui/material"
import { useEffect, useState } from "react";
import {
    Close as CloseIcon
} from '@mui/icons-material';
// import { useGlobalContext } from "@/contexts/globalContext";
import { Contact, SettingItem } from "@/components";
// import { useTranslation } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
// import LanguageSwitcher from '@/components/LanguageSwitcher';



/**
 * 设置面板(主界面)
 */
const Setting = () => {


    const [aiProvider, setAiProvider] = useState<{ host: string, model: string }>() //是否已设置AI服务
    const [openType, setOpenType] = useState<'AIProvider' | 'AITools' | 'AIconfig' | null>(null)  //打开的弹窗类型
    // 更新檢查相關狀態
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
    const [latestVersion, setLatestVersion] = useState<string | null>(null)
    const [updateStatusText, setUpdateStatusText] = useState('')
    const [autoLaunch, setAutoLaunch] = useState(false) //是否開機自啟動
    const [isPro, setIsPro] = useState(false) //是否已激活Pro版 

    // const context = useGlobalContext();
    // const { t, isLoading } = useTranslation()
    const navigate = useNavigate();

    // 拉取用户配置
    useEffect(() => {
        // 改为直接获取
        window.electronAPI.getConfig().then((res: UserConfig) => {
            console.log('config', res)
            setAutoLaunch(res.autoLaunch)
            setAiProvider(JSON.parse(res.ai_provider || '{}'))
        })
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
    // const toggleReportAgreement = async (checked: boolean) => {
    //     if (checked) {
    //         // 同意用户体验改进计划，需要弹窗
    //         setOpenReportProtocol(true)
    //         setOpenSetting(false)
    //     }
    //     setReportAgreement(checked)
    //     const params: ConfigParams = {
    //         key: 'report_agreement',
    //         value: checked,
    //         type: 'boolean',
    //     }
    //     window.electronAPI.setConfig(params)
    // }

    // 切換自啟動開關
    const toggleAutoLaunch = async (checked: boolean) => {
        setAutoLaunch(checked)
        await window.electronAPI.setAutoLaunch(checked)
    }


    return <div
        className="w-full max-h-[680px]!  overflow-y-auto 
                    scrollbar-thin
                    "
    >
        {/* {
                // 同意用户体验改进计划弹窗
                openReportProtocol &&
                <ReportProtocol
                    onFinish={() => {
                        setOpenReportProtocol(false)
                        setOpenSetting(true)
                    }}
                />
            } */}
        <Stack direction='row' justifyContent='space-between' alignItems='center' >
            <Typography variant='headlineSmall' >
                Setting
            </Typography>
            <IconButton onClick={() => window.electronAPI.closeSettingsWindow()}>
                <CloseIcon />
            </IconButton>
        </Stack>
        <Stack spacing={2} sx={{ marginTop: '16px' }}>
            <Stack spacing={1}>
                <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                    AI Sever
                </Typography>
                <SettingItem
                    title='AI Provider'
                    type='button'
                    value={aiProvider?.model || 'Set'}
                    onAction={() => {
                        isPro ? navigate('/AIProvider') : navigate('/ProTips')
                    }}
                />
                <SettingItem
                    title='AI Tool'
                    type='button'
                    value='SET'
                    onAction={() => {
                        isPro ? navigate('/AITools') : navigate('/ProTips')
                    }}
                />
            </Stack>
            <Stack spacing={1}>
                <Typography variant='titleSmall' className='color-rgba(0, 0, 0, 0.85)' >
                    System
                </Typography>
                {/* 打开日志 */}
                <SettingItem
                    title='Log Folder'
                    value='Open'
                    onAction={() => window.electronAPI.openDir('runLog')}
                    type='button'
                />
                {/* 用户体验计划 */}
                {/* <SettingItem
                                title={t('app.settings.userExperience')}
                                type='switch'
                                value={reportAgreement}
                                onAction={toggleReportAgreement}
                            /> */}
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
                    title='Auto Launch'
                    type='switch'
                    value={autoLaunch}
                    onAction={toggleAutoLaunch}
                />
            </Stack>
            {/* <Stack spacing={1} >
                            <Typography variant='titleSmall' >
                                Language
                            </Typography>
                            <SettingItem
                                title={t('app.settings.language')}
                                type='custom'
                                onAction={() => { }}
                                action={<LanguageSwitcher variant='select' size='small' showLabel={false} />}
                            />
                        </Stack> */}
            <Stack spacing={1} >
                <Typography variant='titleSmall' >
                    Contact
                </Typography>
                <Contact />
            </Stack>
        </Stack>
    </div>

}


export default Setting;