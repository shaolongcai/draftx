import { useEvent } from "@/contexts/EvenContext"
import { Card, Stack, Typography } from "@mui/material"


interface Props {
    id: number,
    title: string,
    content: string,
    snippet?: string,
}
/**
 * 搜索结果
 */
const SearchItem: React.FC<Props> = ({
    id,
    title,
    content,
    snippet,
    ...rest
}) => {

    const { loadStickys$ } = useEvent()

    // 点击卡片
    const handleClick = () => {
        loadStickys$.emit({ ...rest, content, id } as StickyResult)
    }

    return <Card className="cursor-pointer h-[160px] " onClick={handleClick} >
        <Stack spacing={1} >
            {/* <Typography variant='bodyMedium'>
                {title}
            </Typography> */}
            <Typography variant='bodyMedium'
                className="line-clamp-2 text-ellipsis overflow-hidden"
            >
                {snippet ? (
                    <span
                        dangerouslySetInnerHTML={{
                            __html: snippet.replace(/<mark>/g, '<mark class="bg-yellow-200 text-gray-900 font-medium px-1">')
                        }}
                    />
                ) : (
                    <span className="truncate block">{content}</span>
                )}
            </Typography>
        </Stack>
    </Card>
}


export default SearchItem