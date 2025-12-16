import { useState, useEffect, useMemo, useRef } from 'react'
import { Stack } from '@mui/material'
import { useDebounce, useLocalStorageState, useRequest, useSize } from 'ahooks'
import './App.css'
import { Search, Editor, SearchItem } from '@/components'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider } from './contexts/EvenContext'

function App() {


  const [searchValue, setSearchValue] = useState('')
  const debouncedValue = useDebounce(searchValue, { wait: 200 })
  const rootRef = useRef(null)
  const size = useSize(rootRef)


  // 触发变更窗口大小
  useRequest(() => window.electronAPI.resizeWindow(size), {
    ready: Boolean(size),
    refreshDeps: [size],
  })

  // 搜索
  const { data } = useRequest(
    () => window.electronAPI.searchSticky(debouncedValue),
    {
      ready: Boolean(debouncedValue),
      refreshDeps: [debouncedValue],
    }
  );


  return (
    <NotificationsProvider slotProps={{
      snackbar: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        autoHideDuration: 2000,
      },
    }} >
      <ThemeProvider theme={theme}>
        <EventProvider>
          <Stack spacing={2} ref={rootRef} >
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
            <Search onSearch={setSearchValue} />
            {
              (data?.length > 0 && searchValue) &&
              <Stack spacing={1}>
                {
                  data.map(item => <SearchItem
                    id={item.id}
                    title={item.title}
                    content={item.content}
                    snippet={item.snippet}
                    {...item}
                  />)
                }
              </Stack>
            }
            <div className={searchValue ? 'hidden' : ''}>
              <Editor />
            </div>
          </Stack>
        </EventProvider>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
