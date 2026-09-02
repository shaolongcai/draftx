import { useEvent } from "@/contexts/EvenContext"
import { useTranslation } from "@/contexts/I18nContext"
import { formatModifiedTime } from "@/utils/formatTime"
import { alpha, useTheme } from "@mui/material"


interface Props {
    id: number,
    title?: string,
    /** 文件修改时间（毫秒时间戳） */
    mtime: number,
    snippet?: string,
    onClick?: (id: number) => void,
    uuid: string,
}
/**
 * 列表页笔记条目：标题（左）+ 修改时间（右）+ 内容预览，行间分割线
 */
const DraftItem: React.FC<Props> = ({
    id,
    title,
    mtime,
    snippet,
    onClick,
    uuid,
    ...rest
}) => {

    const { loadStickys$ } = useEvent()
    const theme = useTheme()
    const { t, currentLanguage } = useTranslation()

    // 点击条目
    const handleClick = () => {
        onClick?.(id)
        // 列表项不含正文，由编辑器收到事件后按需调 getDraftByUuid 取 content
        loadStickys$.emit({ ...rest, id, uuid, title, mtime } as DraftResult)
        console.log('点击草稿', uuid)
    }

    return <div
        className="cursor-pointer py-5 border-b last:border-b-0"
        style={{ borderColor: '#E1E0DA' }}
        onClick={handleClick}
    >
        {/* 标题 + 修改时间 */}
        <div className="flex items-baseline justify-between gap-4">
            <span
                className="text-2xl font-bold truncate"
                style={{ color: theme.palette.text.primary }}
            >
                {title}
            </span>
            <span
                className="text-base whitespace-nowrap select-none flex-none"
                style={{ color: alpha(theme.palette.text.primary, 0.45) }}
            >
                {formatModifiedTime(mtime, t, currentLanguage)}
            </span>
        </div>
        {/* 内容预览（两行截断） */}
        {snippet && (
            <div
                className="mt-1 text-lg leading-snug line-clamp-2 overflow-hidden"
                style={{ color: alpha(theme.palette.text.primary, 0.75) }}
            >
                <span
                    dangerouslySetInnerHTML={{
                        __html: snippet.replace(/<mark>/g,
                            `<mark class="bg-yellow-200 font-medium px-1"
                            style="color: ${theme.palette.text.primary}">`)
                    }}
                />
            </div>
        )}
    </div>
}


export default DraftItem
