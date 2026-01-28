import { useState, useEffect, useRef } from 'react'
import { EditorContext } from '@/components'
import { useNavigate } from 'react-router-dom';


const Editor: React.FC = () => {


    const [showTips, setShowTips] = useState(true);

    const navigate = useNavigate();


    useEffect(() => {
        const t = setTimeout(() => setShowTips(false), 5000)
        return () => clearTimeout(t)
    }, [])


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
