import { useState, useRef, useEffect } from 'react'
import { useSize } from 'ahooks'
import './App.css'
import { Stack, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { theme as editorTheme } from './theme/editorTheme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider } from './contexts/EvenContext'
import Home from './pages/home'
import { ToolBar } from './components'
import DraftList from './pages/draftList'
import { Routes, Route, HashRouter } from 'react-router-dom';
import Update from './pages/update'
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { mermaidNode } from "@/nodes/MermaidNode";
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HorizontalRuleNode } from '@/nodes/HorizontalRuleNode';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { MathNode } from "@/nodes/MathNode";
import { MathItemNode } from "@/nodes/MathItemNode";
import { BlockTitleNode } from "@/nodes/BlockTitleNode";
import { BlockTipNode } from "@/nodes/BlockTipNode";
import { PasteNode } from "@/nodes/PasteNode";
import { LoadingNode } from "@/nodes/LoadingNode";
import HotkeysConfig from './pages/HotkeysConfig'
import ImproveTips from './pages/ImproveTips'
import { CaluResultNode } from './nodes/CaluResultNode'
import { UnitConversionNode } from './nodes/UnitConversionNode'
import { CurrencyConversionNode } from './nodes/CurrencyConversionNode'

function App() {

  const [currentPage, setCurrentPage] = useState<'draft' | 'list'>('draft') //当前的页面

  const rootRef = useRef(null)
  const size = useSize(rootRef)

  // 触发变更窗口大小
  // useRequest(() => window.electronAPI.resizeWindow('mainWindow', size), {
  //   ready: Boolean(size),
  //   refreshDeps: [size],
  // })


  const initialConfig = {
    namespace: 'MyEditor',
    theme: editorTheme,
    onError: (error: Error) => {
      console.error(error.message);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableCellNode,
      HorizontalRuleNode,
      TableRowNode,
      BlockTitleNode,
      BlockTipNode,
      mermaidNode,
      MathNode,
      MathItemNode,
      PasteNode,
      LoadingNode,
      CaluResultNode,
      UnitConversionNode,
      CurrencyConversionNode,
    ],
  };

  return (
    <NotificationsProvider slotProps={{
      snackbar: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        autoHideDuration: 2000,
      },
    }} >
      <ThemeProvider theme={theme}>
        <EventProvider >
          <LexicalComposer initialConfig={initialConfig}>
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
                  {/* 首页 */}
                  <Route path='/'
                    element={<>
                      <div className={`${currentPage === 'draft' ? '' : 'hidden'}`}>
                        <Home />
                      </div>
                      <div className={`${currentPage === 'list' ? '' : 'hidden'}`}>
                        <DraftList setCurrentPage={setCurrentPage} currentPage={currentPage} />
                      </div>
                      <Stack className='absolute bottom-6 left-0 right-0 px-4 h-4'>
                        <ToolBar
                          currentPage={currentPage}
                          setCurrentPage={setCurrentPage}
                        />
                      </Stack>
                    </>}
                  />
                  {/* 更新提示 */}
                  {/* <Route path='/' element={<Update />} /> */}
                  {/* 配置热键 */}
                  <Route path='/hotkeys' element={<HotkeysConfig />} />
                  {/* 提升体验提示 */}
                  <Route path='/improveTips' element={<ImproveTips />} />
                </Routes>
              </div>
            </HashRouter>
          </LexicalComposer>
        </EventProvider>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
