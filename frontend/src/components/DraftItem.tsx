import { useEvent } from "@/contexts/EvenContext"
import { Card, Stack, Typography, useTheme } from "@mui/material"
import dayjs from "dayjs"


// 截断行数的映射
const lineClampMap = {
    5: 'line-clamp-5',
    6: 'line-clamp-6',
    7: 'line-clamp-7',
    8: 'line-clamp-8',
};


interface Props {
    id: number,
    title?: string,
    /** 文件修改时间（毫秒时间戳） */
    mtime: number,
    snippet?: string,
    height?: string,
    onClick?: (id: number) => void,
    lineClamp?: number,
    uuid: string,
}
/**
 * 搜索结果
 */
const DraftItem: React.FC<Props> = ({
    id,
    title,
    mtime,
    snippet,
    height = '160px',
    onClick,
    lineClamp = 8,
    uuid,
    ...rest
}) => {

    const { loadStickys$ } = useEvent()
    const theme = useTheme()

    const clampClass = (lineClampMap as Record<number, string>)[lineClamp] ?? 'line-clamp-6'

    // 点击卡片
    const handleClick = () => {
        onClick?.(id)
        // 列表项不含正文，由编辑器收到事件后按需调 getDraftByUuid 取 content
        loadStickys$.emit({ ...rest, id, uuid, title, mtime } as DraftResult)
        console.log('点击草稿', uuid)
    }

    return <Card className="cursor-pointer  border  "
        onClick={handleClick}
        sx={{
            height,
            borderColor: `${theme.palette.primary.main}40`, // 25% 透明度
        }}
    >
        <Stack spacing={1} >
            <Typography fontWeight={700} variant='bodyMedium'>
                {title}
            </Typography>
            <Typography variant='caption' color={theme.palette.text.secondary!}>
                {dayjs(mtime).format('YYYY-MM-DD HH:mm')}
            </Typography>
            {snippet && (
                <Typography variant='bodyMedium' color={theme.palette.text.primary!}
                    className={`${clampClass} overflow-hidden`}
                >
                    <span
                        dangerouslySetInnerHTML={{
                            __html: snippet.replace(/<mark>/g,
                                `<mark class="bg-yellow-200 font-medium px-1" 
                                style="color: ${theme.palette.text.primary} opacity: 0.65">`)
                        }}
                    />
                </Typography>
            )}
        </Stack>
    </Card>
}


export default DraftItem
