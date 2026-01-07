import { Grid, Stack, Typography } from "@mui/material"
import MemoItem from "./DraftItem"
import { useRequest } from "ahooks";


interface Props {
    handleChooseMemo: () => void
    isOpen: boolean
}
const MemoList: React.FC<Props> = ({
    handleChooseMemo,
    isOpen
}) => {

    // 获取最近项目
    const { data } = useRequest(
        () => window.electronAPI.getRecentStickys(12),
        {
            refreshDeps: [isOpen],
        }
    );

    // 根据memo数量渲染列数与宽度
    const genColumsAndWidth = (itemCount: number) => {
        if (itemCount <= 1) {
            return {
                columns: 1,
                width: 320,
            }
        }
        else if (itemCount === 2) {
            return {
                columns: 2,
                width: 600,
            }
        }
        else if (itemCount === 3) {
            return {
                columns: 3,
                width: 900,
            }
        }
        else if (itemCount >= 4) {
            return {
                columns: 4,
                width: 1024,
            }
        }
    }

    if (!isOpen) return null

    return <>
        <Grid container columns={genColumsAndWidth(data?.length || 0).columns} sx={{
            width: genColumsAndWidth(data?.length || 0).width, // 根据数量决定容器宽度
        }}>
            {
                data?.map(item => {
                    return (
                        <Grid key={item.id} size={1} >
                            <MemoItem
                                id={item.id}
                                content={item.content}
                                height='200px'
                                onClick={(id) => handleChooseMemo()}
                                lineClamp={8}
                                {...item}
                            />
                        </Grid>
                    )
                })
            }
        </Grid>
        <Stack
            className='bg-[#F9F3E5] opacity-85 p-2 rounded-md mx-auto w-fit mt-2'
            direction="row" spacing={0.5} alignItems="center" justifyContent='center'
        >
            <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                Only the most recent 12 items are shown
            </Typography>
        </Stack>
    </>
}

export default MemoList