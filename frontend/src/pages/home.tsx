import { useState, useEffect, useRef } from 'react'
import { Card, Grid, Stack, Typography } from '@mui/material'
import { useDebounce, useKeyPress, useRequest, useSize } from 'ahooks'
import { Search, DraftItem, Editor, ToolBar } from '@/components'
import AITools from '@/components/AITools'
import { useEvent } from '@/contexts/EvenContext'

function Home() {


    const [searchValue, setSearchValue] = useState('')
    const [showDraftList, setShowDraftList] = useState(false)

    const debouncedValue = useDebounce(searchValue, { wait: 200 })
    const { handleOnclickTool$ } = useEvent()


    // 获取所有草稿
    const { data } = useRequest(
        () => window.electronAPI.getDraft(debouncedValue || ''),
        {
            refreshDeps: [debouncedValue, showDraftList],
            onError: (err) => {
                console.error('获取草稿失败:', err);
            }
        }
    );

    // 使用工具切换
    handleOnclickTool$.useSubscription((tool) => {
        console.log(tool)
        if (tool === 'allList') {
            setShowDraftList(true)
        } else if (tool === 'draft') {
            console.log('切换到草稿页')
            setShowDraftList(false)
        } else if (tool === 'addDraft') {
            setShowDraftList(false)
        }
    })


    return (
        <Stack direction='row' spacing={2}>
            <div>
                {/* 所有草稿列表 */}
                <Card className={`w-100 ${showDraftList ? 'block' : 'hidden'}`}>
                    <Search onSearch={setSearchValue} />
                    {
                        (data?.length > 0) &&
                        <Grid container columns={2} spacing={2}
                            className='max-h-140 overflow-auto  mt-4 overflow-y-auto'
                        >
                            {
                                data.map(item =>
                                    <Grid key={item.id} size={1} >
                                        <DraftItem
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
                    <div className='mx-auto mt-4 w-fit'>
                        <ToolBar currentPage='list' />
                    </div>
                </Card>
                {/* 要通过样式的hidden来隐藏，否则监听不了事件 */}
                <div className={showDraftList ? 'hidden' : ''}>
                    <Editor />
                </div>
            </div>
        </Stack>
    )
}

export default Home
