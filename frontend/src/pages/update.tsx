import { Button, Stack, Typography } from "@mui/material";
import { useCallback, useEffect } from "react";
import updateImage from '../assets/images/update.png'
import { useNavigate } from 'react-router-dom';






/**
 * 更新页面
 */
const Update = () => {

    const navigate = useNavigate();

    // 检查更新
    useEffect(() => {

        const checkUpdate = async () => {
            const res = await window.electronAPI.checkForUpdates();
            if (res.isUpdateAvailable) {
                // 有更新，显示更新按钮
                console.log('有更新', res.message);
            } else {
                console.log('无更新', res.message);
                navigate('/draft');
            }
        }

        checkUpdate();
    }, [navigate])


    // 处理更新
    const handleUpdate = useCallback(async () => {
        try {
            await window.electronAPI.downloadUpdate();
        } catch (error) {
            console.error('更新失败', error);
        }
    }, []);

    return (
        <Stack spacing={2} alignItems="center" className="m-10" >
            <img src={updateImage} alt="init" className="w-45 h-45" />
            <Typography variant='bodyLarge' color='textPrimary' >
                A new version avaliba
            </Typography>
            <Stack spacing={1} alignItems="center">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdate}
                >
                    Update
                </Button>
                <Button variant="outlined" className="w-fit" onClick={() => {
                    navigate('/draft');
                }}>
                    later
                </Button>
            </Stack>
        </Stack>
    )
}

export default Update