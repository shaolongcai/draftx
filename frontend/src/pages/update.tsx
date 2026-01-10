import { Button, LinearProgress, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import updateImage from '../assets/images/update.png'
import { useNavigate } from 'react-router-dom';




/**
 * 更新页面
 */
const Update = () => {

    const [downloadProgress, setDownloadProgress] = useState(0);
    const [checking, setChecking] = useState(true);

    const navigate = useNavigate();

    // 检查更新
    useEffect(() => {
        const checkUpdate = async () => {
            setChecking(true);
            const res = await window.electronAPI.checkForUpdates();
            if (res.isUpdateAvailable) {
                setChecking(false);
                // 有更新，显示更新按钮
                console.log('有更新', res.message);
            } else {
                console.log('无更新', res.message);
                navigate('/draft');
            }
        }
        checkUpdate();
    }, [navigate])

    // 监听下载新版本
    useEffect(() => {
        window.electronAPI.onDownloadProgress((progress: number) => {
            console.log('下载进度', progress);
            setDownloadProgress(progress);
        })
    }, [])


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
                {
                    checking ? 'Checking for updates...' :
                        downloadProgress > 0 ?
                            'Downloading update...' :
                            'A new version is available'
                }
            </Typography>
            {
                (downloadProgress === 0 && !checking) ?
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
                    :
                    <LinearProgress variant="determinate" value={downloadProgress} />
            }
        </Stack>
    )
}

export default Update