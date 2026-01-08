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
        if (tool === 'allList') {
            setShowDraftList(true)
        } else if (tool === 'draft') {
            setShowDraftList(false)
        } else if (tool === 'addDraft') {
            setShowDraftList(false)
        }
    })


    return (
        <div>
            {/* 所有草稿列表 */}
            <div className={`${showDraftList ? '' : 'hidden'}`}>
                <Search onSearch={setSearchValue} />
                {
                    (data?.length > 0) &&
                    <Grid container columns={2} spacing={2}
                        className='max-h-[calc(100vh-144px)] overflow-auto  mt-4 overflow-y-auto'
                    >
                        {
                            data.map(item =>
                                <Grid key={item.id} size={1} className='flex-shrink-0'>
                                    <DraftItem
                                        id={item.id}
                                        title={item.title}
                                        content={item.content}
                                        snippet={item.snippet}
                                        lineClamp={5}
                                        onClick={() => setShowDraftList(false)}
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
            </div>
            {/* 要通过样式的hidden来隐藏，否则监听不了事件 */}
            <div className={showDraftList ? 'hidden' : ''}>
                <Editor />
            </div>
        </div>
    )
}

export default Home
