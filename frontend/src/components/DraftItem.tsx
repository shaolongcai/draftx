import { useEvent } from "@/contexts/EvenContext"
import { historyStack } from "@/utils/histroyStack";
import { Card, Stack, Typography, useTheme } from "@mui/material"


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
    lineClamp?: number,
    uuid: string,
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
    uuid,
    ...rest
}) => {

    const { loadStickys$ } = useEvent()
    const theme = useTheme()

    const clampClass = (lineClampMap as Record<number, string>)[lineClamp] ?? 'line-clamp-6'

    // 点击卡片
    const handleClick = () => {
        onClick?.(id)
        loadStickys$.emit({ ...rest, content, id, uuid } as DraftResult)
        console.log('点击草稿', uuid)
        // 压栈
        // historyStack.push(uuid);
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
            <Typography variant='bodyMedium' color={theme.palette.text.primary!}
                className={`${clampClass} overflow-hidden`}
            >
                {snippet ? (
                    // 这里要注意，显示的是snippet片段，而不是content，内容数量要在搜索器中调整 snippet现在已经没有用
                    <span
                        dangerouslySetInnerHTML={{
                            __html: snippet.replace(/<mark>/g,
                                `<mark class="bg-yellow-200 font-medium px-1" 
                                style="color: ${theme.palette.text.primary} opacity: 0.65">`)
                        }}
                    />
                ) : (
                    <span className="block" color={theme.palette.text.primary} style={{ opacity: 0.85 }}>{content}</span>
                )}
            </Typography>
        </Stack>
    </Card>
}


export default DraftItem