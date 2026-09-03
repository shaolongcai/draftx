import { useEffect, useState } from "react";
import { X as CloseIcon } from "lucide-react";
import { Contact, SettingItem, LanguageSwitcher } from "@/components";
import { useTranslation } from '@/contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { ConfigParams } from "@/type/electron";
import { useGlobal } from "@/contexts/GlobalContext";
import dayjs from "dayjs";

/**
 * 设置分组卡片
 */
const SettingCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="w-full rounded-2xl bg-[#EBE1D3] px-6 py-4">
        <h2 className="mb-1 text-xl font-medium text-[#3A332C]">{title}</h2>
        <div className="divide-y divide-[#3A332C]/10">
            {children}
        </div>
    </section>
)

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
        // 设置窗口为透明窗口，背景色由 settingIndex 的面板承载，无需再设置窗口背景色
    }, [])

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


    return <div className="flex h-full w-full flex-col px-12 pt-8" >
        {/* 标题栏（固定不滚动） */}
        <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
                <h1 className="text-[32px] font-semibold text-[#3A332C]">
                    {t('app.settings.title')}
                </h1>
                {
                    trialDiffDays !== null &&
                    <span className="inline-flex items-center justify-center rounded-full bg-[#3A332C] px-3 py-1 text-xs font-bold tracking-wider text-[#F5F4EF] uppercase">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t('app.settings.trialDaysLeft' as any, { days: trialDiffDays })}
                    </span>
                }
            </div>
            {/* 关闭按钮 */}
            <button
                type='button'
                onClick={() => window.electronAPI.closeSettingsWindow()}
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#3A332C] text-[#3A332C] transition-colors hover:bg-[#3A332C]/5"
            >
                <CloseIcon className="size-4" strokeWidth={2.5} />
            </button>
        </div>

        {/* 可滚动内容区 */}
        <div className="mt-5 flex-1 overflow-y-auto scrollbar-thin pb-8">
        <div className="flex flex-col gap-4">
            {/* AI 服务 */}
            <SettingCard title={t('app.settings.aiSettings')}>
                <SettingItem
                    title={t('app.settings.aiProvider')}
                    type='button'
                    value={t('app.settings.set')}
                    onAction={() => navigate('/AIProvider')}
                />
                <SettingItem
                    title={t('app.settings.mcpProvider')}
                    type='button'
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={t('app.settings.view' as any)}
                    onAction={() => navigate('/AIToolConfig')}
                />
            </SettingCard>

            {/* 系统 */}
            <SettingCard title={t('app.settings.system')}>
                {/* 更改主题（暂时隐藏） */}
                {/* <SettingItem
                    title={t('app.settings.theme')}
                    value={currentTheme}
                    onAction={() => navigate('/ThemeSelect')}
                    type='button'
                /> */}
                {/* 打开日志 */}
                <SettingItem
                    title={t('app.settings.logFolder')}
                    value={t('app.settings.open')}
                    onAction={() => window.electronAPI.openDir('runLog')}
                    type='button'
                />
                {/* 打开 MD 文件夹 */}
                <SettingItem
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    title={t('app.settings.mdFolder' as any)}
                    value={t('app.settings.open')}
                    onAction={() => window.electronAPI.openDir('notes')}
                    type='button'
                />
                {/* 快捷键设置 */}
                <SettingItem
                    title={t('app.settings.Shortcut')}
                    type='button'
                    value={shortcut || t('app.settings.set')}
                    onAction={() => navigate('/hotkeys?from=setting')}
                />
                {/* 自动启动开关 */}
                <SettingItem
                    title={t('app.settings.autoLaunch')}
                    type='switch'
                    value={autoLaunch}
                    onAction={toggleAutoLaunch}
                />
                {/* 用户体验计划 */}
                <SettingItem
                    title={t('app.settings.userExperience')}
                    type='switch'
                    value={reportAgreement}
                    onAction={toggleReportAgreement}
                />
            </SettingCard>

            {/* 语言 */}
            <SettingCard title={t('app.settings.language')}>
                <SettingItem
                    title={t('app.settings.language')}
                    type='custom'
                    onAction={() => { }}
                    action={<LanguageSwitcher variant='select' size='small' showLabel={false} />}
                />
            </SettingCard>

            {/* 联系我们 */}
            <SettingCard title={t('app.settings.contact')}>
                <Contact />
            </SettingCard>
        </div>
        </div>
    </div>

}

export default Setting;
