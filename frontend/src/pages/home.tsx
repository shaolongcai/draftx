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
            console.log('theme.palette.background.default', theme.palette.background.default)
            window.electronAPI.setBackgroundColor(theme.palette.background.default);
        }
    }, [theme.palette.background.default])


    // 初始化路由
    useEffect(() => {
        const init = async () => {
            const hasShowedImproveTips = await window.electronAPI.getConfig('report_agreement');
            console.log('hasShowedImproveTips', hasShowedImproveTips)
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
