import { useState, useEffect, useRef } from 'react'
import { Grid, Stack, Typography } from '@mui/material'
import { useDebounce, useKeyPress, useRequest, useSize } from 'ahooks'
import { Search, MemoItem, Editor, MemoList } from '@/components'
import AITools from '@/components/AITools'
import { useEvent } from '@/contexts/EvenContext'

function Home() {


    const [searchValue, setSearchValue] = useState('')
    const [showDraftList, setShowDraftList] = useState(false)

    const debouncedValue = useDebounce(searchValue, { wait: 200 })
    const { handleOnclickTool$ } = useEvent()


    // 搜索
    const { data } = useRequest(
        () => window.electronAPI.searchSticky(debouncedValue),
        {
            ready: Boolean(debouncedValue),
            refreshDeps: [debouncedValue],
        }
    );

    // 使用工具切换
    handleOnclickTool$.useSubscription((tool) => {
        console.log(tool)
        if (tool === 'allList') {
            setShowDraftList(true)
        }
    })


    return (
        <Stack direction='row' spacing={2}>
            <div>
                {/* 所有草稿列表 */}
                {
                    showDraftList ?
                        <Stack>
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
                        </Stack>
                        :
                        <Editor />
                }
                {/* 要通过样式的hidden来隐藏，否则监听不了事件 */}
            </div>
        </Stack>
    )
}

export default Home
