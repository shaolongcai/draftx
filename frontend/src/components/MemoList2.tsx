import { Grid, Stack, Typography } from "@mui/material"
import MemoItem from "./MemoItem"
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

    if (!isOpen) return null

    return <Grid container columns={4} className='w-[1024px]'>
        {
            data?.map(item => {
                return (
                    <Grid key={item.id} size={1} >
                        <MemoItem
                            id={item.id}
                            content={item.content}
                            height='200px'
                            onClick={(id) => handleChooseMemo()}
                        />
                    </Grid>
                )
            })
        }
        <Stack
            className='bg-[#F9F3E5] opacity-85 p-2 rounded-md mx-auto w-fit mt-2'
            direction="row" spacing={0.5} alignItems="center" justifyContent='center'
        >
            <Typography variant="bodySmall" color="textSecondary" className="pl-1">
                Only the most recent 12 items are shown
            </Typography>
        </Stack>
    </Grid>

}

export default MemoList