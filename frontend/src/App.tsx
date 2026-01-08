import { useState, useEffect, useRef } from 'react'
import { useRequest, useSize } from 'ahooks'
import './App.css'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider } from './contexts/EvenContext'
import Home from './pages/home'

function App() {

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
          <div ref={rootRef} className='w-fit'>
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
            <Home />
          </div>
        </EventProvider>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
