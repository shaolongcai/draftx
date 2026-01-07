import { useEvent } from "@/contexts/EvenContext"
import { Card, Stack, Typography } from "@mui/material"


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
    content: string,
    snippet?: string,
    height?: string,
    onClick?: (id: number) => void,
    lineClamp?: number
}
/**
 * 搜索结果
 */
const DraftItem: React.FC<Props> = ({
    id,
    title,
    content,
    snippet,
    height = '160px',
    onClick,
    lineClamp = 8,
    ...rest
}) => {

    const { loadStickys$ } = useEvent()

    const clampClass = (lineClampMap as Record<number, string>)[lineClamp] ?? 'line-clamp-6'

    // 点击卡片
    const handleClick = () => {
        loadStickys$.emit({ ...rest, content, id } as DraftResult)
        onClick?.(id)
    }

    return <Card className="cursor-pointer  border border-[#9F7207]/25 "
        onClick={handleClick}
        sx={{
            height
        }}
    >
        <Stack spacing={1} >
            {/* <Typography variant='bodyMedium'>
                {title}
            </Typography> */}
            <Typography variant='bodyMedium'
                className={`${clampClass} overflow-hidden`}
            >
                {snippet ? (
                    // 这里要注意，显示的是snippet片段，而不是content，内容数量要在搜索器中调整
                    <span
                        dangerouslySetInnerHTML={{
                            __html: snippet.replace(/<mark>/g, '<mark class="bg-yellow-200 text-gray-900 font-medium px-1">')
                        }}
                    />
                ) : (
                    <span className="block">{content}</span>
                )}
            </Typography>
        </Stack>
    </Card>
}


export default DraftItem