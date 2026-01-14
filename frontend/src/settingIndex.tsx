import ReactDOM from 'react-dom/client';
import Setting from '@/pages/setting';
import RootProviders from './RootProviders';
import './index.css'
import { useRef } from 'react';
import { useSize } from 'ahooks';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AIProvider } from './components';
import AITools from './pages/AITools';
import AIToolConfig from './pages/AIToolConfig';


const APP = () => {

    const rootRef = useRef(null);
    const size = useSize(rootRef)

    // 触发变更窗口大小
    // useRequest(() => window.electronAPI.resizeWindow('settingsWindow', size), {
    //     ready: Boolean(size),
    //     refreshDeps: [size],
    // })

    return (
        <RootProviders>
            <HashRouter>
                <div ref={rootRef} >
                    {/* 顶部拖拽条 */}
                    <div
                        className="drag absolute top-0 left-0 right-0 h-8 z-10 "
                    />
                    <style>{`
                /* root隐藏滚动条但保持可滚动 */
                ::-webkit-scrollbar {
                    display: none;
                }
                
                /* 适用于Firefox */
                * {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
            `}</style>
                    <Routes>
                        <Route path="/" element={<Setting />} />
                        <Route path="/AIProvider" element={<AIProvider />} />
                        <Route path="/AITools" element={<AITools />} />
                        <Route path="/AIToolConfig" element={<AIToolConfig />} />
                    </Routes>
                    <div />
                </div>
            </HashRouter>
        </RootProviders>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<APP />);

// 禁止root滚动
// document.body.style.overflow = 'hidden';
