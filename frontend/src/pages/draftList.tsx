import { DraftItem, ListBottomBar, Search } from "@/components"
import { useTranslation } from "@/contexts/I18nContext"
import { alpha, useTheme } from "@mui/material"
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
    const { t } = useTranslation()
    const theme = useTheme()

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

    return <div className="h-screen flex flex-col px-10 pt-12">
        {/* 头部：标题 + 搜索框 */}
        <div className="flex items-center justify-between gap-4">
            <h1
                className="text-4xl font-bold select-none"
                style={{ color: theme.palette.text.primary }}
            >
                {t('app.list.myNotes')}
            </h1>
            <div className="w-[320px] flex-none">
                <Search onSearch={setSearchValue} />
            </div>
        </div>
        <div className="border-b mt-4" style={{ borderColor: '#E1E0DA' }} />

        {/* 笔记列表（底部留出 ListBottomBar 的空间） */}
        <div className="flex-1 overflow-y-auto pb-20">
            {
                (data?.length > 0) &&
                <>
                    {
                        data.map(item =>
                            <DraftItem
                                key={item.id}
                                id={item.id}
                                title={item.title}
                                mtime={item.mtime}
                                snippet={item.snippet}
                                uuid={item.uuid}
                                onClick={() => setCurrentPage('draft')} //点击后跳转回草稿
                                {...item}
                            />
                        )
                    }
                    {/* 列表结束标记 */}
                    <div
                        className="text-center py-8 select-none tracking-widest"
                        style={{ color: alpha(theme.palette.text.primary, 0.35) }}
                    >
                        {t('app.list.end')}
                    </div>
                </>
            }
        </div>

        {/* 列表页底部栏：进入时显示，3 秒后渐变隐藏，hover 再显示 */}
        <ListBottomBar
            currentPage={currentPage}
            total={data?.length ?? 0}
            setCurrentPage={setCurrentPage}
        />
    </div >
}


export default DraftList
