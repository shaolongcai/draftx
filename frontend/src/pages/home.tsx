import { useState, useEffect, useRef } from 'react'
import { Grid, Stack, Typography } from '@mui/material'
import { useDebounce, useKeyPress, useRequest, useSize } from 'ahooks'
import { Search, MemoItem, Editor, MemoList } from '@/components'
import AITools from '@/components/AITools'

function Home() {


    const [searchValue, setSearchValue] = useState('')
    const [showMemoList, setShowMemoList] = useState(false)
    const [showAITools, setShowAITools] = useState(false)

    const debouncedValue = useDebounce(searchValue, { wait: 200 })

    // 注册alt+s 展示出memoList
    useKeyPress('alt.s', () => {
        setShowMemoList(pre => !pre);
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
        <Stack direction='row' spacing={2}>
            <div>
                {/* 展示最近的memo,要通过样式的hidden来隐藏，否则监听不了事件 */}
                <Stack spacing={2} className={`w-lg ${showMemoList ? 'hidden' : ''}`}>
                    <Search onSearch={setSearchValue} />
                    {
                        (data?.length > 0 && searchValue) &&
                        <Grid container columns={2} className='max-h-150 overflow-auto'>
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
                        <Editor />
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
            {/* AI工具 */}
            <AITools open={showAITools} mode='add' />
        </Stack>
    )
}

export default Home
