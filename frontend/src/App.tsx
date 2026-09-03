import { useState, useRef } from 'react'
import './App.css'

import Home from './pages/home'
import { ToolBar, NotesDrawer } from './components'
import DraftList from './pages/draftList'
import { Routes, Route, HashRouter } from 'react-router-dom';
import { EditorProvider } from './contexts/EditorContext'
import HotkeysConfig from './pages/HotkeysConfig'
import ImproveTips from './pages/ImproveTips'
import RootProviders from './RootProviders'
import ActivationCode from './pages/ActivationCode'



function App() {

  const [currentPage, setCurrentPage] = useState<'draft' | 'list'>('draft') //当前的页面
  const rootRef = useRef(null)

  return (
    <RootProviders>
      <EditorProvider>
        <HashRouter>
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
              {/* 首页 （所有页面均先进入这个） */}
              <Route path='/'
                element={<>
                  <div className={`${currentPage === 'draft' ? '' : 'hidden'}`}>
                    <Home />
                  </div>
                  <div className={`${currentPage === 'list' ? '' : 'hidden'}`}>
                    <DraftList setCurrentPage={setCurrentPage} currentPage={currentPage} />
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
                </>}
              />
              {/* 更新提示 */}
              <Route path='/activationCode' element={<ActivationCode />} />
              {/* 配置热键 */}
              <Route path='/hotkeys' element={<HotkeysConfig />} />
              {/* 提升体验提示 */}
              <Route path='/improveTips' element={<ImproveTips />} />
            </Routes>
          </div>
        </HashRouter>
      </EditorProvider>
    </RootProviders>
  )
}

export default App
