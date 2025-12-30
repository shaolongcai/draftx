import ReactDOM from 'react-dom/client';
import Setting from '@/pages/setting';
import RootProviders from './RootProviders';
import './index.css'
import { useRef } from 'react';
import { useSize, useRequest } from 'ahooks';


const APP = () => {

    const rootRef = useRef(null);
    const size = useSize(rootRef)

    // 触发变更窗口大小
    useRequest(() => window.electronAPI.resizeWindow('settingsWindow', size), {
        ready: Boolean(size),
        refreshDeps: [size],
    })

    return (
        <RootProviders>
            <div ref={rootRef} style={{ display: 'inline-block' }}>
                <Setting />
            </div>
        </RootProviders>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<APP />);

// 禁止root滚动
// document.body.style.overflow = 'hidden';
