import { useState, useEffect, useRef } from 'react'
import { EditorContext } from '@/components'
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';


const Editor: React.FC = () => {

    const [showTips, setShowTips] = useState(true);
    const theme = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const t = setTimeout(() => setShowTips(false), 5000)
        return () => clearTimeout(t)
    }, [])

    // 监听主题变化，设置窗口背景颜色
    useEffect(() => {
        if (theme.palette.background.default) {
            window.electronAPI.setBackgroundColor(theme.palette.background.default);
        }
    }, [window.electronAPI.getConfig('theme')])


    // 初始化路由
    useEffect(() => {
        const init = async () => {
            // 检查是否有激活，进入激活码环节
            const isPro = await window.electronAPI.verifyLicense()
            if (!isPro) {
                // 检查是否在试用中
                const trialRes = await window.electronAPI.verifyTrial()
                if (trialRes.trialType === 'VALID') {
                    console.log('正在试用期中')
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
        // 稍等200ms
        setTimeout(() => {
            init()
        }, 200)
    }, [])

    return <div className="overflow-hidden" >
        <EditorContext />
    </div>
}

export default Editor
