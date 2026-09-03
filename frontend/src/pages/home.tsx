import { useEffect } from 'react'
import { EditorContext } from '@/components'
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { useGlobal } from '@/contexts/GlobalContext';

const Editor: React.FC = () => {

    const theme = useTheme();
    const navigate = useNavigate();
    const { setTrialEndDate } = useGlobal()

    // 监听主题变化，设置窗口背景颜色
    useEffect(() => {
        if (theme.palette.background.default) {
            window.electronAPI.setBackgroundColor(theme.palette.background.default);
        }
    }, [window.electronAPI.getConfig('theme')])


    // 初始化路由（开屏引导由 App.tsx 路由门控处理，这里只做激活/协议/快捷键检查）
    useEffect(() => {
        const init = async () => {
            // 检查是否有激活，进入激活码环节
            const isPro = await window.electronAPI.verifyLicense()
            if (!isPro) {
                // 检查是否在试用中
                const trialRes = await window.electronAPI.verifyTrial()
                if (trialRes.trialType === 'VALID') {
                    setTrialEndDate(trialRes.trialEndDate) // 试用期中，才会设置试用期的endDate
                    // 试用有效，跳转到首页
                    navigate('/')
                    return
                }
                navigate('/activationCode')
                return
            }
            // 检查是否有提交改进协议
            const hasShowedImproveTips = await window.electronAPI.getConfig('report_agreement');
            if (hasShowedImproveTips === null) {
                navigate('/improveTips')
                return
            }
            // 检查是否有设置快捷键
            const hasSetShortcut = await window.electronAPI.getConfig('launchShortcut');
            if (!hasSetShortcut) {
                navigate('/hotkeys')
            }
        }
        init()
    }, [])

    return <div className="overflow-hidden" >
        <EditorContext />
    </div>
}

export default Editor
