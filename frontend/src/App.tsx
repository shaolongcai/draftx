import { useState, useRef, useEffect } from 'react'
import './App.css'
import Home from './pages/home'
import { ToolBar, NotesDrawer, GuideDot } from './components'
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';
import { EditorProvider, useEditor } from './contexts/EditorContext'
import HotkeysConfig from './pages/HotkeysConfig'
import ImproveTips from './pages/ImproveTips'
import RootProviders from './RootProviders'
import ActivationCode from './pages/ActivationCode'
import Onboarding from './pages/Onboarding'
import SelectLanguage from './pages/SelectLanguage'
import { useNavigate } from 'react-router-dom'



function App() {

  const [currentPage, setCurrentPage] = useState<'draft' | 'list'>('draft') //当前的页面
  const navigate = useNavigate();
  const rootRef = useRef(null)


  // 路由,如果从未完成引导会先跳转到选择语言页
  useEffect(() => {
    // 读取后端是否完成引导
    window.electronAPI.getConfig('isFinishGuide').then((done) => {
      if (!done) {
        // 跳转到选择语言页
        navigate('/select-language', { replace: true });
        return;
      }
    });
  }, [])

  // 冷启动门控：本次会话未展示开屏动画时，首页直接重定向到引导页
  // （同步读取 sessionStorage，避免先挂载首页编辑器再异步跳转造成的闪屏）
  // 注：App 内 useNavigate 订阅了 location，路由变化时会重新计算该值
  const needOnboarding = !sessionStorage.getItem('onboarding_shown')



  return (
    <RootProviders>
      <EditorProvider>
        {/* {
                import.meta.env.DEV &&
                <div className='absolute top-0 left-0 right-0 h-8 z-10 bg-primary text-primary-contrastText text-center'>开发环境</div>
              } */}
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
            {/* 首页（本次会话未展示开屏动画时先跳引导页） */}
            <Route path='/'
              element={needOnboarding ? <Navigate to='/onboarding' replace /> : <>
                <div className={`${currentPage === 'draft' ? '' : 'hidden'}`}>
                  <Home />
                </div>
                {/* 旧 ToolBar 仅在草稿页显示，列表页使用 ListBottomBar（见 draftList.tsx） */}
                {currentPage === 'draft' && (
                  <div className='absolute bottom-0 left-0 right-0 z-20'>
                    <ToolBar
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                    />
                  </div>
                )}
                {/* 右侧「全部笔记」抽屉（仅草稿页）：搜索 + 全部笔记列表，可收起，参考 item-index.html */}
                {currentPage === 'draft' && <NotesDrawer />}
                {/* 新手引导小红点（仅草稿页）：笔记 ≤ 3 篇时左下角常驻 */}
                {currentPage === 'draft' && <GuideDot />}
              </>}
            />
            {/* 开屏动画页（每次启动都会出现；未完成引导时会先跳语言选择页） */}
            <Route path='/onboarding' element={<Onboarding />} />
            {/* 语言选择页（仅首次引导时出现，确认后进入开屏动画页） */}
            <Route path='/select-language' element={<SelectLanguage />} />
            {/* 更新提示 */}
            <Route path='/activationCode' element={<ActivationCode />} />
            {/* 配置热键 */}
            <Route path='/hotkeys' element={<HotkeysConfig />} />
            {/* 提升体验提示 */}
            <Route path='/improveTips' element={<ImproveTips />} />
          </Routes>
        </div>
      </EditorProvider>
    </RootProviders>
  )
}

export default App
