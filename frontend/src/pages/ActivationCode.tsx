import { SettingTitle } from "@/components"
import { Button, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import axios from 'axios'
import { useNotifications } from "@toolpad/core/useNotifications"

/**
 * 激活码页面
 */
const ActivationCode: React.FC = () => {

    const [machineId, setMachineId] = useState('') // 新增状态管理机器码
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const notifications = useNotifications()

    // 组件挂载时获取机器码
    useEffect(() => {
        window.electronAPI.getMachineId().then(setMachineId);
    }, []);

    const handleActivate = async () => {
        if (!code.trim()) return

        setLoading(true)
        try {
            // 向服务器发送激活码
            const res = await axios.post('https://api.draftx.cc/osai/activationCode/use', { code, deviceHash: machineId })
            if (res.data.code === 0) {
                notifications.show('Activation Success', {
                    severity: 'success',
                    autoHideDuration: 1200,
                });
            }
            throw res.data.errMsg
        } catch (error) {
            console.error(error)
            const msg = error instanceof Error ? error.message : String(error)
            notifications.show(msg, {
                severity: 'error',
                autoHideDuration: 1800,
            });
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <SettingTitle title="Activation" />
            <Stack className="mt-6 w-full max-w-[400px] mx-auto" spacing={3} alignItems='center'>
                <TextField
                    fullWidth
                    label="Activation Code"
                    variant="outlined"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter your code here"
                    disabled={loading}
                    size="small"
                    helperText="📌 The activation code can be used 3 times. Once activated, it cannot be cancelled and no refunds will be provided. Please ensure you are connected to the internet during activation."
                />

                <Button
                    variant='contained'
                    onClick={handleActivate}
                    disabled={!code.trim() || loading}
                    fullWidth
                    size="large"
                >
                    {loading ? 'Activating...' : 'Activate'}
                </Button>
            </Stack>
        </>
    )
}

export default ActivationCode