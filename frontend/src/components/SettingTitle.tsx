import { IconButton, Stack, Typography, useTheme } from "@mui/material"
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
    const theme = useTheme()

    return (
        <Stack direction='row' alignItems='center' spacing={1}>
            <IconButton size='medium' onClick={() => { navigate(-1) }} sx={{ color: theme.palette.text.primary }}>
                <BackIcon fontSize='medium' />
            </IconButton>
            <Typography variant='headlineMedium' color={theme.palette.text.primary}>
                {title}
            </Typography>

        </Stack>
    )
}

export default SettingTitle