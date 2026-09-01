/* eslint-disable react-refresh/only-export-components */
import ReactDOM from 'react-dom/client';
import Setting from '@/pages/setting';
import RootProviders from './RootProviders';
import './index.css'
import { useRef } from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { AIProvider } from './components';
import McpConfig from '@/pages/McpConfig';
import ProTips from '@/pages/ProTips';
import ActivationCode from '@/pages/ActivationCode';
import HotkeysConfig from './pages/HotkeysConfig';
import ImproveTips from './pages/ImproveTips';
import ThemeSelect from './pages/ThemeSelect';


const APP = () => {

    const rootRef = useRef(null);

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
                        <Route path="/AIToolConfig" element={<McpConfig />} />
                        <Route path="/ActivationCode" element={<ActivationCode />} />
                        <Route path="/ProTips" element={<ProTips />} />
                        <Route path="/hotkeys" element={<HotkeysConfig />} />
                        <Route path="/improveTips" element={<ImproveTips />} />
                        <Route path="/ThemeSelect" element={<ThemeSelect />} />
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
