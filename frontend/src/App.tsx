import { useState, useEffect, useRef } from 'react'
import { Grid, Stack, Typography } from '@mui/material'
import { useDebounce, useKeyPress, useRequest, useSize } from 'ahooks'
import './App.css'
import { Search, MemoItem, Editor2, MemoList } from '@/components'
import { ThemeProvider } from '@mui/material'
import { theme } from './theme'
import { NotificationsProvider } from '@toolpad/core/useNotifications';
import { EventProvider } from './contexts/EvenContext'

function App() {


  const [searchValue, setSearchValue] = useState('')
  const [showMemoList, setShowMemoList] = useState(false)
  const debouncedValue = useDebounce(searchValue, { wait: 200 })
  const rootRef = useRef(null)
  const size = useSize(rootRef)

  // 注册alt+s 展示出memoList
  useKeyPress('alt.s', () => {
    setShowMemoList(pre => !pre);
  })


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
        <EventProvider >
          <div ref={rootRef} className='w-fit'>
            {/* 展示最近的memo,要通过样式的hidden来隐藏，否则监听不了事件 */}
            <Stack spacing={2} className={`w-lg ${showMemoList ? 'hidden' : ''}`}>
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
                <Grid container columns={2} className='max-h-[600px] overflow-auto'>
                  {
                    data.map(item =>
                      <Grid key={item.id} size={1} >
                        <MemoItem
                          id={item.id}
                          title={item.title}
                          content={item.content}
                          snippet={item.snippet}
                          lineClamp={5}
                          {...item}
                        />
                      </Grid>
                    )
                  }
                </Grid>
              }
              <div className={searchValue ? 'hidden' : ''}>
                <Editor2 />
              </div>
              <Stack
                // onClick={() => setShowMemoList(pre => !pre)}
                className='bg-[#F9F3E5] opacity-85 p-2 rounded-md mx-auto w-fit'
                direction="row" spacing={0.5} alignItems="center" justifyContent='center'
              >
                <span className="border border-text-secondary border-gray-300  rounded px-2 py-1 text-xs leading-none">
                  Alt
                </span>
                <Typography variant="bodySmall" color="textSecondary">+</Typography>
                <span className="border border-text-secondary border-gray-300  rounded px-2 py-1 text-xs leading-none">
                  S
                </span>
                <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                  to display the most recent memos
                </Typography>
              </Stack>
            </Stack>
            {/* 展示memo列表 */}
            <MemoList handleChooseMemo={() => setShowMemoList(false)} isOpen={showMemoList} />
          </div>
        </EventProvider>
      </ThemeProvider>
    </NotificationsProvider>
  )
}

export default App
