import { DraftItem, Search } from "@/components"
import { Stack } from "@mui/material"
import { useDebounce, useRequest } from "ahooks"
import { useState } from "react"

interface Props {
    setCurrentPage: (page: 'draft' | 'list') => void
    currentPage: 'draft' | 'list'
}
const DraftList: React.FC<Props> = ({
    setCurrentPage,
    currentPage

}) => {

    const [searchValue, setSearchValue] = useState('')

    const debouncedValue = useDebounce(searchValue, { wait: 200 })

    // 获取所有草稿
    const { data } = useRequest(
        () => window.electronAPI.getDraft(debouncedValue || ''),
        {
            refreshDeps: [debouncedValue, currentPage],
            onError: (err) => {
                console.error('获取草稿失败:', err);
            }
        }
    );

    return < div
    // className={`${showDraftList ? '' : 'hidden'}`}
    >
        <Search onSearch={setSearchValue} />
        {
            (data?.length > 0) &&
            <div className='max-h-[calc(100vh-144px)] overflow-y-auto mt-4'>
                <Stack className='flex flex-wrap gap-2' direction='row' justifyContent='space-between'>
                    {
                        data.map(item =>
                            <div key={item.id} className='w-[200px] flex-none'>
                                <DraftItem
                                    id={item.id}
                                    title={item.title}
                                    content={item.content}
                                    snippet={item.snippet}
                                    uuid={item.uuid}
                                    lineClamp={5}
                                    onClick={() => setCurrentPage('draft')} //点击后跳转回草稿
                                    {...item}
                                />
                            </div>
                        )
                    }
                </Stack>
            </div>
        }
        {/* <div className='mx-auto mt-4 w-fit'>
            <ToolBar currentPage='list' />
        </div> */}
    </div >
}


export default DraftList