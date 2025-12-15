import { Card, Stack, Typography } from "@mui/material"


interface Props {
    title: string,
    content: string,
    snippet?: string,
}
/**
 * 搜索结果
 */
const SearchItem: React.FC<Props> = ({
    title,
    content,
    snippet,
}) => {
    return <Card>
        <Stack spacing={1}>
            <Typography variant='bodyMedium'>
                {title}
            </Typography>
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