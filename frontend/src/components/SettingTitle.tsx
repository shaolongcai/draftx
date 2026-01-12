import { IconButton, Stack, Typography } from "@mui/material"
import { ArrowBack as BackIcon } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"



interface Props {
    title: string,
}
/**
 * 设置页面的标题
 */
const SettingTitle: React.FC<Props> = ({
    title
}) => {

    const navigate = useNavigate()

    return (
        <Stack direction='row' alignItems='center' spacing={1}>
            <IconButton size='medium' onClick={() => { navigate(-1) }}>
                <BackIcon fontSize='medium' />
            </IconButton>
            <Typography variant='headlineMedium'>
                {title}
            </Typography>

        </Stack>
    )
}

export default SettingTitle