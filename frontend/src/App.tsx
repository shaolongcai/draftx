import { useState, useEffect, useRef } from 'react'
import { useRequest, useSize } from 'ahooks'
import './App.css'
import { Stack, ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider, useEvent } from './contexts/EvenContext'
import Home from './pages/home'
import { ToolBar } from './components'
import DraftList from './pages/draftList'

function App() {

  const [currentPage, setCurrentPage] = useState<'draft' | 'list'>('draft') //当前的页面

  const rootRef = useRef(null)
  const size = useSize(rootRef)

  // 触发变更窗口大小
  // useRequest(() => window.electronAPI.resizeWindow('mainWindow', size), {
  //   ready: Boolean(size),
  //   refreshDeps: [size],
  // })


  return (
    <NotificationsProvider slotProps={{
      snackbar: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        autoHideDuration: 2000,
      },
    }} >
      <ThemeProvider theme={theme}>
        <EventProvider >
          <div ref={rootRef} >
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
            {/* <ToolBar currentPage='list' /> */}
          </div>
        </EventProvider>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
